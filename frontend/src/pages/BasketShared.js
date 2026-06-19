/**
 * BasketShared.js
 *
 * Shared UI components used by both InstBasket and FunderBasket:
 *   QueryModal   — modal to display and copy an export SQL query
 *   ResultTable  — co-occurrence results table with basket-aware highlighting
 *   PermissionError — BigQuery IAM setup guidance
 *
 * SQL query builders have been moved to queryBuilders.js.
 */
import React, { useState } from 'react';
import useTable from './useTable';
import { useServiceAccount } from '../config';

// Re-export query builders so existing imports don't break.
export {
  buildInstWorksQuery,
  buildInstCoInstQuery,
  buildInstCoFunderQuery,
  buildFunderWorksQuery,
  buildFunderCoInstQuery,
  buildFunderCoFunderQuery,
  buildInstSearchQuery,
  buildFunderSearchQuery,
  buildInstTopicsQuery,
  buildFunderTopicsQuery,
} from './queryBuilders';

export function QueryModal({ sql, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '12px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #2d3148' }}>
          <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Export query</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          <p style={{ fontSize: '.825rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.6 }}>
            Copy and run in your <a href="https://console.cloud.google.com/bigquery" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>BigQuery console</a>.
            See the <strong style={{ color: '#94a3b8' }}>Guide</strong> tab for instructions.
          </p>
          <pre style={{ background: '#0f1117', border: '1px solid #2d3148', borderRadius: '8px', padding: '1rem', fontSize: '.775rem', color: '#a78bfa', overflowX: 'auto', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{sql}</pre>
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #2d3148', display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onClose}>Close</button>
          <button className="btn" onClick={copy}>{copied ? '✓ Copied!' : 'Copy query'}</button>
        </div>
      </div>
    </div>
  );
}

export function CollapsibleSection({ title, badge, actions, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: open ? '.75rem' : 0, flexWrap: 'wrap', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: '.85rem', color: '#475569', lineHeight: 1, transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
        <div className="section-title" style={{ margin: 0 }}>{title}</div>
        {badge}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }} onClick={e => e.stopPropagation()}>
          {actions}
        </div>
      </div>
      {open && children}
    </div>
  );
}

const DEFAULT_LIMIT = 100;
const STEP = 100;

