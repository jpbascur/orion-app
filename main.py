# ORION Research Dashboard - v0.1.0
# https://github.com/jpbascur/orion-app
#
# Copyright (c) 2025 Juan Pablo Bascur Cifuentes
# Released under the MIT License - see LICENSE for details.
#
# Data: CWTS OpenAlex 2025 snapshot via the ORION initiative (https://orion-dbs.community)
# Network visualisation: VOSviewer Online (Van Eck & Waltman, CWTS Leiden)

import os

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.auth import router as auth_router
from backend.baskets import router as baskets_router
from backend.entities import router as entities_router
from backend.lab import router as lab_router
from backend.vos import router as vos_router

# Backend route implementations live in the backend/ package.
# main.py intentionally stays small: create the app, register routers, serve React.
app = FastAPI()

for router in (auth_router, entities_router, baskets_router, vos_router, lab_router):
    app.include_router(router)


BUILD_DIR = os.path.join(os.path.dirname(__file__), "frontend", "build")
if os.path.exists(BUILD_DIR):
    app.mount("/static", StaticFiles(directory=os.path.join(BUILD_DIR, "static")), name="static")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        return FileResponse(os.path.join(BUILD_DIR, "index.html"))
