"""Basket analysis routes for works, co-occurrence, and topics."""

from typing import List

from fastapi import APIRouter, Request
from pydantic import BaseModel

from .auth import require_auth
from .config import CACHE_OFF, SOURCE
from .db import cached, run_query

router = APIRouter()
class InstBasketRequest(BaseModel):
    institution_ids: List[int]
    year_from: int = 2000
    year_to: int = 2025
    limit: int = 5000

@router.post("/api/basket/institutions/works")
def basket_inst_works(req: InstBasketRequest, request: Request):
    """Total distinct works for a basket of institutions."""
    session = require_auth(request)
    pid = session["project_id"]
    if not req.institution_ids:
        return cached({"total_works": 0, "bytes_processed": 0}, CACHE_OFF)
    yf, yt, ids = req.year_from, req.year_to, req.institution_ids
    rows, bp = run_query(f"""
        SELECT COUNT(DISTINCT wai.work_id) AS total_works
        FROM `{SOURCE}.work_affiliation_institution` wai
        JOIN `{SOURCE}.work` w ON wai.work_id = w.work_id
        WHERE wai.institution_id IN UNNEST(@ids)
          AND w.pub_year BETWEEN @year_from AND @year_to
    """, {"ids": ids, "year_from": yf, "year_to": yt}, pid)
    return cached({"total_works": rows[0]["total_works"] if rows else 0, "bytes_processed": bp}, CACHE_OFF)

@router.post("/api/basket/institutions/co-institutions")
def basket_inst_co_institutions(req: InstBasketRequest, request: Request):
    """Institutions that co-occur (at work level) with the basket institutions."""
    session = require_auth(request)
    pid = session["project_id"]
    if not req.institution_ids:
        return cached({"rows": [], "bytes_processed": 0}, CACHE_OFF)
    yf, yt, lim, ids = req.year_from, req.year_to, req.limit, req.institution_ids
    rows, bp = run_query(f"""
        SELECT i.institution_id, i.institution AS name,
               i.country_iso_alpha2_code AS country,
               it.institution_type AS type,
               COUNT(DISTINCT wai2.work_id) AS works_count
        FROM `{SOURCE}.work_affiliation_institution` wai
        JOIN `{SOURCE}.work` w ON wai.work_id = w.work_id
        JOIN `{SOURCE}.work_affiliation_institution` wai2
            ON wai.work_id = wai2.work_id
           AND wai2.institution_id NOT IN UNNEST(@ids)
        JOIN `{SOURCE}.institution` i ON wai2.institution_id = i.institution_id
        LEFT JOIN `{SOURCE}.institution_type` it ON i.institution_type_id = it.institution_type_id
        WHERE wai.institution_id IN UNNEST(@ids)
          AND w.pub_year BETWEEN @year_from AND @year_to
        GROUP BY i.institution_id, i.institution, i.country_iso_alpha2_code, it.institution_type
        ORDER BY works_count DESC LIMIT @limit
    """, {"ids": ids, "year_from": yf, "year_to": yt, "limit": lim}, pid)
    return cached({"rows": rows, "bytes_processed": bp}, CACHE_OFF)

@router.post("/api/basket/institutions/co-funders")
def basket_inst_co_funders(req: InstBasketRequest, request: Request):
    """Funders that co-occur (at work level) with the basket institutions."""
    session = require_auth(request)
    pid = session["project_id"]
    if not req.institution_ids:
        return cached({"rows": [], "bytes_processed": 0}, CACHE_OFF)
    yf, yt, lim, ids = req.year_from, req.year_to, req.limit, req.institution_ids
    rows, bp = run_query(f"""
        SELECT f.funder_id, f.funder AS name,
               f.country_iso_alpha2_code AS country,
               COUNT(DISTINCT wg.work_id) AS works_count
        FROM `{SOURCE}.work_affiliation_institution` wai
        JOIN `{SOURCE}.work` w ON wai.work_id = w.work_id
        JOIN `{SOURCE}.work_grant` wg ON w.work_id = wg.work_id
        JOIN `{SOURCE}.funder` f ON wg.funder_id = f.funder_id
        WHERE wai.institution_id IN UNNEST(@ids)
          AND w.pub_year BETWEEN @year_from AND @year_to
        GROUP BY f.funder_id, f.funder, f.country_iso_alpha2_code
        ORDER BY works_count DESC LIMIT @limit
    """, {"ids": ids, "year_from": yf, "year_to": yt, "limit": lim}, pid)
    return cached({"rows": rows, "bytes_processed": bp}, CACHE_OFF)

