/**
 * ORION Research Dashboard — v0.1.0
 * https://github.com/jpbascur/orion-app
 * Copyright (c) 2025 Juan Pablo Bascur Cifuentes — MIT License
 */

/**
 * The BigQuery dataset used by all backend queries and export SQL.
 * Update here when the dataset version changes — this is the single source
 * of truth for the frontend. The backend reads the same value from main.py:SOURCE.
 */
export const ORION_SOURCE = 'cwts-leiden.openalex_2025aug';

/**
 * Thin fetch wrapper — if the backend returns 401 (session expired or missing),
 * redirect to the login page automatically.
 * For other errors, tries to surface the backend's detail message if available.
 */
export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    window.location.href = '/?error=session_expired';
    return null;
  }
  if (!res.ok) {
    let detail = String(res.status);
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

/**
 * Build a VOSviewer co-occurrence network for a basket and open it in
 * VOSviewer Online. Makes a POST to the given buildUrl, gets back a token,
 * then opens https://app.vosviewer.com/?json=<our-token-endpoint>.
 *
 * @param {string} buildUrl  - e.g. '/api/vos/build/institutions'
 * @param {object} body      - JSON body with ids, year_from, year_to, limit
 * @returns {Promise<void>}  - rejects with Error on failure
 */
export async function openVosViewer(buildUrl, body) {
  const res = await apiFetch(buildUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res) return; // 401 redirect already handled
  const tokenUrl = `${window.location.origin}/api/vos/${res.token}`;
  window.open(`https://app.vosviewer.com/?json=${encodeURIComponent(tokenUrl)}`, '_blank');
}

/**
 * Download an array of objects as a CSV file.
 * @param {object[]} rows     - array of plain objects
 * @param {string}   filename - e.g. "institutions.csv"
 */
export function exportCsv(rows, filename = 'export.csv') {
  if (!rows || rows.length === 0) return;
  const cols = Object.keys(rows[0]);
  const escape = v => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => escape(r[c])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
