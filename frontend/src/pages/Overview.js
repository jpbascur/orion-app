import React from 'react';

const NAV_CARDS = [
  { key: 'institutions',   icon: '🏛',  label: 'Institutions',  group: 'Search'  },
  { key: 'funders',        icon: '💰',  label: 'Funders',       group: 'Search'  },
  { key: 'inst-basket',    icon: '🛒',  label: 'Institutions',  group: 'Basket'  },
  { key: 'funder-basket',  icon: '🛒',  label: 'Funders',       group: 'Basket'  },
  { key: 'guide',          icon: '📖',  label: 'Guide',         group: null      },
  { key: 'lab',            icon: '⚗️',  label: 'Lab',           group: null      },
];

function DatasetRow({ badge, name, href, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '.75rem 0', borderBottom: '1px solid #1e2235' }}>
      <span style={{ background: '#2d3148', color: '#7c8cff', fontSize: '.65rem', fontWeight: 700, padding: '.2rem .5rem', borderRadius: '4px', flexShrink: 0, marginTop: '1px', letterSpacing: '.04em' }}>{badge}</span>
      <div>
        <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: '.8rem', color: '#7c8cff', fontFamily: 'monospace' }}>{name}</a>
        <div style={{ fontSize: '.75rem', color: '#475569', lineHeight: 1.6, marginTop: '.2rem' }}>{desc}</div>
      </div>
    </div>
  );
}

export default function Overview({ setPage }) {
  return (
    <div className="page">
      <h1>ORION Research Dashboard</h1>
      <p style={{color:'#64748b',marginBottom:'.75rem',fontSize:'.925rem',lineHeight:1.7}}>
        A user-friendly interface for exploring research institutions and funders using open bibliometric data from{' '}
        <a href="https://orion-dbs.community" target="_blank" rel="noreferrer" style={{color:'#7c8cff'}}>ORION-DBs</a>.
      </p>
      <p style={{color:'#334155',fontSize:'.8rem',marginBottom:'2rem'}}>
        Open source · MIT License ·{' '}
        <a href="https://github.com/jpbascur/orion-app" target="_blank" rel="noreferrer" style={{color:'#475569'}}>
          github.com/jpbascur/orion-app
        </a>
      </p>

      <div className="cards">
        {NAV_CARDS.map(({ key, icon, label, group }) => (
          <button
            key={key}
            className="card"
            onClick={() => setPage(key)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setPage(key)}
          >
            <div className="val">{icon}</div>
            <div className="lbl">{group ? <><span style={{fontSize:'.65em',color:'#475569',display:'block',marginBottom:'.1em'}}>{group}</span>{label}</> : label}</div>
          </button>
        ))}
      </div>

      {/* Data sources */}
      <div style={{marginTop:'2rem',marginBottom:'2.5rem'}}>
        <p style={{fontSize:'.7rem',fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'.75rem'}}>Data sources</p>

        <div style={{background:'#1a1d27',border:'1px solid #2d3148',borderRadius:'10px',padding:'0 1rem'}}>
          <DatasetRow
            badge="main"
            name="cwts-leiden.openalex_2025aug"
            href="https://orion-dbs.community/collections/cwts/#openalex_2025aug"
            desc="OpenAlex August 2025 snapshot in relational format, published by CWTS Leiden. Powers all institution and funder search, basket queries, and co-occurrence networks."
          />
          <DatasetRow
            badge="topics"
            name="cwts-leiden.openalex_2023nov_classification"
            href="https://orion-dbs.community/collections/cwts/#openalex_2023nov_classification"
            desc="Algorithmic classification of ~71 million publications into 4,521 micro-clusters, 917 meso-clusters, and 20 macro-clusters, using the extended direct citation approach and Leiden algorithm. Used for the topic breakdown in baskets."
          />
        </div>

        <p style={{fontSize:'.73rem',color:'#334155',marginTop:'.75rem',lineHeight:1.6}}>
          Both datasets are part of the{' '}
          <a href="https://orion-dbs.community/collections/cwts/" target="_blank" rel="noreferrer" style={{color:'#475569'}}>
            CWTS Leiden collection on ORION-DBs
          </a>
          {' '}— a community platform for open research data on BigQuery.
          All data derived from{' '}
          <a href="https://openalex.org" target="_blank" rel="noreferrer" style={{color:'#475569'}}>OpenAlex</a>{' '}(CC0).
        </p>
      </div>

      <div style={{padding:'1rem',background:'#1a1d27',border:'1px solid #2d3148',borderRadius:'8px',maxWidth:'500px'}}>
        <p style={{color:'#475569',fontSize:'.825rem',lineHeight:1.7,margin:0}}>
          New to ORION? The <strong style={{color:'#64748b'}}>Guide</strong> tab explains how the data is structured,
          how co-occurrence networks are built, and how to export results to BigQuery.
        </p>
      </div>

      {/* Acknowledgements */}
      <div style={{marginTop:'2.5rem',paddingTop:'2rem',borderTop:'1px solid #1e2235'}}>
        <p style={{fontSize:'.7rem',color:'#334155',marginBottom:'.6rem',textTransform:'uppercase',letterSpacing:'.06em',fontWeight:600}}>Acknowledgements</p>
        <p style={{fontSize:'.78rem',color:'#475569',lineHeight:1.8,maxWidth:'720px'}}>
          Data provided by the{' '}
          <a href="https://orion-dbs.community" target="_blank" rel="noreferrer" style={{color:'#64748b'}}>ORION — Open Research Information on BigQuery</a>
          {' '}initiative and{' '}
          <a href="https://www.cwts.nl/" target="_blank" rel="noreferrer" style={{color:'#64748b'}}>CWTS Leiden</a>.
          {' '}Research data sourced from{' '}
          <a href="https://openalex.org" target="_blank" rel="noreferrer" style={{color:'#64748b'}}>OpenAlex</a>
          {' '}(CC0).
          {' '}Network visualisation powered by{' '}
          <a href="https://app.vosviewer.com" target="_blank" rel="noreferrer" style={{color:'#64748b'}}>VOSviewer Online</a>
          {' '}(Van Eck &amp; Waltman, CWTS Leiden).
        </p>
        <p style={{fontSize:'.72rem',color:'#2d3148',marginTop:'.75rem'}}>
          MIT License · © 2025 Juan Pablo Bascur Cifuentes ·{' '}
          <a href="https://github.com/jpbascur/orion-app" target="_blank" rel="noreferrer" style={{color:'#334155'}}>github.com/jpbascur/orion-app</a>
        </p>
      </div>
    </div>
  );
}