# ── Funder Basket ─────────────────────────────────────────────────────────────

class FunderBasketRequest(BaseModel):
    funder_ids: List[int]
    year_from: int = 2000
    year_to: int = 2025
    limit: int = 5000

@router.post("/api/basket/funders/works")
def basket_funder_works(req: FunderBasketRequest, request: Request):
    """Total distinct works funded by the basket funders."""
    session = require_auth(request)
    pid = session["project_id"]
    if not req.funder_ids:
        return cached({"total_works": 0, "bytes_processed": 0}, CACHE_OFF)
    yf, yt, ids = req.year_from, req.year_to, req.funder_ids
    rows, bp = run_query(f"""
        SELECT COUNT(DISTINCT wg.work_id) AS total_works
        FROM `{SOURCE}.work_grant` wg
        JOIN `{SOURCE}.work` w ON wg.work_id = w.work_id
        WHERE wg.funder_id IN UNNEST(@ids)
          AND w.pub_year BETWEEN @year_from AND @year_to
    """, {"ids": ids, "year_from": yf, "year_to": yt}, pid)
    return cached({"total_works": rows[0]["total_works"] if rows else 0, "bytes_processed": bp}, CACHE_OFF)

@router.post("/api/basket/funders/co-institutions")
def basket_funder_co_institutions(req: FunderBasketRequest, request: Request):
    """Institutions that co-occur (at work level) with the basket funders."""
    session = require_auth(request)
    pid = session["project_id"]
    if not req.funder_ids:
        return cached({"rows": [], "bytes_processed": 0}, CACHE_OFF)
    yf, yt, lim, ids = req.year_from, req.year_to, req.limit, req.funder_ids
    rows, bp = run_query(f"""
        SELECT i.institution_id, i.institution AS name,
               i.country_iso_alpha2_code AS country,
               it.institution_type AS type,
               COUNT(DISTINCT wai.work_id) AS works_count
        FROM `{SOURCE}.work_grant` wg
        JOIN `{SOURCE}.work` w ON wg.work_id = w.work_id
        JOIN `{SOURCE}.work_affiliation_institution` wai ON w.work_id = wai.work_id
        JOIN `{SOURCE}.institution` i ON wai.institution_id = i.institution_id
        LEFT JOIN `{SOURCE}.institution_type` it ON i.institution_type_id = it.institution_type_id
        WHERE wg.funder_id IN UNNEST(@ids)
          AND w.pub_year BETWEEN @year_from AND @year_to
        GROUP BY i.institution_id, i.institution, i.country_iso_alpha2_code, it.institution_type
        ORDER BY works_count DESC LIMIT @limit
    """, {"ids": ids, "year_from": yf, "year_to": yt, "limit": lim}, pid)
    return cached({"rows": rows, "bytes_processed": bp}, CACHE_OFF)

