"""VOSviewer network building, temporary storage, and serving routes."""

import json
import secrets
import time
from typing import List

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from google.cloud import storage
from pydantic import BaseModel

from .auth import require_auth
from .config import SOURCE, VOS_BUCKET
from .db import run_query

router = APIRouter()


def _vos_blob(token: str):
    if not VOS_BUCKET:
        raise HTTPException(status_code=500, detail="ORION_VOS_BUCKET is not configured")
    return storage.Client().bucket(VOS_BUCKET).blob(f"vos/{token}.json")

def _store_vos(data: dict) -> str:
    """Store network data and return a token valid for 10 minutes."""
    token = secrets.token_urlsafe(24)
    blob = _vos_blob(token)
    blob.metadata = {"expires": str(time.time() + 600)}
    blob.cache_control = "no-store"
    blob.upload_from_string(json.dumps(data), content_type="application/json")
    return token

@router.get("/api/vos/{token}")
def vos_serve(token: str):
    """Serve a pre-built VOSviewer JSON to VOSviewer Online (no auth required)."""
    blob = _vos_blob(token)
    if not blob.exists():
        raise HTTPException(status_code=404, detail="Token not found or expired")
    blob.reload()
    expires = float((blob.metadata or {}).get("expires", "0"))
    if expires < time.time():
        blob.delete()
        raise HTTPException(status_code=404, detail="Token not found or expired")
    data = json.loads(blob.download_as_text())
    return JSONResponse(
        content=data,
        headers={
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "https://app.vosviewer.com",
        },
    )

class VosInstRequest(BaseModel):
    institution_ids: List[int]
    year_from: int = 2000
    year_to: int = 2025
    limit: int = 100
    all_works: bool = False


class VosFunderRequest(BaseModel):
    funder_ids: List[int]
    year_from: int = 2000
    year_to: int = 2025
    limit: int = 100
    all_works: bool = False


VOS_ENTITY = {
    "institutions": {
        "link": "work_affiliation_institution",
        "id": "institution_id",
        "table": "institution",
        "name": "institution",
        "item": "institution",
        "item_title": "Institution",
        "items": "institutions",
        "link_strength": "co-occurring works",
    },
    "funders": {
        "link": "work_grant",
        "id": "funder_id",
        "table": "funder",
        "name": "funder",
        "item": "funder",
        "item_title": "Funder",
        "items": "funders",
        "link_strength": "co-funded works",
    },
}


def _same_type_vos_nodes(entity: dict, ids: list[int], yf: int, yt: int, limit: int, project_id: str):
    """Return basket nodes plus the top same-type co-occurring nodes."""
    return run_query(f"""
        WITH basket_works AS (
            SELECT DISTINCT l.work_id
            FROM `{SOURCE}.{entity['link']}` l
            JOIN `{SOURCE}.work` w ON l.work_id = w.work_id
            WHERE l.{entity['id']} IN UNNEST(@ids)
              AND w.pub_year BETWEEN @year_from AND @year_to
        ),
        basket_nodes AS (
            SELECT e.{entity['id']} AS id,
                   e.{entity['name']} AS label,
                   e.country_iso_alpha2_code AS country,
                   COUNT(DISTINCT l.work_id) AS works_count,
                   TRUE AS is_basket
            FROM `{SOURCE}.{entity['link']}` l
            JOIN `{SOURCE}.work` w ON l.work_id = w.work_id
            JOIN `{SOURCE}.{entity['table']}` e ON l.{entity['id']} = e.{entity['id']}
            WHERE l.{entity['id']} IN UNNEST(@ids)
              AND w.pub_year BETWEEN @year_from AND @year_to
            GROUP BY e.{entity['id']}, e.{entity['name']}, e.country_iso_alpha2_code
        ),
        co_nodes AS (
            SELECT e.{entity['id']} AS id,
                   e.{entity['name']} AS label,
                   e.country_iso_alpha2_code AS country,
                   COUNT(DISTINCT l.work_id) AS works_count,
                   FALSE AS is_basket
            FROM `{SOURCE}.{entity['link']}` l
            JOIN `{SOURCE}.{entity['table']}` e ON l.{entity['id']} = e.{entity['id']}
            WHERE l.work_id IN (SELECT work_id FROM basket_works)
              AND l.{entity['id']} NOT IN UNNEST(@ids)
            GROUP BY e.{entity['id']}, e.{entity['name']}, e.country_iso_alpha2_code
        )
        SELECT id, label, country, works_count, is_basket
        FROM (
            SELECT * FROM basket_nodes
            UNION ALL
            SELECT * FROM co_nodes
        )
        ORDER BY is_basket DESC, works_count DESC
        LIMIT @limit
    """, {"ids": ids, "year_from": yf, "year_to": yt, "limit": limit}, project_id)


