"""Experimental Lab analysis routes."""

from typing import List

from fastapi import APIRouter, Request
from pydantic import BaseModel

from .auth import require_auth
from .config import CACHE_OFF, SOURCE
from .db import cached, run_query

router = APIRouter()
class LabWorksRequest(BaseModel):
    work_ids: List[int]
    limit: int = 1000

@router.post("/api/lab/citation-network")
def lab_citation_network(req: LabWorksRequest, request: Request):
    """All 4 citation analyses in one query. Returns rows tagged by type."""
    session = require_auth(request)
    pid = session["project_id"]
    if not req.work_ids:
        return cached({"rows": [], "bytes_processed": 0}, CACHE_OFF)
    rows, bp = run_query(f"""
        WITH seed_papers AS (
            SELECT work_id FROM UNNEST(@ids) AS work_id
        ),
        citing_papers_raw AS (
            SELECT c.citing_work_id, c.cited_work_id
            FROM `{SOURCE}.citation` c
            JOIN seed_papers s ON c.cited_work_id = s.work_id
        ),
        seed_references_raw AS (
            SELECT c.cited_work_id, c.citing_work_id
            FROM `{SOURCE}.citation` c
            JOIN seed_papers s ON c.citing_work_id = s.work_id
        ),
        direct_citation AS (
            SELECT 'direct_citation' AS type, r.citing_work_id AS work_id, COUNT(*) AS score
            FROM citing_papers_raw r
            LEFT JOIN seed_papers sp ON r.citing_work_id = sp.work_id
            WHERE sp.work_id IS NULL
            GROUP BY r.citing_work_id
        ),
        direct_reference AS (
            SELECT 'direct_reference' AS type, r.cited_work_id AS work_id, COUNT(*) AS score
            FROM seed_references_raw r
            LEFT JOIN seed_papers sp ON r.cited_work_id = sp.work_id
            WHERE sp.work_id IS NULL
            GROUP BY r.cited_work_id
        ),
        co_citation AS (
            SELECT 'co_citation' AS type, c.cited_work_id AS work_id, COUNT(*) AS score
            FROM `{SOURCE}.citation` c
            JOIN direct_citation dc ON c.citing_work_id = dc.work_id
            LEFT JOIN seed_papers sp ON c.cited_work_id = sp.work_id
            WHERE sp.work_id IS NULL
            GROUP BY c.cited_work_id
        ),
        bib_coupling AS (
            SELECT 'bib_coupling' AS type, c.citing_work_id AS work_id, COUNT(*) AS score
            FROM `{SOURCE}.citation` c
            JOIN direct_reference dr ON c.cited_work_id = dr.work_id
            LEFT JOIN seed_papers sp ON c.citing_work_id = sp.work_id
            WHERE sp.work_id IS NULL
            GROUP BY c.citing_work_id
        ),
        all_results AS (
            SELECT * FROM direct_citation
            UNION ALL SELECT * FROM co_citation
            UNION ALL SELECT * FROM direct_reference
            UNION ALL SELECT * FROM bib_coupling
        )
        SELECT r.type, r.work_id, wt.title, w.pub_year, r.score
        FROM all_results r
        LEFT JOIN `{SOURCE}.work` w ON r.work_id = w.work_id
        LEFT JOIN `{SOURCE}.work_title` wt ON r.work_id = wt.work_id
        QUALIFY ROW_NUMBER() OVER (PARTITION BY r.type ORDER BY r.score DESC) <= @limit
        ORDER BY r.type, r.score DESC
    """, {"ids": req.work_ids, "limit": req.limit}, pid)
    return cached({"rows": rows, "bytes_processed": bp}, CACHE_OFF)



