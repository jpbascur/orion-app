import React from 'react';

function pluralLabel(type) {
  return type === 'institutions' ? 'institutions' : 'funders';
}

function singularLabel(type) {
  return type === 'institutions' ? 'institution' : 'funder';
}

export default function VosPanel({
  sourceType,
  targetType,
  options,
  onChange,
  onOpen,
  setPage,
}) {
  const sourceLabel = pluralLabel(sourceType);
  const targetLabel = pluralLabel(targetType);
  const sameType = sourceType === targetType;

  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '.85rem', fontWeight: 700, color: '#94a3b8' }}>Co-occurrence network</span>
        {setPage && (
          <button
            onClick={() => setPage('guide')}
            style={{ background: 'none', border: 'none', color: '#475569', fontSize: '.72rem', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginLeft: 'auto' }}
          >
            How does this work? - Guide
          </button>
        )}
      </div>

      <p style={{ fontSize: '.78rem', color: '#475569', lineHeight: 1.65, marginBottom: '1rem' }}>
        The map shows the top <strong style={{ color: '#64748b' }}>N {targetLabel}</strong> from this result.
        {sameType
          ? <> Basket items are highlighted as <strong style={{ color: '#64748b' }}>cluster 1</strong>; all others are cluster 2.</>
          : <> Nodes are {targetLabel} linked to your basket {sourceLabel}.</>}
        {' '}Node size = works. Edge thickness = shared works between each pair.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '.75rem', color: '#64748b', marginBottom: '.35rem' }}>
            Total {targetLabel} in the map
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontSize: '.78rem', color: '#475569' }}>Top</span>
            <input
              type="number"
              value={options.limitInput}
              min={10}
              max={500}
              onChange={e => onChange({ limitInput: e.target.value })}
              onBlur={e => {
                const parsed = parseInt(e.target.value, 10);
                const clamped = Number.isNaN(parsed) ? 100 : Math.max(10, Math.min(500, parsed));
                onChange({ limit: clamped, limitInput: String(clamped) });
              }}
              style={{ width: '64px', background: '#0f1117', border: '1px solid #2d3148', borderRadius: '6px', color: '#e2e8f0', padding: '.4rem .6rem', fontSize: '.85rem', outline: 'none' }}
            />
            <span style={{ fontSize: '.78rem', color: '#475569' }}>{targetLabel} total</span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '.75rem', color: '#64748b', marginBottom: '.35rem' }}>
            Works used for node size and edges
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={!options.allWorks}
                onChange={() => onChange({ allWorks: false })}
                style={{ marginTop: '2px', flexShrink: 0 }}
              />
              <span style={{ fontSize: '.78rem', color: !options.allWorks ? '#e2e8f0' : '#475569', lineHeight: 1.5 }}>
                Works from basket {sourceLabel} only
                <span style={{ display: 'block', fontSize: '.7rem', color: '#334155' }}>
                  Counts only works that involve at least one basket {singularLabel(sourceType)}.
                </span>
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={options.allWorks}
                onChange={() => onChange({ allWorks: true })}
                style={{ marginTop: '2px', flexShrink: 0 }}
              />
              <span style={{ fontSize: '.78rem', color: options.allWorks ? '#e2e8f0' : '#475569', lineHeight: 1.5 }}>
                Include works from map {targetLabel}
                <span style={{ display: 'block', fontSize: '.7rem', color: '#334155' }}>
                  Counts all works among map {targetLabel}, not just those involving the basket.
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <button
        className="btn"
        onClick={onOpen}
        disabled={options.loading}
        style={{ background: '#1a3a5c', opacity: options.loading ? .6 : 1 }}
      >
        {options.loading ? 'Building network...' : 'Open in VOSviewer Online'}
      </button>
      {options.error && (
        <span style={{ marginLeft: '1rem', fontSize: '.8rem', color: '#f87171' }}>{options.error}</span>
      )}
    </div>
  );
}