def _refresh_vos_node_sizes(entity: dict, node_rows: list[dict], yf: int, yt: int, project_id: str):
    """Resize nodes using all works for each node, not only the basket-related works."""
    node_ids = [r["id"] for r in node_rows]
    size_rows, _ = run_query(f"""
        SELECT l.{entity['id']} AS id,
               COUNT(DISTINCT l.work_id) AS works_count
        FROM `{SOURCE}.{entity['link']}` l
        JOIN `{SOURCE}.work` w ON l.work_id = w.work_id
        WHERE l.{entity['id']} IN UNNEST(@node_ids)
          AND w.pub_year BETWEEN @year_from AND @year_to
        GROUP BY l.{entity['id']}
    """, {"node_ids": node_ids, "year_from": yf, "year_to": yt}, project_id)
    size_map = {r["id"]: r["works_count"] for r in size_rows}
    for row in node_rows:
        row["works_count"] = size_map.get(row["id"], row["works_count"])


def _same_type_vos_edges(
    entity: dict,
    ids: list[int],
    node_ids: list[int],
    yf: int,
    yt: int,
    all_works: bool,
    project_id: str,
):
    """Return same-type links, optionally restricted to works involving the basket."""
    basket_cte = ""
    basket_filter = ""
    params = {"node_ids": node_ids, "year_from": yf, "year_to": yt}
    if not all_works:
        basket_cte = f"""
            WITH basket_works AS (
                SELECT DISTINCT l.work_id
                FROM `{SOURCE}.{entity['link']}` l
                JOIN `{SOURCE}.work` w ON l.work_id = w.work_id
                WHERE l.{entity['id']} IN UNNEST(@ids)
                  AND w.pub_year BETWEEN @year_from AND @year_to
            )
        """
        basket_filter = "AND l1.work_id IN (SELECT work_id FROM basket_works)"
        params["ids"] = ids

    return run_query(f"""
        {basket_cte}
        SELECT l1.{entity['id']} AS source_id,
               l2.{entity['id']} AS target_id,
               COUNT(DISTINCT l1.work_id) AS strength
        FROM `{SOURCE}.{entity['link']}` l1
        JOIN `{SOURCE}.{entity['link']}` l2
            ON l1.work_id = l2.work_id
           AND l1.{entity['id']} < l2.{entity['id']}
        JOIN `{SOURCE}.work` w ON l1.work_id = w.work_id
        WHERE l1.{entity['id']} IN UNNEST(@node_ids)
          AND l2.{entity['id']} IN UNNEST(@node_ids)
          AND w.pub_year BETWEEN @year_from AND @year_to
          {basket_filter}
        GROUP BY source_id, target_id
        HAVING strength > 0
    """, params, project_id)


