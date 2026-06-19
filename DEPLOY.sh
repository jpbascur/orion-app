#!/bin/bash
set -e

# ORION Dashboard deploy script.
# Usage from Cloud Shell:
#
#   First time:
#     git clone https://github.com/jpbascur/orion-app.git && cd orion-app
#
#   Every deploy after that, just pull and run:
#     git pull && bash DEPLOY.sh [--dev]
#
#   Or to switch branches:
#     git fetch && git checkout dev && bash DEPLOY.sh --dev
#
#   bash DEPLOY.sh        -> deploy to PRODUCTION (orion-app)
#   bash DEPLOY.sh --dev  -> deploy to DEV (orion-app-dev)
#
# Docker layer caching happens on Cloud Build's remote VMs, not in Cloud Shell.
# Re-cloning the repo only wastes time uploading a fresh build context.

REGION="europe-west1"
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
VOS_BUCKET="${PROJECT_ID}-orion-vos"
RUNTIME_SA_NAME="orion-runner"

if [ -z "$PROJECT_ID" ]; then
  echo "No Google Cloud project is selected."
  echo "Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

ENV="prod"
for arg in "$@"; do
  case $arg in
    --dev) ENV="dev" ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

if [ "$ENV" = "dev" ]; then
  SERVICE_NAME="orion-app-dev"
  BUILD_CONFIG="deployment/cloudbuild.dev.yaml"
  echo "Deploying to DEV environment ($SERVICE_NAME)"
else
  SERVICE_NAME="orion-app"
  BUILD_CONFIG="deployment/cloudbuild.yaml"
  echo "Deploying to PRODUCTION environment ($SERVICE_NAME)"
  echo ""
  read -p "Are you sure you want to deploy to production? [y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

gcloud config set project "$PROJECT_ID"

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo ""
echo "=== Preparing deployer-owned VOSviewer map storage: gs://${VOS_BUCKET} ==="
gcloud services enable \
  iam.googleapis.com \
  bigquery.googleapis.com \
  storage.googleapis.com \
  --project="$PROJECT_ID" \
  --quiet

if ! gcloud iam service-accounts describe "$RUNTIME_SA" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$RUNTIME_SA_NAME" \
    --project="$PROJECT_ID" \
    --display-name="ORION Cloud Run runtime service account"
fi

gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --project="$PROJECT_ID" \
  --quiet

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/bigquery.jobUser" \
  --quiet

if ! gcloud storage buckets describe "gs://${VOS_BUCKET}" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://${VOS_BUCKET}" \
    --project="$PROJECT_ID" \
    --location="$REGION" \
    --uniform-bucket-level-access
fi

LIFECYCLE_FILE="$(mktemp)"
cat > "$LIFECYCLE_FILE" <<'JSON'
{
  "rule": [
    {
      "action": { "type": "Delete" },
      "condition": { "age": 1, "matchesPrefix": ["vos/"] }
    }
  ]
}
JSON
gcloud storage buckets update "gs://${VOS_BUCKET}" --lifecycle-file="$LIFECYCLE_FILE"
rm -f "$LIFECYCLE_FILE"

gcloud storage buckets add-iam-policy-binding "gs://${VOS_BUCKET}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/storage.objectAdmin" \
  --quiet

echo ""
echo "=== Building and deploying from current branch: $(git branch --show-current) ==="
gcloud builds submit . \
  --config="$BUILD_CONFIG" \
  --project="$PROJECT_ID"

echo ""
echo "Done! Deployed URL:"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)'
