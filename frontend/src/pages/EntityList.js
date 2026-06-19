/**
 * EntityList — shared list/search page used by both Institutions and Funders.
 *
 * Config props:
 *   entityData / setEntityData  — App-level state for this entity
 *   basket / addToBasket        — basket state
 *   apiTop                      — URL prefix for top results (e.g. '/api/institutions/top')
 *   apiSearch                   — URL prefix for search (e.g. '/api/institutions/search')
 *   idKey                       — primary key field name (e.g. 'institution_id')
 *   fields                      — array of { value, label } for the search-by dropdown
 *   title                       — page heading
 *   csvName                     — filename for CSV export
 *   renderRow                   — fn(row, inBasket, addToBasket) → <tr> contents (tds only, no <tr> wrapper)
 *   renderHeaders               — fn(SortTh) → header <th> elements
 */
import React, { useState } from 'react';
import useTable from './useTable';
import { apiFetch, exportCsv } from '../api';
import { BytesTag } from '../bytesInfo';
import { PermissionError, QueryModal } from './BasketShared';

const DEFAULT_LIMIT = 100;
const STEP = 100;

export default function EntityList({
  entityData,
  setEntityData,
  basket,
  addToBasket,
  addManyToBasket,
  apiTop,
  apiSearch,
  idKey,
  fields,
  title,
  csvName,
  renderHeaders,
  renderRow,
  projectId,
  queryBuilder,
}) {
  const { rows, yearFrom: fetchedYF, yearTo: fetchedYT, bytesProcessed } = entityData;
  const [loading, setLoading]           = useState(false);
  const [q,       setQ]                 = useState('');
  const [field,   setField]             = useState(fields[0].value);
  const [yearFrom, setYF]               = useState(fetchedYF);
  const [yearTo,   setYT]               = useState(fetchedYT);
  const [permissionError, setPermErr]   = useState(false);
  const [showQuery,       setShowQuery] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(DEFAULT_LIMIT);
  const [minimized, setMinimized] = useState(false);

  const { visibleRows, onSort, sortIcon, sortKey } = useTable(rows, displayLimit);

  const fetchData = (yf, yt, sq, sf) => {
    setLoading(true); setPermErr(false); setDisplayLimit(DEFAULT_LIMIT);
    const url = sq.trim()
      ? `${apiSearch}?q=${encodeURIComponent(sq)}&field=${sf}&year_from=${yf}&year_to=${yt}&limit=5000`
      : `${apiTop}?year_from=${yf}&year_to=${yt}&limit=5000`;
    apiFetch(url)
      .then(d => {
        setEntityData({ rows: d?.rows ?? [], yearFrom: yf, yearTo: yt, bytesProcessed: d?.bytes_processed ?? null });
      })
      .catch(e => {
        if (e.message === '403' || e.message?.startsWith('Permission denied')) {
          setPermErr(true);
        }
        setEntityData({ rows: [], yearFrom: yf, yearTo: yt, bytesProcessed: null });
      })
      .finally(() => setLoading(false));
  };

  const apply = () => fetchData(yearFrom, yearTo, q, field);

  const inBasket = id => basket.some(b => b[idKey] === id);

  const SortTh = ({ k, children }) => (
    <th onClick={() => onSort(k)} className={sortKey === k ? 'sorted' : ''}>{children}{sortIcon(k)}</th>
  );

  const hasMore = displayLimit < rows.length;

  return (
    <div className="page">
      <h1>{title}</h1>
      <div className="controls">
        <div className="field-group">
          <label>Search by</label>
          <select value={field} onChange={e => setField(e.target.value)}>
            {fields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <input
          type="text"
          placeholder={`Search by ${fields.find(f => f.value === field)?.label}…`}
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && apply()}
        />
        <div className="divider" />
        <div className="field-group">
          <label>Years</label>
          <input type="number" value={yearFrom} onChange={e => setYF(Number(e.target.value))} />
          <label>–</label>
          <input type="number" value={yearTo}   onChange={e => setYT(Number(e.target.value))} />
        </div>
        <button className="btn" onClick={apply}>Search</button>
        {rows.length > 0 && (
          <button className="btn ghost" onClick={() => exportCsv(rows, csvName)}>⬇ CSV</button>
        )}
        {rows.length > 0 && queryBuilder && (
          <button className="btn ghost" onClick={() => setShowQuery(true)}>Get export query</button>
        )}
      </div>

      {bytesProcessed != null && (
        <div style={{ marginBottom: '.75rem' }}>
          <BytesTag bytes={bytesProcessed} />
          {fetchedYF !== yearFrom || fetchedYT !== yearTo
            ? <span style={{ fontSize: '.7rem', color: '#334155', marginLeft: '.5rem' }}>
                (showing results for {fetchedYF}–{fetchedYT})
              </span>
            : null}
        </div>
      )}

      {permissionError && <PermissionError projectId={projectId} />}
      {loading && <div className="status">Loading…</div>}
      {!loading && rows.length === 0 && (
        <div className="status">Use the controls above and click Search to load data.</div>
      )}
      {!loading && rows.length > 0 && (
        minimized
          ? <div className="tbl-minimized">
              <span>{rows.length.toLocaleString()} results hidden</span>
              <button className="btn ghost" onClick={() => setMinimized(false)}>Show table</button>
            </div>
          : <div className="table-wrap">
              <div className="tbl-footer" style={{ marginBottom: '.5rem', marginTop: 0 }}>
                <span>Showing {visibleRows.length} of {rows.length} results</span>
                <div className="tbl-expand">
                  <button
                    className="btn ghost"
                    onClick={() => addManyToBasket(rows)}
                    title="Add all results to basket (not just visible rows)"
                  >+ Add all {rows.length.toLocaleString()} to basket</button>
                  <button className="btn ghost" onClick={() => setMinimized(true)} title="Minimize table">− Minimize</button>
                </div>
              </div>
              <table>
                <thead><tr>
                  <th>#</th>
                  <th></th>
                  {renderHeaders(SortTh)}
                  <th></th>
                </tr></thead>
                <tbody>
                  {visibleRows.map((r, i) => (
                    <tr key={r[idKey]} className={inBasket(r[idKey]) ? 'in-basket' : ''}>
                      <td className="rank">{i + 1}</td>
                      <td>
                        {r.thumbnail_url
                          ? <img className="thumb" src={r.thumbnail_url} alt="" />
                          : <div className="thumb" />}
                      </td>
                      {renderRow(r, inBasket(r[idKey]), addToBasket)}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="tbl-footer">
                <span>Showing {visibleRows.length} of {rows.length} results</span>
                {sortKey && <span className="sort-note">Sorted within first {visibleRows.length} results</span>}
                <div className="tbl-expand">
                  {hasMore && (<>
                    <button className="btn ghost" onClick={() => setDisplayLimit(l => l + STEP)}>+ {STEP} more</button>
                    <button className="btn ghost" onClick={() => setDisplayLimit(rows.length)}>Show all {rows.length.toLocaleString()}</button>
                  </>)}
                  <button className="btn ghost" onClick={() => setMinimized(true)} title="Minimize table">− Minimize</button>
                </div>
              </div>
            </div>
      )}
      {showQuery && queryBuilder && (
        <QueryModal sql={queryBuilder(fetchedYF, fetchedYT, q, field)} onClose={() => setShowQuery(false)} />
      )}
    </div>
  );
}