def _vos_response(
    entity: dict,
    node_rows: list[dict],
    edge_rows: list[dict],
    title: str,
    description: str,
    basket_ids: list[int] | None = None,
):
    basket_set = set(basket_ids or [])
    items = [
        {
            "id": r["id"],
            "label": r["label"],
            "description": r.get("country") or "",
            "weights": {"Works": r["works_count"]},
            "cluster": 1 if r["id"] in basket_set else 2,
        }
        for r in node_rows
    ]
    links = [
        {"source_id": r["source_id"], "target_id": r["target_id"], "strength": r["strength"]}
        for r in edge_rows
    ]
    return JSONResponse({
        "token": _store_vos({
            "network": {"items": items, "links": links},
            "config": {
                "terminology": {
                    "item": entity["item"],
                    "items": entity["items"],
                    "link_strength": entity["link_strength"],
                },
                "parameters": {"item_size": 2, "largest_component": True},
            },
            "info": {"title": title, "description": description},
        })
    })


def _build_same_type_vos(
    entity_type: str,
    ids: list[int],
    yf: int,
    yt: int,
    lim: int,
    all_works: bool,
    project_id: str,
):
    """Build a VOSviewer co-occurrence network for one basket type."""
    entity = VOS_ENTITY[entity_type]
    if not ids:
        raise HTTPException(status_code=400, detail=f"No {entity['item']} IDs provided")

    limit = max(lim, len(ids))
    node_rows, _ = _same_type_vos_nodes(entity, ids, yf, yt, limit, project_id)
    node_ids = [r["id"] for r in node_rows]
    if len(node_ids) < 2:
        raise HTTPException(status_code=400, detail=f"Not enough co-occurring {entity['items']} to build a network")

    if all_works:
        _refresh_vos_node_sizes(entity, node_rows, yf, yt, project_id)

    edge_rows, _ = _same_type_vos_edges(entity, ids, node_ids, yf, yt, all_works, project_id)
    works_label = f"all works among map {entity['items']}" if all_works else f"works involving basket {entity['items']}"
    return _vos_response(
        entity,
        node_rows,
        edge_rows,
        f"{entity['item_title']} co-occurrence network ({yf}-{yt})",
        (
            f"Nodes: basket {entity['items']} (cluster 1, {len(ids)}) + "
            f"top co-occurring {entity['items']} (cluster 2). "
            f"Node size and edge strength based on {works_label}. "
            f"Year range: {yf}-{yt}."
        ),
        ids,
    )


