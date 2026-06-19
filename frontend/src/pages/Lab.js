import React, { useState } from 'react';
import { apiFetch, exportCsv } from '../api';
import { QueryModal } from './BasketShared';
import { buildCitationNetworkQuery } from './queryBuilders';

const DISPLAY_LIMIT = 1000;

const TABLE_CONFIGS = [
  {
    key: 'direct_citation',
    label: 'Direct Citation',
    desc: 'Papers that cite your seeds',
    scoreLabel: 'Seeds cited',
  },
  {
    key: 'co_citation',
    label: 'Co-citation',
    desc: 'Papers cited alongside your seeds (Janssens & Gwinn 2015)',
    scoreLabel: 'Co-citation freq',
  },
  {
    key: 'direct_reference',
    label: 'Direct Reference',
    desc: "Papers in your seeds' bibliography",
    scoreLabel: 'Referenced by seeds',
  },
  {
    key: 'bib_coupling',
    label: 'Bibliographic Coupling',
    desc: 'Papers sharing references with your seeds',
    scoreLabel: 'Shared refs',
  },
];

function parseIds(input) {
  return [...new Set(
    input.split(/[\s,\n]+/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0)
  )];
}

function CitationTable({ config, rows }) {
  const displayRows = rows ? rows.slice(0, DISPLAY_LIMIT) : null;

  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
      <div>
        <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '.9rem' }}>{config.label}</div>
        <div style={{ fontSize: '.73rem', color: '#475569', marginTop: '.2rem' }}>{config.desc}</div>
      </div>

      {!displayRows && (
        <div style={{ color: '#2d3148', fontSize: '.8rem', textAlign: 'center', padding: '1.5rem 0' }}>
          —
        </div>
      )}

      {displayRows && (
        <>
          <div style={{ fontSize: '.72rem', color: '#475569' }}>
            {rows.length >= DISPLAY_LIMIT
              ? `Top ${DISPLAY_LIMIT.toLocaleString()} results`
              : `${rows.length.toLocaleString()} result${rows.length !== 1 ? 's' : ''}`}
          </div>
          <div className="table-wrap" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Work ID</th>
                  <th>Title</th>
                  <th>Year</th>
                  <th>{config.scoreLabel}</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((r, i) => (
                  <tr key={r.work_id ?? i}>
                    <td className="rank">{i + 1}</td>
                    <td style={{ fontSize: '.73rem', fontVariantNumeric: 'tabular-nums' }}>
                      <a
                        href={`https://openalex.org/works/w${r.work_id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#7c8cff' }}
                        onClick={e => e.stopPropagation()}
                      >
                        {r.work_id}
                      </a>
                    </td>
                    <td style={{ maxWidth: '280px', fontSize: '.8rem', lineHeight: 1.4, color: r.title ? '#cbd5e1' : '#334155' }}>
                      {r.title ?? '—'}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '.8rem' }}>{r.pub_year ?? '—'}</td>
                    <td className="works">{Number(r.score).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn ghost" style={{ fontSize: '.72rem', alignSelf: 'flex-start' }} onClick={() => exportCsv(rows, `${config.key}.csv`)}>
            Download CSV
          </button>
        </>
      )}
    </div>
  );
}

export default function Lab({ projectId }) {
  const [rawInput, setRawInput]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [tableRows, setTableRows]     = useState(null);
  const [bytesProcessed, setBytesProcessed] = useState(null);
  const [queryModalSql, setQueryModalSql]   = useState(null);

  const workIds = parseIds(rawInput);

  const handleRun = async () => {
    if (!workIds.length) return;
    setLoading(true);
    setError(null);
    setTableRows(null);
    setBytesProcessed(null);
    try {
      const data = await apiFetch('/api/lab/citation-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_ids: workIds }),
      });
      const byType = {};
      TABLE_CONFIGS.forEach(t => { byType[t.key] = []; });
      (data.rows || []).forEach(r => {
        if (byType[r.type]) byType[r.type].push(r);
      });
      setTableRows(byType);
      setBytesProcessed(data.bytes_processed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div style={{ background: '#1c1600', border: '1px solid #78350f', borderRadius: '8px', padding: '.7rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '.65rem', fontSize: '.8rem', color: '#92400e' }}>
        <span>⚗️</span>
        <span><strong style={{ color: '#d97706' }}>Lab — experimental</strong> · Features here are implemented and functional but not yet fully integrated with the rest of the tool. Interfaces and query designs are subject to change.</span>
      </div>

      <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '.9rem', marginBottom: '.4rem' }}>Seed papers</div>
        <div style={{ fontSize: '.75rem', color: '#64748b', marginBottom: '.75rem', lineHeight: 1.6 }}>
          Enter one or more OpenAlex work IDs (integers, e.g. <code style={{ color: '#94a3b8' }}>2150220236</code>). To find a paper's ID, search for it on <a href="https://openalex.org" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>openalex.org</a> — the ID appears either in the URL as <code style={{ color: '#94a3b8' }}>openalex.org/works/W2150220236</code> or as a <code style={{ color: '#94a3b8' }}>zoom=W2150220236</code> parameter. The number after the <code style={{ color: '#94a3b8' }}>W</code> is the ID. One per line or comma-separated. All four tables below are populated by a single BigQuery query to minimise cost.
        </div>
        <textarea
          value={rawInput}
          onChange={e => setRawInput(e.target.value)}
          placeholder={'2150220236\n2755950973'}
          rows={4}
          style={{ width: '100%', background: '#0f1117', border: '1px solid #2d3148', borderRadius: '6px', color: '#e2e8f0', fontSize: '.85rem', padding: '.65rem .85rem', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }}
        />
        {workIds.length > 0 && (
          <div style={{ fontSize: '.72rem', color: '#475569', marginTop: '.4rem' }}>
            {workIds.length} ID{workIds.length !== 1 ? 's' : ''} parsed
            {workIds.length <= 5 ? ': ' + workIds.join(', ') : ': ' + workIds.slice(0, 5).join(', ') + ` … +${workIds.length - 5} more`}
          </div>
        )}
        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn"
            style={{ fontSize: '.85rem' }}
            onClick={handleRun}
            disabled={loading || workIds.length === 0}
          >
            {loading ? 'Running…' : 'Run all'}
          </button>
          {tableRows && (
            <button className="btn ghost" style={{ fontSize: '.72rem' }} onClick={() => setQueryModalSql(buildCitationNetworkQuery(workIds))}>
              Export query
            </button>
          )}
          {bytesProcessed != null && (
            <span style={{ fontSize: '.72rem', color: '#475569' }}>{(bytesProcessed / 1e9).toFixed(2)} GB billed</span>
          )}
        </div>

        {error && (
          <div style={{ background: '#2d1515', border: '1px solid #7f1d1d', borderRadius: '6px', padding: '.65rem .85rem', fontSize: '.78rem', color: '#f87171', lineHeight: 1.5, marginTop: '.75rem' }}>
            {error}
          </div>
        )}
      </div>

      <div className="results-grid">
        {TABLE_CONFIGS.map(config => (
          <CitationTable
            key={config.key}
            config={config}
            rows={tableRows ? tableRows[config.key] : null}
          />
        ))}
      </div>

      {queryModalSql && <QueryModal sql={queryModalSql} onClose={() => setQueryModalSql(null)} />}
    </div>
  );
}
