"""Application configuration shared by backend modules."""

import os

from dotenv import load_dotenv

load_dotenv()

OAUTH_CLIENT_ID = os.environ["OAUTH_CLIENT_ID"]
OAUTH_CLIENT_SECRET = os.environ["OAUTH_CLIENT_SECRET"]
OAUTH_REDIRECT_URI = os.environ["OAUTH_REDIRECT_URI"]
SESSION_SECRET = os.environ["SESSION_SECRET"]

SOURCE = "cwts-leiden.openalex_2025aug"
SERVICE_ACCOUNT = os.environ.get("ORION_SERVICE_ACCOUNT", "ORION_SERVICE_ACCOUNT not configured")
VOS_BUCKET = os.environ.get("ORION_VOS_BUCKET")

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

CACHE_1H = "public, max-age=3600"
CACHE_OFF = "no-store"
