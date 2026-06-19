import React, { useState } from 'react';
import { useServiceAccount } from '../config';

function Section({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: '1rem', background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '10px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.75rem', padding: '1rem 1.25rem', textAlign: 'left' }}
      >
        <span style={{ fontSize: '.75rem', color: '#475569', flexShrink: 0, transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
        <span style={{ fontSize: '.8rem', fontWeight: 700, color: open ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          {title}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 1.25rem 1.25rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Step({ n, children }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: '#2d3148', color: '#7c8cff', fontSize: '.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {n}
      </div>
      <div style={{ fontSize: '.875rem', color: '#94a3b8', lineHeight: 1.7, paddingTop: '2px' }}>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: 'relative', marginTop: '.75rem', marginBottom: '.75rem' }}>
      <pre style={{ background: '#0f1117', border: '1px solid #2d3148', borderRadius: '8px', padding: '1rem 1.25rem', fontSize: '.8rem', color: '#a78bfa', overflowX: 'auto', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {children.trim()}
      </pre>
      <button
        onClick={copy}
        style={{ position: 'absolute', top: '.5rem', right: '.5rem', background: copied ? '#14532d' : '#2d3148', color: copied ? '#4ade80' : '#64748b', border: 'none', borderRadius: '4px', padding: '.25rem .6rem', fontSize: '.7rem', cursor: 'pointer', transition: 'all .2s' }}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

function Note({ children }) {
  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderLeft: '3px solid #7c8cff', borderRadius: '0 6px 6px 0', padding: '.75rem 1rem', fontSize: '.825rem', color: '#64748b', lineHeight: 1.65, marginTop: '.75rem', marginBottom: '.75rem' }}>
      {children}
    </div>
  );
}

function InfoCard({ icon, title, body }) {
  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '10px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.6rem' }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>{title}</span>
      </div>
      <p style={{ fontSize: '.85rem', color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>{body}</p>
    </div>
  );
}

const EXAMPLE_QUERY = `-- Step 1: paste your export query here as a CTE
WITH my_works AS (
  -- (paste the query from the basket here)
)

-- Step 2: join with the work table to get titles and DOIs
SELECT
  w.work_id,
  w.title,
  w.doi,
  w.pub_year
FROM my_works mw
JOIN \`cwts-leiden.openalex_2025aug.work\` w
  ON mw.work_id = w.work_id
ORDER BY w.pub_year DESC`;

export default function Guide() {
  const serviceAccount = useServiceAccount();

  return (
    <div className="page" style={{ maxWidth: '860px' }}>
      <h1>Guide</h1>
      <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '.925rem', lineHeight: 1.7 }}>
        How ORION works, how the data is structured, how networks are built, and how to go deeper with BigQuery.
      </p>

      {/* ── GCP setup ────────────────────────────────────────────────── */}
      <Section title="0 — One-time GCP setup (required for all users)">
        <p style={{ fontSize: '.875rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '1rem' }}>
          ORION runs BigQuery queries on your behalf using a shared service account, billing the cost
          to your GCP project. Before your first use, you need to grant that service account permission
          to submit jobs in your project. This is a one-time step.
        </p>

        <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
          <Step n="1">
            <strong style={{ color: '#e2e8f0' }}>Enable the BigQuery API</strong> in your project if you haven't already:{' '}
            <a href="https://console.cloud.google.com/apis/library/bigquery.googleapis.com" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>
              Enable BigQuery API ↗
            </a>
          </Step>
          <Step n="2">
            Open <a href="https://console.cloud.google.com/iam-admin/iam" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>IAM & Admin → IAM ↗</a> for your project,
            then click <strong style={{ color: '#e2e8f0' }}>Grant Access</strong>.
          </Step>
          <Step n="3">
            <span>Add the following principal and role:</span>
            <div style={{ background: '#0f1117', border: '1px solid #2d3148', borderRadius: '6px', padding: '.75rem 1rem', marginTop: '.5rem' }}>
              <div style={{ marginBottom: '.4rem' }}>
                <span style={{ fontSize: '.75rem', color: '#475569' }}>New principal:</span>
                <br />
                <code style={{ color: '#a78bfa', fontSize: '.8rem', userSelect: 'all' }}>{serviceAccount}</code>
              </div>
              <div>
                <span style={{ fontSize: '.75rem', color: '#475569' }}>Role:</span>
                <br />
                <code style={{ color: '#4ade80', fontSize: '.8rem' }}>BigQuery Job User</code>
              </div>
            </div>
          </Step>
          <Step n="4">
            Click <strong style={{ color: '#e2e8f0' }}>Save</strong>. You're done — go back to the basket and try again.
          </Step>
        </div>

        <Note>
          <strong>What this grants:</strong> the service account can submit BigQuery jobs billed to your project.
          It does <strong>not</strong> get access to any data stored in your project — only the ability to run queries
          against public datasets like <code>cwts-leiden.openalex_2025aug</code>.
        </Note>
      </Section>

      {/* ── Data model ───────────────────────────────────────────────── */}
      <Section title="1 — How the data is structured">
        <p style={{ fontSize: '.875rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '1rem' }}>
          ORION uses the <strong style={{ color: '#e2e8f0' }}>CWTS OpenAlex 2025 August snapshot</strong> — a curated
          version of the <a href="https://openalex.org" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>OpenAlex</a> catalogue
          published by <a href="https://www.cwts.nl" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>CWTS Leiden</a> as
          part of the <a href="https://orion-dbs.community" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>ORION initiative</a>.
          Everything is a BigQuery public dataset at <code style={{ color: '#a78bfa' }}>cwts-leiden.openalex_2025aug</code>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <InfoCard
            icon="🏛"
            title="Works → Institutions"
            body="The link is work → authorship → institution. An authorship is one author's contribution to a work, and the institution is assigned solely from the affiliation that author declared on that paper — not from any other known affiliations of the author."
          />
          <InfoCard
            icon="💰"
            title="Works → Funders"
            body="The link is work → grant → funder. OpenAlex constructs this from funding acknowledgements in PDFs, Crossref/DataCite metadata, and direct funder data feeds. Coverage is uneven — especially for older papers — and the data is continuously updated."
          />
        </div>
        <Note>
          Works counts in ORION are <strong>distinct work counts</strong> — a work is never counted twice for the same institution or funder, even if multiple authors from the same institution contributed.
        </Note>
      </Section>

      {/* ── VOSviewer networks ───────────────────────────────────────── */}
      <Section title="2 — Co-occurrence networks in VOSviewer">
        <p style={{ fontSize: '.875rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '1rem' }}>
          From any basket you can open a co-occurrence network in{' '}
          <a href="https://app.vosviewer.com" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>VOSviewer Online</a>,
          a free tool for interactive network visualisation developed by{' '}
          <a href="https://www.cwts.nl" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>CWTS Leiden</a>.
        </p>

        <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#64748b', marginBottom: '.5rem' }}>How the network is built</div>
        <Step n="1">
          <strong style={{ color: '#e2e8f0' }}>Node set:</strong> ORION starts from the works that involve your basket institutions or funders. It then finds all other institutions/funders that appear on those same works — these become the nodes. You control how many co-occurring nodes to include (default: top 100 by works count).
        </Step>
        <Step n="2">
          <strong style={{ color: '#e2e8f0' }}>Node size:</strong> proportional to the number of works for that institution or funder, within the selected works pool.
        </Step>
        <Step n="3">
          <strong style={{ color: '#e2e8f0' }}>Edges:</strong> for every pair of nodes, ORION counts how many works they share. This is the edge strength — the thicker the line between two nodes, the more works they have in common.
        </Step>
        <Step n="4">
          <strong style={{ color: '#e2e8f0' }}>Colours:</strong> your basket institutions/funders appear in cluster 1 (one colour); co-occurring nodes appear in cluster 2 (another colour). Within each cluster, VOSviewer may further subdivide nodes based on their network structure.
        </Step>

        <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#64748b', marginBottom: '.5rem', marginTop: '1.25rem' }}>Works pool options</div>
        <p style={{ fontSize: '.875rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '.5rem' }}>
          The <strong style={{ color: '#e2e8f0' }}>works pool</strong> controls which works are used to calculate node sizes and edge strengths. There are two options:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '.75rem' }}>
          <div style={{ background: '#0f1117', border: '1px solid #2d3148', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#7c8cff', marginBottom: '.4rem' }}>Basket works only (default)</div>
            <p style={{ fontSize: '.78rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Only works that involve at least one basket institution/funder are counted. Node sizes and edge weights reflect the basket's view of the world — how active each co-occurring node is <em>in relation to your basket</em>.
            </p>
          </div>
          <div style={{ background: '#0f1117', border: '1px solid #2d3148', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#a78bfa', marginBottom: '.4rem' }}>Include co-occurring works</div>
            <p style={{ fontSize: '.78rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              All works among map nodes are counted, including works between co-occurring nodes that don't involve your basket. Node sizes become the nodes' overall output; edge weights reflect the full relationship between any two nodes in the map.
            </p>
          </div>
        </div>
        <Note>
          The <strong>node set</strong> is always determined from basket works — only the counts used for sizes and edges change between the two options.
        </Note>

        <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#64748b', marginBottom: '.5rem', marginTop: '1.25rem' }}>Using VOSviewer Online</div>
        <p style={{ fontSize: '.875rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '.5rem' }}>
          Once the network opens in VOSviewer Online, you can:
        </p>
        <div style={{ fontSize: '.875rem', color: '#94a3b8', lineHeight: 2 }}>
          • <strong style={{ color: '#e2e8f0' }}>Zoom and pan</strong> — scroll to zoom, drag to pan<br/>
          • <strong style={{ color: '#e2e8f0' }}>Click a node</strong> — highlights its direct connections<br/>
          • <strong style={{ color: '#e2e8f0' }}>View tab</strong> — change node size metric, colour scheme, and link visibility thresholds<br/>
          • <strong style={{ color: '#e2e8f0' }}>Update tab</strong> — re-run the layout algorithm or adjust clustering resolution<br/>
          • <strong style={{ color: '#e2e8f0' }}>Screenshot</strong> — export the visualisation as an image
        </div>
        <Note>
          The network link expires after 10 minutes. If the page doesn't load, go back to ORION and click the button again to generate a fresh link.
        </Note>
      </Section>

      {/* ── Export queries ───────────────────────────────────────────── */}
      <Section title="3 — What is a work ID?">
        <p style={{ fontSize: '.875rem', color: '#94a3b8', lineHeight: 1.7 }}>
          Every paper in the OpenAlex dataset has a unique <code style={{ color: '#a78bfa' }}>work_id</code> — a numeric identifier
          that links it across all tables. When you export from ORION, you get a list of these IDs.
          That list is small and fast to download, and from it you can join any other table in the
          dataset to get titles, abstracts, DOIs, citation counts, author lists, and more.
        </p>
        <Note>
          The full OpenAlex dataset is publicly available at <code>cwts-leiden.openalex_2025aug</code> in BigQuery.
          You already have access to it — it's the same dataset ORION queries on your behalf.
        </Note>
      </Section>

      <Section title="4 — Generating your export query">
        <Step n="1">
          Go to either the <strong style={{ color: '#e2e8f0' }}>Institution Basket</strong> or <strong style={{ color: '#e2e8f0' }}>Funder Basket</strong> tab
          and add the institutions or funders you are interested in.
        </Step>
        <Step n="2">
          Set your year range, then click <strong style={{ color: '#e2e8f0' }}>Get export query</strong>.
          A panel will open showing a SQL query tailored to your exact basket and filters.
        </Step>
        <Step n="3">
          Click <strong style={{ color: '#e2e8f0' }}>Copy</strong> to copy the query to your clipboard.
        </Step>
      </Section>

      <Section title="5 — Running the query in BigQuery">
        <Step n="1">
          Go to <a href="https://console.cloud.google.com/bigquery" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>console.cloud.google.com/bigquery</a> and
          make sure your project is selected in the top bar (the same project ID you used to log in to ORION).
        </Step>
        <Step n="2">
          Click <strong style={{ color: '#e2e8f0' }}>+ Compose a new query</strong>.
        </Step>
        <Step n="3">
          Paste your query into the editor and click <strong style={{ color: '#e2e8f0' }}>Run</strong>.
          BigQuery will show you how much data will be scanned before you run — this is what gets billed to your project.
        </Step>
        <Step n="4">
          To save the results, click <strong style={{ color: '#e2e8f0' }}>Save results</strong> above the results table.
          You can download as CSV, or save it as a new BigQuery table in your own project for further analysis.
        </Step>
        <Note>
          The first 1 TB of data scanned per month is free on Google Cloud. A typical ORION export
          query scans well under that, so most users will pay nothing.
        </Note>
      </Section>

      <Section title="6 — Joining with other OpenAlex tables">
        <p style={{ fontSize: '.875rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '.75rem' }}>
          Once you have a list of <code style={{ color: '#a78bfa' }}>work_id</code>s, you can join it with any table
          in <code style={{ color: '#a78bfa' }}>cwts-leiden.openalex_2025aug</code> using that field as the key.
          Here is an example that retrieves the title, DOI, and year for each work:
        </p>
        <CodeBlock>{EXAMPLE_QUERY}</CodeBlock>
        <p style={{ fontSize: '.875rem', color: '#94a3b8', lineHeight: 1.7, marginTop: '.75rem' }}>
          Some other useful tables you can join on <code style={{ color: '#a78bfa' }}>work_id</code>:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginTop: '.5rem' }}>
          {[
            { table: 'work_authorship', desc: 'Author names and positions' },
            { table: 'work_affiliation_institution', desc: 'Author–institution links' },
            { table: 'work_grant', desc: 'Funding grants acknowledged' },
            { table: 'work_topic', desc: 'Research topics / fields' },
            { table: 'work_concept', desc: 'OpenAlex concept tags' },
            { table: 'work_reference', desc: 'Citation references' },
          ].map(({ table, desc }) => (
            <div key={table} style={{ background: '#0f1117', border: '1px solid #2d3148', borderRadius: '6px', padding: '.6rem .85rem' }}>
              <code style={{ fontSize: '.775rem', color: '#a78bfa' }}>{table}</code>
              <div style={{ fontSize: '.775rem', color: '#475569', marginTop: '.2rem' }}>{desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="7 — Need help?">
        <p style={{ fontSize: '.875rem', color: '#94a3b8', lineHeight: 1.7 }}>
          If you are new to BigQuery, Google's{' '}
          <a href="https://cloud.google.com/bigquery/docs/query-overview" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>
            query overview documentation
          </a>{' '}
          is a good starting point. The OpenAlex data model is documented at{' '}
          <a href="https://docs.openalex.org" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>
            docs.openalex.org
          </a>.
          For questions about ORION, open an issue at{' '}
          <a href="https://github.com/jpbascur/orion-app" target="_blank" rel="noreferrer" style={{ color: '#7c8cff' }}>
            github.com/jpbascur/orion-app
          </a>.
        </p>
      </Section>
    </div>
  );
}