def _build_cross_vos(
    source_type: str,
    target_type: str,
    ids: list[int],
    yf: int,
    yt: int,
    lim: int,
    all_works: bool,
    project_id: str,
):
    """Build a target-type network from a source-type basket."""
    source = VOS_ENTITY[source_type]
    target = VOS_ENTITY[target_type]
    if not ids:
        raise HTTPException(status_code=400, detail=f"No {source['item']} IDs provided")

    node_rows, _ = run_query(f"""
        WITH basket_works AS (
            SELECT DISTINCT s.work_id
            FROM `{SOURCE}.{source['link']}` s
            JOIN `{SOURCE}.work` w ON s.work_id = w.work_id
            WHERE s.{source['id']} IN UNNEST(@ids)
              AND w.pub_year BETWEEN @year_from AND @year_to
        )
        SELECT e.{target['id']} AS id,
               e.{target['name']} AS label,
               e.country_iso_alpha2_code AS country,
               COUNT(DISTINCT t.work_id) AS works_count
        FROM `{SOURCE}.{target['link']}` t
        JOIN `{SOURCE}.{target['table']}` e ON t.{target['id']} = e.{target['id']}
        WHERE t.work_id IN (SELECT work_id FROM basket_works)
        GROUP BY e.{target['id']}, e.{target['name']}, e.country_iso_alpha2_code
        ORDER BY works_count DESC
        LIMIT @limit
    """, {"ids": ids, "year_from": yf, "year_to": yt, "limit": lim}, project_id)

    node_ids = [r["id"] for r in node_rows]
    if len(node_ids) < 2:
        raise HTTPException(status_code=400, detail=f"Not enough co-occurring {target['items']} to build a network")

    if all_works:
        _refresh_vos_node_sizes(target, node_rows, yf, yt, project_id)

    if all_works:
        edge_sql = f"""
            SELECT t1.{target['id']} AS source_id,
                   t2.{target['id']} AS target_id,
                   COUNT(DISTINCT t1.work_id) AS strength
            FROM `{SOURCE}.{target['link']}` t1
            JOIN `{SOURCE}.{target['link']}` t2
                ON t1.work_id = t2.work_id
               AND t1.{target['id']} < t2.{target['id']}
            JOIN `{SOURCE}.work` w ON t1.work_id = w.work_id
            WHERE t1.{target['id']} IN UNNEST(@node_ids)
              AND t2.{target['id']} IN UNNEST(@node_ids)
              AND w.pub_year BETWEEN @year_from AND @year_to
            GROUP BY source_id, target_id
            HAVING strength > 0
        """
        edge_params = {"node_ids": node_ids, "year_from": yf, "year_to": yt}
    else:
        edge_sql = f"""
            WITH basket_works AS (
                SELECT DISTINCT s.work_id
                FROM `{SOURCE}.{source['link']}` s
                JOIN `{SOURCE}.work` w ON s.work_id = w.work_id
                WHERE s.{source['id']} IN UNNEST(@ids)
                  AND w.pub_year BETWEEN @year_from AND @year_to
            )
            SELECT t1.{target['id']} AS source_id,
                   t2.{target['id']} AS target_id,
                   COUNT(DISTINCT t1.work_id) AS strength
            FROM `{SOURCE}.{target['link']}` t1
            JOIN `{SOURCE}.{target['link']}` t2
                ON t1.work_id = t2.work_id
               AND t1.{target['id']} < t2.{target['id']}
            JOIN `{SOURCE}.work` w ON t1.work_id = w.work_id
            WHERE t1.{target['id']} IN UNNEST(@node_ids)
              AND t2.{target['id']} IN UNNEST(@node_ids)
              AND t1.work_id IN (SELECT work_id FROM basket_works)
              AND w.pub_year BETWEEN @year_from AND @year_to
            GROUP BY source_id, target_id
            HAVING strength > 0
        """
        edge_params = {"node_ids": node_ids, "ids": ids, "year_from": yf, "year_to": yt}

    edge_rows, _ = run_query(edge_sql, edge_params, project_id)
    works_label = f"all works among map {target['items']}" if all_works else f"works involving basket {source['items']}"
    return _vos_response(
        target,
        node_rows,
        edge_rows,
        f"{target['item_title']} co-occurrence network from basket {source['items']} ({yf}-{yt})",
        (
            f"Nodes: top co-occurring {target['items']} linked to the basket {source['items']}. "
            f"Node size and edge strength based on {works_label}. "
            f"Year range: {yf}-{yt}."
        ),
    )


@router.post("/api/vos/build/institutions")
def vos_build_institutions(req: VosInstRequest, request: Request):
    session = require_auth(request)
    return _build_same_type_vos(
        "institutions",
        req.institution_ids,
        req.year_from,
        req.year_to,
        req.limit,
        req.all_works,
        session["project_id"],
    )


@router.post("/api/vos/build/institutions/co-funders")
def vos_build_institution_co_funders(req: VosInstRequest, request: Request):
    session = require_auth(request)
    return _build_cross_vos(
        "institutions",
        "funders",
        req.institution_ids,
        req.year_from,
        req.year_to,
        req.limit,
        req.all_works,
        session["project_id"],
    )


@router.post("/api/vos/build/funders/co-institutions")
def vos_build_funder_co_institutions(req: VosFunderRequest, request: Request):
    session = require_auth(request)
    return _build_cross_vos(
        "funders",
        "institutions",
        req.funder_ids,
        req.year_from,
        req.year_to,
        req.limit,
        req.all_works,
        session["project_id"],
    )


@router.post("/api/vos/build/funders")
def vos_build_funders(req: VosFunderRequest, request: Request):
    session = require_auth(request)
    return _build_same_type_vos(
        "funders",
        req.funder_ids,
        req.year_from,
        req.year_to,
        req.limit,
        req.all_works,
        session["project_id"],
    )


