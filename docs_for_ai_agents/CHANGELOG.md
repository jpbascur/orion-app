# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] — 2025-02-27

### Added
- Institution and Funder browse pages with search, year filtering, and CSV export
- Institution Basket and Funder Basket for building custom entity sets
- Basket analysis: total works, co-occurring institutions, co-occurring funders
- VOSviewer Online integration: one-click co-occurrence network visualisation from any basket
- Export queries: copy BigQuery SQL for any basket result to run independently
- Google OAuth login (identity only — no BigQuery scope requested from users)
- BigQuery costs billed to the user's own GCP project, not the host project
- Session-based auth with signed cookies (8-hour expiry)
- Error pages for all OAuth failure modes
- Data usage indicator (bytes scanned / cached) on every query result
- Dark UI throughout

### Data
- Source dataset: `cwts-leiden.openalex_2025aug` (CWTS OpenAlex 2025 August snapshot)
