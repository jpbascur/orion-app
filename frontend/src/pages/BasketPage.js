/**
 * Generic basket page used for both institution and funder baskets.
 */
import React, { useState } from 'react';
import { apiFetch, openVosViewer } from '../api';
import { BytesTag } from '../bytesInfo';
import { QueryModal, ResultTable, PermissionError, CollapsibleSection, TopicsTable } from './BasketShared';
import VosPanel from './VosPanel';

const initialVosOptions = {
  limit: 100,
  limitInput: '100',
  allWorks: false,
  loading: false,
  error: '',
};

export default function BasketPage({
  basket,
  removeFromBasket,
  clearBasket,
  basketData,
  setBasketData,
  addInstToBasket,
  addFunderToBasket,
  instBasket,
  funderBasket,
  setPage,
  projectId,
  type,
  idKey,
  apiBase,
  queryBuilders,
  title,
  emptyHint,
}) {
  const { yearFrom: savedYF, yearTo: savedYT, worksResult, coInstResult, coFundResult, topicsResult } = basketData;
  const [yearFrom, setYF] = useState(savedYF);
  const [yearTo, setYT] = useState(savedYT);

  const [worksLoading, setWorksLoading] = useState(false);
  const [coInstLoading, setCoInstLoading] = useState(false);
  const [coFundLoading, setCoFundLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const [vosState, setVosState] = useState({
    institutions: { ...initialVosOptions },
    funders: { ...initialVosOptions },
  });

  const [worksQuery, setWorksQuery] = useState(false);
  const [coInstQuery, setCoInstQuery] = useState(false);
  const [coFundQuery, setCoFundQuery] = useState(false);
  const [topicsQuery, setTopicsQuery] = useState(false);

  const [error, setError] = useState('');
  const [permissionError, setPermError] = useState(false);

  const ids = basket.map(b => Number(b[idKey]));
  const sourceIdField = type === 'institutions' ? 'institution_ids' : 'funder_ids';

  const applyYF = v => {
    setYF(v);
    setBasketData(d => ({ ...d, yearFrom: v }));
  };
  const applyYT = v => {
    setYT(v);
    setBasketData(d => ({ ...d, yearTo: v }));
  };

  const setResult = (key, value, yf, yt) => {
    setBasketData(d => ({ ...d, [key]: value, [`${key.replace('Result', '')}YF`]: yf, [`${key.replace('Result', '')}YT`]: yt }));
  };
  const setTopicsResult = (r, bp, unc, yf, yt) => {
    setBasketData(d => ({ ...d, topicsResult: r, topicsBP: bp, topicsUnclassified: unc, topicsYF: yf, topicsYT: yt }));
  };

  const requestBody = (yf, yt) => JSON.stringify({
    [sourceIdField]: ids,
    year_from: yf,
    year_to: yt,
    limit: 5000,
  });

  const postOpts = (yf, yt) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: requestBody(yf, yt),
  });

  const handleError = e => {
    if (e.message === '403' || e.message?.startsWith('Permission denied')) {
      setPermError(true);
    } else {
      setError(e.message);
    }
  };

  const runBasketQuery = (path, setLoading, onSuccess) => {
    const yf = yearFrom;
    const yt = yearTo;
    setLoading(true);
    setError('');
    setPermError(false);
    apiFetch(`${apiBase}/${path}`, postOpts(yf, yt))
      .then(d => { if (d) onSuccess(d, yf, yt); })
      .catch(handleError)
      .finally(() => setLoading(false));
  };

  const getWorks = () => runBasketQuery('works', setWorksLoading, (d, yf, yt) => setResult('worksResult', d, yf, yt));
  const getCoInst = () => runBasketQuery('co-institutions', setCoInstLoading, (d, yf, yt) => setResult('coInstResult', d, yf, yt));
  const getCoFund = () => runBasketQuery('co-funders', setCoFundLoading, (d, yf, yt) => setResult('coFundResult', d, yf, yt));
  const getTopics = () => runBasketQuery('topics', setTopicsLoading, (d, yf, yt) => {
    setTopicsResult(d.rows, d.bytes_processed, d.unclassified_works ?? 0, yf, yt);
  });

  const updateVos = (targetType, patch) => {
    setVosState(s => ({ ...s, [targetType]: { ...s[targetType], ...patch } }));
  };

  const vosBuildUrl = targetType => {
    if (type === 'institutions' && targetType === 'institutions') return '/api/vos/build/institutions';
    if (type === 'institutions' && targetType === 'funders') return '/api/vos/build/institutions/co-funders';
    if (type === 'funders' && targetType === 'institutions') return '/api/vos/build/funders/co-institutions';
    return '/api/vos/build/funders';
  };

  const openVos = targetType => {
    const opts = vosState[targetType];
    updateVos(targetType, { loading: true, error: '' });
    openVosViewer(vosBuildUrl(targetType), {
      [sourceIdField]: ids,
      year_from: yearFrom,
      year_to: yearTo,
      limit: opts.limit,
      all_works: opts.allWorks,
    })
      .catch(e => updateVos(targetType, { error: e.message }))
      .finally(() => updateVos(targetType, { loading: false }));
  };

  const actionBtn = (label, onClick, loading) => (
    <button
      className="btn"
      onClick={onClick}
      disabled={loading}
      style={{ flex: 1, justifyContent: 'center', opacity: loading ? .6 : 1 }}
    >
      {loading ? 'Running...' : label}
    </button>
  );

  const renderVosPanel = targetType => (
    <VosPanel
      sourceType={type}
      targetType={targetType}
      options={vosState[targetType]}
      onChange={patch => updateVos(targetType, patch)}
      onOpen={() => openVos(targetType)}
      setPage={setPage}
    />
  );

  const wYF = basketData.worksYF ?? yearFrom;
  const wYT = basketData.worksYT ?? yearTo;

  return (
    <div className="page">
      <h1>{title}</h1>
      {basket.length === 0
        ? <div className="status" style={{ marginTop: '3rem' }}>{emptyHint}</div>
        : <>
          <div style={{ marginBottom: '1.5rem' }}>
            {basket.map(b => (
              <div key={b[idKey]} className="basket-item">
                <div>
                  <div className="bi-name">{b.name}</div>
                  <div className="bi-meta">
                    {b.country && <span className="badge-country" style={{ marginRight: '.4rem' }}>{b.country}</span>}
                    {b.type && <span className="badge-type">{b.type}</span>}
                  </div>
                </div>
                <button className="btn danger" style={{ padding: '.25rem .6rem', fontSize: '.75rem' }} onClick={() => removeFromBasket(b[idKey])}>Remove</button>
              </div>
            ))}
            {basket.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                <button
                  className="btn danger"
                  style={{ fontSize: '.75rem', padding: '.3rem .75rem' }}
                  onClick={() => { if (window.confirm(`Remove all ${basket.length} items from basket?`)) clearBasket(); }}
                >
                  Remove all ({basket.length})
                </button>
              </div>
            )}
          </div>

          <div className="controls" style={{ marginBottom: '1rem' }}>
            <div className="field-group">
              <label>Years</label>
              <input type="number" value={yearFrom} onChange={e => applyYF(Number(e.target.value))} />
              <label>to</label>
              <input type="number" value={yearTo} onChange={e => applyYT(Number(e.target.value))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {actionBtn('Get all works', getWorks, worksLoading)}
            {actionBtn('Get co-occurring institutions', getCoInst, coInstLoading)}
            {actionBtn('Get co-occurring funders', getCoFund, coFundLoading)}
            {actionBtn('Get topic breakdown', getTopics, topicsLoading)}
          </div>

          {permissionError && <PermissionError projectId={projectId} />}
          {error && <div className="status" style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</div>}

          {worksResult && worksResult.total_works > 0 && (
            <CollapsibleSection
              title="All works"
              badge={<BytesTag bytes={worksResult.bytes_processed} />}
              actions={<button className="btn ghost" onClick={() => setWorksQuery(true)}>Get export query</button>}
            >
              <div className="stat-box" style={{ display: 'inline-block', minWidth: '200px' }}>
                <div className="stat-val">{Number(worksResult.total_works).toLocaleString()}</div>
                <div className="stat-lbl">
                  Total works {wYF}-{wYT}<br />
                  <small style={{ color: '#334155' }}>No double counting</small>
                </div>
              </div>
            </CollapsibleSection>
          )}
          {worksResult && worksResult.total_works === 0 && (
            <div className="status" style={{ marginBottom: '2rem' }}>No works found for this basket in {wYF}-{wYT}.</div>
          )}

          {(coInstResult || coInstLoading) && (
            <CollapsibleSection
              title="Co-occurring institutions"
              badge={coInstResult && <BytesTag bytes={coInstResult.bytes_processed} />}
              actions={coInstResult && <button className="btn ghost" onClick={() => setCoInstQuery(true)}>Get export query</button>}
            >
              {coInstResult?.rows?.length > 0 && renderVosPanel('institutions')}
              <ResultTable
                rows={coInstResult?.rows || []}
                type="institutions"
                addToBasket={addInstToBasket}
                basket={instBasket}
                idKey="institution_id"
                loading={coInstLoading}
              />
            </CollapsibleSection>
          )}

          {(coFundResult || coFundLoading) && (
            <CollapsibleSection
              title="Co-occurring funders"
              badge={coFundResult && <BytesTag bytes={coFundResult.bytes_processed} />}
              actions={coFundResult && <button className="btn ghost" onClick={() => setCoFundQuery(true)}>Get export query</button>}
            >
              {coFundResult?.rows?.length > 0 && renderVosPanel('funders')}
              <ResultTable
                rows={coFundResult?.rows || []}
                type="funders"
                addToBasket={addFunderToBasket}
                basket={funderBasket}
                idKey="funder_id"
                loading={coFundLoading}
              />
            </CollapsibleSection>
          )}

          {(topicsResult || topicsLoading) && (() => {
            const tYF = basketData.topicsYF ?? yearFrom;
            const tYT = basketData.topicsYT ?? yearTo;
            return (
              <CollapsibleSection
                title="Topic breakdown"
                badge={topicsResult && <BytesTag bytes={basketData.topicsBP} />}
                actions={topicsResult?.length > 0 && <button className="btn ghost" onClick={() => setTopicsQuery(true)}>Get export query</button>}
              >
                <p style={{ fontSize: '.78rem', color: '#475569', lineHeight: 1.6, marginBottom: '.75rem' }}>
                  Distribution of the basket's works across micro-clusters from the{' '}
                  <strong style={{ color: '#64748b' }}>CWTS openalex_2023nov_classification</strong>.
                  {' '}Proportion = basket works / total cluster works within {tYF}-{tYT}.
                </p>
                <TopicsTable rows={topicsResult || []} loading={topicsLoading} unclassified={basketData.topicsUnclassified ?? 0} />
              </CollapsibleSection>
            );
          })()}

          {worksQuery && <QueryModal sql={queryBuilders.works(ids, wYF, wYT)} onClose={() => setWorksQuery(false)} />}
          {coInstQuery && <QueryModal sql={queryBuilders.coInst(ids, basketData.coInstYF ?? yearFrom, basketData.coInstYT ?? yearTo)} onClose={() => setCoInstQuery(false)} />}
          {coFundQuery && <QueryModal sql={queryBuilders.coFund(ids, basketData.coFundYF ?? yearFrom, basketData.coFundYT ?? yearTo)} onClose={() => setCoFundQuery(false)} />}
          {topicsQuery && <QueryModal sql={queryBuilders.topics(ids, basketData.topicsYF ?? yearFrom, basketData.topicsYT ?? yearTo)} onClose={() => setTopicsQuery(false)} />}
        </>
      }
    </div>
  );
}
