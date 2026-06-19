"""Browse/search routes for institutions and funders."""

from fastapi import APIRouter, Query, Request

from .auth import require_auth
from .config import CACHE_1H, SOURCE
from .db import cached, run_query

router = APIRouter()
@router.get("/api/institutions/top")
def institutions_top(
    request: Request,
    limit: int = Query(default=5000, ge=1, le=50000),
    year_from: int = Query(default=2000),
    year_to: int = Query(default=2025),
):
    session = require_auth(request)
    sql = f"""
        SELECT
            i.institution_id, i.institution AS name,
            i.country_iso_alpha2_code AS country,
            i.thumbnail_url, i.openalex_id,
            it.institution_type AS type,
            COUNT(DISTINCT w.work_id) AS works_count
        FROM `{SOURCE}.institution` i
        LEFT JOIN `{SOURCE}.institution_type` it ON i.institution_type_id = it.institution_type_id
        LEFT JOIN `{SOURCE}.work_affiliation_institution` wai ON i.institution_id = wai.institution_id
        LEFT JOIN `{SOURCE}.work` w ON wai.work_id = w.work_id
            AND w.pub_year BETWEEN @year_from AND @year_to
        GROUP BY 1,2,3,4,5,6
        ORDER BY works_count DESC
        LIMIT @limit
    """
    rows, bp = run_query(sql, {"limit": limit, "year_from": year_from, "year_to": year_to}, session["project_id"])
    return cached({"rows": rows, "bytes_processed": bp})

@router.get("/api/institutions/search")
def institutions_search(
    request: Request,
    q: str = Query(default=""),
    field: str = Query(default="name"),
    limit: int = Query(default=5000, ge=1, le=50000),
    year_from: int = Query(default=2000),
    year_to: int = Query(default=2025),
):
    session = require_auth(request)
    if not q.strip():
        return cached({"rows": [], "bytes_processed": 0}, CACHE_OFF)
    field_map = {"name": "i.institution", "country": "i.country_iso_alpha2_code", "type": "it.institution_type"}
    col = field_map.get(field, "i.institution")
    sql = f"""
        SELECT
            i.institution_id, i.institution AS name,
            i.country_iso_alpha2_code AS country,
            i.thumbnail_url, i.openalex_id,
            it.institution_type AS type,
            COUNT(DISTINCT w.work_id) AS works_count
        FROM `{SOURCE}.institution` i
        LEFT JOIN `{SOURCE}.institution_type` it ON i.institution_type_id = it.institution_type_id
        LEFT JOIN `{SOURCE}.work_affiliation_institution` wai ON i.institution_id = wai.institution_id
        LEFT JOIN `{SOURCE}.work` w ON wai.work_id = w.work_id
            AND w.pub_year BETWEEN @year_from AND @year_to
        WHERE LOWER({col}) LIKE @pattern
        GROUP BY 1,2,3,4,5,6
        ORDER BY works_count DESC
        LIMIT @limit
    """
    rows, bp = run_query(sql, {"pattern": f"%{q.lower()}%", "limit": limit, "year_from": year_from, "year_to": year_to}, session["project_id"])
    return cached({"rows": rows, "bytes_processed": bp})

@router.get("/api/institutions/{institution_id}/trends")
def institution_trends(request: Request, institution_id: int):
    """Return year-by-year works count for one institution."""
    session = require_auth(request)
    sql = f"""
        SELECT w.pub_year AS year, COUNT(DISTINCT wai.work_id) AS works_count
        FROM `{SOURCE}.work_affiliation_institution` wai
        JOIN `{SOURCE}.work` w ON wai.work_id = w.work_id
        -- To re-enable fractional counts, join orion_fractional_counts here
        WHERE wai.institution_id = @id
        GROUP BY year
        ORDER BY year
    """
    rows, bp = run_query(sql, {"id": institution_id}, session["project_id"])
    return cached({"rows": rows, "bytes_processed": bp})

# ── Funders ───────────────────────────────────────────────────────────────────

@router.get("/api/funders/top")
def funders_top(
    request: Request,
    limit: int = Query(default=5000, ge=1, le=50000),
    year_from: int = Query(default=2000),
    year_to: int = Query(default=2025),
):
    session = require_auth(request)
    sql = f"""
        SELECT f.funder_id, f.funder AS name, f.country_iso_alpha2_code AS country,
               f.description, f.thumbnail_url, f.openalex_id,
               COUNT(DISTINCT w.work_id) AS works_count
        FROM `{SOURCE}.funder` f
        LEFT JOIN `{SOURCE}.work_grant` wg ON f.funder_id = wg.funder_id
        LEFT JOIN `{SOURCE}.work` w ON wg.work_id = w.work_id
            AND w.pub_year BETWEEN @year_from AND @year_to
        GROUP BY 1,2,3,4,5,6
        ORDER BY works_count DESC
        LIMIT @limit
    """
    rows, bp = run_query(sql, {"limit": limit, "year_from": year_from, "year_to": year_to}, session["project_id"])
    return cached({"rows": rows, "bytes_processed": bp})

@router.get("/api/funders/search")
def funders_search(
    request: Request,
    q: str = Query(default=""),
    field: str = Query(default="name"),
    limit: int = Query(default=5000, ge=1, le=50000),
    year_from: int = Query(default=2000),
    year_to: int = Query(default=2025),
):
    session = require_auth(request)
    if not q.strip():
        return cached({"rows": [], "bytes_processed": 0}, CACHE_OFF)
    field_map = {"name": "f.funder", "country": "f.country_iso_alpha2_code", "description": "f.description"}
    col = field_map.get(field, "f.funder")
    sql = f"""
        SELECT f.funder_id, f.funder AS name, f.country_iso_alpha2_code AS country,
               f.description, f.thumbnail_url, f.openalex_id,
               COUNT(DISTINCT w.work_id) AS works_count
        FROM `{SOURCE}.funder` f
        LEFT JOIN `{SOURCE}.work_grant` wg ON f.funder_id = wg.funder_id
        LEFT JOIN `{SOURCE}.work` w ON wg.work_id = w.work_id
            AND w.pub_year BETWEEN @year_from AND @year_to
        WHERE LOWER({col}) LIKE @pattern
        GROUP BY 1,2,3,4,5,6
        ORDER BY works_count DESC
        LIMIT @limit
    """
    rows, bp = run_query(sql, {"pattern": f"%{q.lower()}%", "limit": limit, "year_from": year_from, "year_to": year_to}, session["project_id"])
    return cached({"rows": rows, "bytes_processed": bp})

@router.get("/api/funders/{funder_id}/trends")
def funder_trends(request: Request, funder_id: int):
    """Return year-by-year funded work counts for one funder."""
    session = require_auth(request)
    sql = f"""
        SELECT w.pub_year AS year, COUNT(DISTINCT wg.work_id) AS works
        FROM `{SOURCE}.work_grant` wg
        JOIN `{SOURCE}.work` w ON wg.work_id = w.work_id
        WHERE wg.funder_id = @id
        GROUP BY year ORDER BY year
    """
    rows, bp = run_query(sql, {"id": funder_id}, session["project_id"])
    return cached({"rows": rows, "bytes_processed": bp})

# ── Institution Basket ────────────────────────────────────────────────────────