@router.post("/api/basket/funders/co-funders")
def basket_funder_co_funders(req: FunderBasketRequest, request: Request):
    """Funders that co-occur (at work level) with the basket funders."""
    session = require_auth(request)
    pid = session["project_id"]
    if not req.funder_ids:
        return cached({"rows": [], "bytes_processed": 0}, CACHE_OFF)
    yf, yt, lim, ids = req.year_from, req.year_to, req.limit, req.funder_ids
    rows, bp = run_query(f"""
        SELECT f.funder_id, f.funder AS name,
               f.country_iso_alpha2_code AS country,
               COUNT(DISTINCT wg2.work_id) AS works_count
        FROM `{SOURCE}.work_grant` wg
        JOIN `{SOURCE}.work` w ON wg.work_id = w.work_id
        JOIN `{SOURCE}.work_grant` wg2
            ON wg.work_id = wg2.work_id
           AND wg2.funder_id NOT IN UNNEST(@ids)
        JOIN `{SOURCE}.funder` f ON wg2.funder_id = f.funder_id
        WHERE wg.funder_id IN UNNEST(@ids)
          AND w.pub_year BETWEEN @year_from AND @year_to
        GROUP BY f.funder_id, f.funder, f.country_iso_alpha2_code
        ORDER BY works_count DESC LIMIT @limit
    """, {"ids": ids, "year_from": yf, "year_to": yt, "limit": lim}, pid)
    return cached({"rows": rows, "bytes_processed": bp}, CACHE_OFF)

# ── Topic / micro-cluster breakdown ──────────────────────────────────────────
# Uses the openalex_2023nov_classification dataset (separate from SOURCE).
# work_ids are cross-compatible between snapshots.
#
# For each basket we:
#   1. Collect the distinct work_ids for the basket in the given year range.
#   2. Join with cwts-leiden.openalex_2023nov_classification.clustering to get
#      the micro_cluster_id for each work (works without a cluster are ignored).
#   3. Join with the micro_cluster table to get the long_label.
#   4. Return the absolute count and the proportion relative to the total
#      cluster size (also filtered to the same year range via the SOURCE work table).

CLASSIFICATION = "cwts-leiden.openalex_2023nov_classification"

@router.post("/api/basket/institutions/topics")
def basket_inst_topics(req: InstBasketRequest, request: Request):
    """Micro-cluster topic breakdown for a basket of institutions.
    Returns ALL micro-clusters (within the year range), with basket_works_count=0
    for clusters where the basket has no publications."""
    session = require_auth(request)
    pid = session["project_id"]
    if not req.institution_ids:
        return cached({"rows": [], "unclassified_works": 0, "bytes_processed": 0}, CACHE_OFF)
    yf, yt, ids = req.year_from, req.year_to, req.institution_ids
    rows, bp = run_query(f"""
        WITH basket_works AS (
            SELECT DISTINCT wai.work_id
            FROM `{SOURCE}.work_affiliation_institution` wai
            JOIN `{SOURCE}.work` w ON wai.work_id = w.work_id
            WHERE wai.institution_id IN UNNEST(@ids)
              AND w.pub_year BETWEEN @year_from AND @year_to
        ),
        basket_clusters AS (
            SELECT cl.micro_cluster_id, COUNT(DISTINCT cl.work_id) AS basket_works_count
            FROM `{CLASSIFICATION}.clustering` cl
            INNER JOIN basket_works bw ON cl.work_id = bw.work_id
            GROUP BY cl.micro_cluster_id
        ),
        cluster_totals AS (
            SELECT cl.micro_cluster_id, COUNT(DISTINCT cl.work_id) AS total_works_in_cluster
            FROM `{CLASSIFICATION}.clustering` cl
            JOIN `{SOURCE}.work` w ON cl.work_id = w.work_id
            WHERE w.pub_year BETWEEN @year_from AND @year_to
            GROUP BY cl.micro_cluster_id
        ),
        classified_count AS (
            SELECT COUNT(DISTINCT cl.work_id) AS n
            FROM `{CLASSIFICATION}.clustering` cl
            INNER JOIN basket_works bw ON cl.work_id = bw.work_id
        ),
        total_count AS (
            SELECT COUNT(*) AS n FROM basket_works
        )
        SELECT
            ct.micro_cluster_id,
            mc.long_label,
            COALESCE(bc.basket_works_count, 0) AS basket_works_count,
            ct.total_works_in_cluster,
            ROUND(SAFE_DIVIDE(COALESCE(bc.basket_works_count, 0), ct.total_works_in_cluster), 4) AS proportion,
            (SELECT n FROM total_count) - (SELECT n FROM classified_count) AS unclassified_works
        FROM cluster_totals ct
        LEFT JOIN basket_clusters bc ON ct.micro_cluster_id = bc.micro_cluster_id
        LEFT JOIN `{CLASSIFICATION}.micro_cluster` mc ON ct.micro_cluster_id = mc.micro_cluster_id
        ORDER BY basket_works_count DESC, ct.total_works_in_cluster DESC
    """, {"ids": ids, "year_from": yf, "year_to": yt}, pid)
    unclassified = rows[0]["unclassified_works"] if rows else 0
    clean_rows = [{k: v for k, v in r.items() if k != "unclassified_works"} for r in rows]
    return cached({"rows": clean_rows, "unclassified_works": unclassified, "bytes_processed": bp}, CACHE_OFF)


