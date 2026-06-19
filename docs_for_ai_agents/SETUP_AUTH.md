# ORION Auth Setup

## Architecture

- Users enter their GCP Project ID + sign in with Google
- Your Cloud Run service account reads the (public) datasets
- BigQuery jobs are submitted under the user's project ID → they get billed
- You pay nothing for queries

---

## Step 1 — Make your datasets public

Run once in Cloud Shell:

```bash
bq add-iam-policy-binding \
  --member=allUsers \
  --role=roles/bigquery.dataViewer \
  YOUR_PROJECT_ID:orion_cache

# If you control cwts-leiden, do the same there.
# If not, ask the dataset owner to make it public.
```

---

## Step 2 — Grant your Cloud Run service account bigquery.jobUser on itself

The service account needs permission to create jobs in the user's project.
Wait — it can't. The user's project grants this automatically to any
authenticated Google identity running jobs there. Since the service account
is a valid Google identity, it can submit jobs to any project where it has
`bigquery.jobUser`. The user needs to grant this once:

```bash
# User runs this in their own Cloud Shell, replacing values:
gcloud projects add-iam-policy-binding MY-PROJECT-ID \
  --member=serviceAccount:YOUR_CLOUD_RUN_SERVICE_ACCOUNT \
  --role=roles/bigquery.jobUser
```

Show this command to users on a "setup" page after they log in.
Find your Cloud Run service account with:
```bash
gcloud run services describe orion-app \
  --region europe-west1 \
  --format='value(spec.template.spec.serviceAccountName)'
```

---

## Step 3 — Create OAuth credentials

1. Go to https://console.cloud.google.com/apis/credentials
2. Create Credentials → OAuth client ID → Web application
3. Authorized redirect URIs: https://YOUR-APP.run.app/auth/callback
4. Copy Client ID and Client Secret

Configure consent screen at /apis/credentials/consent:
- Scopes: openid, email, profile (no BigQuery scope needed)

---

## Step 4 — Set environment variables on Cloud Run

```bash
gcloud run services update orion-app \
  --region europe-west1 \
  --update-env-vars \
    OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com",\
    OAUTH_CLIENT_SECRET="your-client-secret",\
    OAUTH_REDIRECT_URI="https://YOUR-APP.run.app/auth/callback",\
    SESSION_SECRET="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
```

---

## What users need to do (one time)

1. Create a GCP project at https://console.cloud.google.com/projectcreate
2. Enable billing (free tier: 1 TB/month — most users never pay)
3. Run the `gcloud projects add-iam-policy-binding` command above
4. Come back to ORION, enter their Project ID, sign in