export function ResultTable({ rows, type, addToBasket, basket, idKey, loading }) {
  const [displayLimit, setDisplayLimit] = useState(DEFAULT_LIMIT);
  const [minimized, setMinimized] = useState(false);
  const tbl = useTable(rows, displayLimit);
  const STh = (k, label) => (
    <th onClick={() => tbl.onSort(k)} className={tbl.sortKey === k ? 'sorted' : ''}>{label}{tbl.sortIcon(k)}</th>
  );
  if (loading) return <div className="status">Running…</div>;
  if (!rows.length) return <div className="status">No results found.</div>;
  if (minimized) return (
    <div className="tbl-minimized">
      <span>{rows.length.toLocaleString()} results hidden</span>
      <button className="btn ghost" onClick={() => setMinimized(false)}>Show table</button>
    </div>
  );

  const isInst = type === 'institutions';
  const rowIdKey = isInst ? 'institution_id' : 'funder_id';
  const inBasket = id => basket ? basket.some(b => b[idKey ?? rowIdKey] === id || b[rowIdKey] === id) : false;
  const hasMore = displayLimit < rows.length;

  return (
    <div className="table-wrap">
      <div className="tbl-footer" style={{ marginBottom: '.5rem' }}>
        <span>Showing {tbl.visibleRows.length} of {rows.length} results</span>
        <div className="tbl-expand">
          {hasMore && (<>
            <button className="btn ghost" onClick={() => setDisplayLimit(l => l + STEP)}>+ {STEP} more</button>
            <button className="btn ghost" onClick={() => setDisplayLimit(rows.length)}>Show all {rows.length.toLocaleString()}</button>
          </>)}
          <button className="btn ghost" onClick={() => setMinimized(true)} title="Minimize table">− Minimize</button>
        </div>
      </div>
      <table>
        <thead><tr>
          <th>#</th>
          <th></th>
          {STh('name', isInst ? 'Institution' : 'Funder')}
          {isInst && STh('type', 'Type')}
          {STh('country', 'Country')}
          {STh('works_count', 'Co-occurring works')}
          <th></th>
        </tr></thead>
        <tbody>
          {tbl.visibleRows.map((r, i) => {
            const rid = r[rowIdKey];
            const inBask = inBasket(rid);
            return (
              <tr key={i} className={inBask ? 'in-basket' : ''}>
                <td className="rank">{i + 1}</td>
                <td>
                  {r.thumbnail_url
                    ? <img className="thumb" src={r.thumbnail_url} alt="" />
                    : <div className="thumb" />}
                </td>
                <td>{r.name}</td>
                {isInst && <td>{r.type ? <span className="badge-type">{r.type}</span> : '—'}</td>}
                <td>{r.country ? <span className="badge-country">{r.country}</span> : '—'}</td>
                <td className="works">{Number(r.works_count).toLocaleString()}</td>
                <td onClick={e => e.stopPropagation()}>
                  {inBask
                    ? <span style={{ color: '#4ade80', fontSize: '.8rem' }}>✓</span>
                    : <button className="btn secondary" style={{ padding: '.2rem .5rem', fontSize: '.75rem' }} onClick={() => addToBasket(r)}>+</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="tbl-footer">
        <span>Showing {tbl.visibleRows.length} of {rows.length} results</span>
        <div className="tbl-expand">
          {hasMore && (<>
            <button className="btn ghost" onClick={() => setDisplayLimit(l => l + STEP)}>+ {STEP} more</button>
            <button className="btn ghost" onClick={() => setDisplayLimit(rows.length)}>Show all {rows.length.toLocaleString()}</button>
          </>)}
          <button className="btn ghost" onClick={() => setMinimized(true)} title="Minimize table">− Minimize</button>
        </div>
      </div>
    </div>
  );
}

/**
 * TopicsTable — shows how the basket's works are distributed across
 * openalex_2023nov_classification micro-clusters (topics).
 *
 * Columns: rank, micro_cluster_id, long_label, basket_works_count,
 *          total_works_in_cluster (within period), proportion (bar + %).
 */
export function TopicsTable({ rows, loading, unclassified = 0 }) {
  const [minimized, setMinimized] = useState(false);
  const tbl = useTable(rows, rows.length); // show all rows (user's request)

  const STh = (k, label, align) => (
    <th
      onClick={() => tbl.onSort(k)}
      className={tbl.sortKey === k ? 'sorted' : ''}
      style={align === 'right' ? { textAlign: 'right' } : undefined}
    >
      {label}{tbl.sortIcon(k)}
    </th>
  );

  if (loading) return <div className="status">Running…</div>;
  if (!rows.length) return <div className="status">No topic data found for this selection.</div>;
  if (minimized) return (
    <div className="tbl-minimized">
      <span>{rows.length.toLocaleString()} micro-clusters hidden</span>
      <button className="btn ghost" onClick={() => setMinimized(false)}>Show table</button>
    </div>
  );

  return (
    <div>
      {unclassified > 0 && (
        <div style={{ background: '#1e2235', border: '1px solid #2d3148', borderLeft: '3px solid #475569', borderRadius: '0 6px 6px 0', padding: '.65rem 1rem', fontSize: '.78rem', color: '#64748b', lineHeight: 1.65, marginBottom: '.85rem' }}>
          <strong style={{ color: '#94a3b8' }}>{Number(unclassified).toLocaleString()} works</strong> from this basket have no cluster assignment in the classification and are not shown below.
          This can happen when a paper has no citation links, is not a journal article, proceedings paper, preprint, or book chapter, or was published outside the 2000–2023 coverage of the classification.
        </div>
      )}
      <div className="table-wrap">
        <div className="tbl-footer" style={{ marginBottom: '.5rem' }}>
          <span>{rows.length.toLocaleString()} micro-clusters</span>
          <div className="tbl-expand">
            <button className="btn ghost" onClick={() => setMinimized(true)} title="Minimize table">− Minimize</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              {STh('micro_cluster_id', 'Cluster ID')}
              {STh('long_label', 'Topic')}
              {STh('basket_works_count', 'Basket works', 'right')}
              {STh('total_works_in_cluster', 'Total in cluster', 'right')}
              {STh('proportion', 'Proportion', 'right')}
            </tr>
          </thead>
          <tbody>
            {tbl.visibleRows.map((r, i) => {
              const pct = r.proportion != null ? (r.proportion * 100) : null;
              // Fixed 0–100% scale
              const barWidth = pct != null ? Math.min(pct, 100) : 0;
              return (
                <tr key={r.micro_cluster_id ?? i}>
                  <td className="rank">{i + 1}</td>
                  <td style={{ color: '#64748b', fontSize: '.78rem', fontVariantNumeric: 'tabular-nums' }}>
                    {r.micro_cluster_id ?? '—'}
                  </td>
                  <td style={{ maxWidth: '340px', lineHeight: 1.45 }}>
                    {r.long_label ?? <span style={{ color: '#475569' }}>—</span>}
                  </td>
                  <td className="works" style={{ textAlign: 'right' }}>
                    {Number(r.basket_works_count).toLocaleString()}
                  </td>
                  <td className="works" style={{ textAlign: 'right', color: '#64748b' }}>
                    {Number(r.total_works_in_cluster).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', minWidth: '140px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'flex-end' }}>
                      <div style={{ width: '70px', height: '6px', background: '#1e2235', borderRadius: '3px', flexShrink: 0 }}>
                        <div style={{
                          width: `${barWidth}%`,
                          height: '100%',
                          background: '#7c8cff',
                          borderRadius: '3px',
                          transition: 'width .2s',
                        }} />
                      </div>
                      <span style={{ fontSize: '.8rem', color: '#94a3b8', fontVariantNumeric: 'tabular-nums', minWidth: '44px' }}>
                        {pct != null ? `${pct.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="tbl-footer">
          <span>{rows.length.toLocaleString()} micro-clusters</span>
          <div className="tbl-expand">
            <span style={{ fontSize: '.72rem', color: '#334155' }}>
              Proportion = basket works ÷ total cluster works within selected period
            </span>
            <button className="btn ghost" onClick={() => setMinimized(true)} title="Minimize table">− Minimize</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Shown when a query returns a 403 — guides the user through fixing their
 * IAM / BigQuery API setup without leaving the page.
 */
export function PermissionError({ projectId }) {
  const serviceAccount = useServiceAccount();
  const iamUrl = projectId
    ? `https://console.cloud.google.com/iam-admin/iam?project=${projectId}`
    : 'https://console.cloud.google.com/iam-admin/iam';
  const bqUrl = projectId
    ? `https://console.cloud.google.com/apis/library/bigquery.googleapis.com?project=${projectId}`
    : 'https://console.cloud.google.com/apis/library/bigquery.googleapis.com';

  return (
    <div style={{ background: '#2d1515', border: '1px solid #7f1d1d', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
        <span style={{ fontSize: '1rem' }}>🔒</span>
        <span style={{ fontSize: '.85rem', fontWeight: 700, color: '#fca5a5' }}>
          Permission error — your project needs a one-time setup
        </span>
      </div>
      <p style={{ fontSize: '.8rem', color: '#f87171', lineHeight: 1.7, marginBottom: '1rem' }}>
        ORION couldn't run a query on project{' '}
        {projectId ? <strong style={{ color: '#fca5a5' }}>{projectId}</strong> : 'your project'}.
        Complete the two steps below, then try again.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '.85rem 1rem' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#fca5a5', marginBottom: '.35rem' }}>
            Step 1 — Enable the BigQuery API
          </div>
          <a href={bqUrl} target="_blank" rel="noreferrer" style={{ fontSize: '.78rem', color: '#93c5fd' }}>
            Enable BigQuery API{projectId ? ` on ${projectId}` : ''} ↗
          </a>
        </div>

        <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '.85rem 1rem' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#fca5a5', marginBottom: '.35rem' }}>
            Step 2 — Grant BigQuery Job User role
          </div>
          <p style={{ fontSize: '.78rem', color: '#f87171', lineHeight: 1.6, margin: '0 0 .5rem' }}>
            Open <a href={iamUrl} target="_blank" rel="noreferrer" style={{ color: '#93c5fd' }}>
              IAM for your project ↗
            </a>, click <strong style={{ color: '#fca5a5' }}>Grant Access</strong>, and add:
          </p>
          <div style={{ background: '#0f0505', borderRadius: '6px', padding: '.6rem .85rem', marginBottom: '.3rem' }}>
            <div style={{ fontSize: '.72rem', color: '#7f1d1d', marginBottom: '.2rem' }}>New principal:</div>
            <code style={{ color: '#f9a8d4', fontSize: '.77rem', userSelect: 'all', wordBreak: 'break-all' }}>{serviceAccount}</code>
          </div>
          <div style={{ background: '#0f0505', borderRadius: '6px', padding: '.6rem .85rem' }}>
            <div style={{ fontSize: '.72rem', color: '#7f1d1d', marginBottom: '.2rem' }}>Role:</div>
            <code style={{ color: '#86efac', fontSize: '.77rem' }}>BigQuery Job User</code>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '.72rem', color: '#7f1d1d', lineHeight: 1.6, marginTop: '.75rem', marginBottom: 0 }}>
        After saving, wait a few seconds and try your search again.
        This is a one-time setup — you won't need to repeat it.
      </p>
    </div>
  );
}