@router.post("/api/basket/funders/topics")
def basket_funder_topics(req: FunderBasketRequest, request: Request):
    """Micro-cluster topic breakdown for a basket of funders.
    Returns ALL micro-clusters (within the year range), with basket_works_count=0
    for clusters where the basket has no publications."""
    session = require_auth(request)
    pid = session["project_id"]
    if not req.funder_ids:
        return cached({"rows": [], "unclassified_works": 0, "bytes_processed": 0}, CACHE_OFF)
    yf, yt, ids = req.year_from, req.year_to, req.funder_ids
    rows, bp = run_query(f"""
        WITH basket_works AS (
            SELECT DISTINCT wg.work_id
            FROM `{SOURCE}.work_grant` wg
            JOIN `{SOURCE}.work` w ON wg.work_id = w.work_id
            WHERE wg.funder_id IN UNNEST(@ids)
              AND w.pub_year BETWEEN @year_from AND @year_to
        ),
        basket_clusters AS (
            SELECT cl.micro_cluster_id, COUNT(DISTINCT cl.work_id) AS basket_works_count
            FROM `{CLASSIFICATION}.clustering` cl
            INNER JOIN basket_works bw ON cl.work_id = bw.work_id
            GROUP BY cl.micro_cluster_id
        ),
        cluster_totals AS (
            SELECT cl.micro_cluster_id, COUNT(DISTINCT cl.work_id) AS total_works_in_cluster
            FROM `{CLASSIFICATION}.clustering` cl
            JOIN `{SOURCE}.work` w ON cl.work_id = w.work_id
            WHERE w.pub_year BETWEEN @year_from AND @year_to
            GROUP BY cl.micro_cluster_id
        ),
        classified_count AS (
            SELECT COUNT(DISTINCT cl.work_id) AS n
            FROM `{CLASSIFICATION}.clustering` cl
            INNER JOIN basket_works bw ON cl.work_id = bw.work_id
        ),
        total_count AS (
            SELECT COUNT(*) AS n FROM basket_works
        )
        SELECT
            ct.micro_cluster_id,
            mc.long_label,
            COALESCE(bc.basket_works_count, 0) AS basket_works_count,
            ct.total_works_in_cluster,
            ROUND(SAFE_DIVIDE(COALESCE(bc.basket_works_count, 0), ct.total_works_in_cluster), 4) AS proportion,
            (SELECT n FROM total_count) - (SELECT n FROM classified_count) AS unclassified_works
        FROM cluster_totals ct
        LEFT JOIN basket_clusters bc ON ct.micro_cluster_id = bc.micro_cluster_id
        LEFT JOIN `{CLASSIFICATION}.micro_cluster` mc ON ct.micro_cluster_id = mc.micro_cluster_id
        ORDER BY basket_works_count DESC, ct.total_works_in_cluster DESC
    """, {"ids": ids, "year_from": yf, "year_to": yt}, pid)
    unclassified = rows[0]["unclassified_works"] if rows else 0
    clean_rows = [{k: v for k, v in r.items() if k != "unclassified_works"} for r in rows]
    return cached({"rows": clean_rows, "unclassified_works": unclassified, "bytes_processed": bp}, CACHE_OFF)



