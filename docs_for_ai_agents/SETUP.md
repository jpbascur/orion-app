# ORION One-Time Setup Guide

ORION is deployed from Google Cloud Shell to the Google Cloud project that is currently selected in `gcloud`.

## Step 1 - Create Or Choose A Google Cloud Project

In Cloud Shell:

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud config get-value project
```

The deploy script reads this active project automatically. There is no project ID to edit in `DEPLOY.sh`.
It also creates a deployer-owned Cloud Storage bucket named `YOUR_PROJECT_ID-orion-vos` for temporary VOSviewer maps.

## Step 2 - Put The Code In A GitHub Repository

Create a repository at https://github.com/new, then from Cloud Shell:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/orion-app.git
git push -u origin main
```

## Step 3 - Grant Cloud Build Permission To Deploy

Run this once in Cloud Shell:

```bash
PROJECT_ID="$(gcloud config get-value project)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser"
```

## Step 4 - Configure OAuth And Secrets

Create a Google OAuth web client and add your Cloud Run callback URL:

```text
https://YOUR_SERVICE_URL/auth/callback
```

Then set the Cloud Run environment variables after the first deploy, when you know the service URL. See [SETUP_AUTH.md](SETUP_AUTH.md).
Use `--update-env-vars` when changing OAuth settings so deploy-managed variables such as `ORION_VOS_BUCKET` are preserved.

## Step 5 - Deploy

Production:

```bash
git checkout main
git pull
bash DEPLOY.sh
```

Dev/staging:

```bash
git checkout dev
git pull
bash DEPLOY.sh --dev
```

## Checking Build History

```bash
gcloud builds list --project="$(gcloud config get-value project)"
```
