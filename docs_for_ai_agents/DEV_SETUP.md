# Setting up a dev environment for ORION

This guide walks through creating a `dev` branch and a separate
`orion-app-dev` Cloud Run service, so you can test changes without
touching the live app.

---

## Overview

```
main branch   →  bash DEPLOY.sh        →  orion-app      (production)
dev branch    →  bash DEPLOY.sh --dev  →  orion-app-dev  (staging/dev)
```

Each environment is a completely independent Cloud Run service with its
own URL. They share the same GCP project and BigQuery data, but
can't affect each other.

---

## One-time setup

### 1. Create the dev branch

In Cloud Shell, inside `~/orion-app`:

```bash
git checkout -b dev
git push -u origin dev
```

From now on, do all feature work on `dev` (or feature branches off `dev`).
Only merge to `main` when something is tested and ready.

### 2. Add a second OAuth redirect URI

The dev service will have a different URL, so Google's OAuth client needs
to allow it.

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Open your OAuth 2.0 client
3. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR_DEV_SERVICE_URL/auth/callback
   ```
   > **Note:** You won't know the exact dev URL until after the first
   > deploy in step 3. Do the first deploy, grab the URL from the output,
   > then come back and add it here.
4. Click **Save**

### 3. Deploy to dev for the first time

On the `dev` branch in Cloud Shell:

```bash
bash DEPLOY.sh --dev
```

This builds a separate Docker image (`orion-app-dev`), pushes it, and
creates the `orion-app-dev` Cloud Run service. Copy the URL from the output.

### 4. Set environment variables on the dev service

The dev service needs the same 4 env vars as production, but with the
correct redirect URI for the dev URL:

```bash
DEV_URL="https://YOUR_DEV_SERVICE_URL"

gcloud run services update orion-app-dev \
  --region europe-west1 \
  --update-env-vars \
    OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com",\
    OAUTH_CLIENT_SECRET="<same as prod>",\
    OAUTH_REDIRECT_URI="${DEV_URL}/auth/callback",\
    SESSION_SECRET="<a different secret from prod>"
```

> Use a **different** `SESSION_SECRET` for dev so dev sessions can't
> accidentally be replayed against production.

---

## Day-to-day workflow

```
# Start a new feature
git checkout dev
git checkout -b feature/my-feature

# ... make changes ...

# Test on dev
git add . && git commit -m "feat: my feature"
git push origin feature/my-feature
git checkout dev && git merge feature/my-feature
bash DEPLOY.sh --dev

# Open the dev URL, test everything works

# Promote to production
git checkout main
git merge dev
bash DEPLOY.sh     # will ask for confirmation before deploying
git push origin main
```

---

## Useful commands

```bash
# View dev service logs
gcloud run services logs read orion-app-dev --region europe-west1 --limit 50

# View prod service logs
gcloud run services logs read orion-app --region europe-west1 --limit 50

# List all Cloud Run services
gcloud run services list --region europe-west1

# Delete the dev service if you want to pause (costs nothing when idle anyway)
gcloud run services delete orion-app-dev --region europe-west1
```

---

## Cost

Cloud Run charges per request and per CPU/memory second during request
processing. When `orion-app-dev` is idle it costs **nothing**. The only
ongoing cost is the container image stored in Container Registry (~a few
cents/month). You can delete the dev service between feature sprints if
you want to keep things tidy.
