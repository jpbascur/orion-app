"""BigQuery helpers and cache response utilities."""

from fastapi import HTTPException
from fastapi.responses import JSONResponse
from google.cloud import bigquery

from .config import CACHE_1H, SERVICE_ACCOUNT
# ── BigQuery ──────────────────────────────────────────────────────────────────
# Queries use the Cloud Run service account to READ the (public) data,
# but are billed to the user's own GCP project_id stored in their session.

def get_bq(project_id: str) -> bigquery.Client:
    """Return a BQ client that bills jobs to the user's project."""
    return bigquery.Client(project=project_id)

def run_query(sql: str, params: dict, project_id: str) -> tuple[list[dict], int]:
    """Execute a parameterised BigQuery query.

    Returns a tuple of (rows, bytes_processed) where bytes_processed is the
    total bytes billed for the job (useful for surfacing cost info to users).

    Raises HTTPException with a user-friendly message for common permission
    errors (missing BigQuery Job User role, API not enabled, etc.).
    """
    from google.api_core.exceptions import Forbidden, PermissionDenied
    bq = get_bq(project_id)
    bq_params = []
    for name, value in params.items():
        if isinstance(value, list):
            bq_params.append(bigquery.ArrayQueryParameter(name, "INT64", value))
        elif isinstance(value, int):
            bq_params.append(bigquery.ScalarQueryParameter(name, "INT64", value))
        else:
            bq_params.append(bigquery.ScalarQueryParameter(name, "STRING", value))
    job_config = bigquery.QueryJobConfig(query_parameters=bq_params)
    try:
        job = bq.query(sql, job_config=job_config, location="EU")
        rows_iter = job.result()
    except (Forbidden, PermissionDenied) as e:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Permission denied on project '{project_id}'. "
                "Please grant the ORION service account "
                f"({SERVICE_ACCOUNT}) "
                "the 'BigQuery Job User' role in your GCP project IAM settings, "
                "and make sure the BigQuery API is enabled. "
                f"Details: {str(e)[:200]}"
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)[:300]}")
    result = []
    for row in rows_iter:
        d = {}
        for key, value in row.items():
            if value is None:
                d[key] = None
            elif hasattr(value, "item"):
                d[key] = value.item()
            elif type(value).__name__ == "Decimal":
                d[key] = float(value)
            elif isinstance(value, float):
                d[key] = round(value, 4)
            elif isinstance(value, int):
                d[key] = int(value)
            else:
                d[key] = value
        result.append(d)
    bytes_processed = job.total_bytes_processed or 0
    return result, bytes_processed

def cached(data, max_age: str = CACHE_1H):
    return JSONResponse(content=data, headers={"Cache-Control": max_age})


