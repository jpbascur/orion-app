# Backend

This directory contains the FastAPI backend.

- `config.py` - environment variables and shared constants
- `auth.py` - OAuth login, session cookies, and auth routes
- `db.py` - BigQuery client, query execution, and cache helpers
- `entities.py` - institution and funder browse/search/trend routes
- `baskets.py` - basket analysis routes for works, co-occurrence, and topics
- `vos.py` - VOSviewer network creation and temporary GCS storage
- `lab.py` - experimental Lab analysis routes

`main.py` is only the app entrypoint. It imports these routers and serves the built React frontend.
