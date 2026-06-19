import React, { useState } from 'react';
import { useServiceAccount } from '../config';

const S = {
  page:       { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117', padding: '1.5rem' },
  wrap:       { width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  card:       { background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '12px', padding: '1.5rem' },
  label:      { display: 'block', fontSize: '.75rem', color: '#64748b', marginBottom: '.3rem', fontWeight: 600 },
  sublabel:   { fontSize: '.75rem', color: '#475569', lineHeight: 1.5, marginBottom: '.6rem' },
  input:      { width: '100%', background: '#0f1117', border: '1px solid #2d3148', borderRadius: '6px', color: '#e2e8f0', padding: '.6rem .85rem', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' },
  btnPrimary: { width: '100%', background: '#fff', color: '#0f1117', border: 'none', borderRadius: '6px', padding: '.65rem', fontSize: '.95rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem', boxSizing: 'border-box' },
  divider:    { border: 'none', borderTop: '1px solid #2d3148', margin: '1rem 0' },
  stepRow:    { display: 'flex', gap: '.75rem', alignItems: 'flex-start', marginBottom: '.85rem' },
  stepNum:    { flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%', background: '#2d3148', color: '#7c8cff', fontSize: '.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  stepBody:   { fontSize: '.8rem', color: '#475569', lineHeight: 1.7 },
  link:       { color: '#7c8cff' },
  codeBox:    { background: '#0f1117', border: '1px solid #2d3148', borderRadius: '7px', padding: '.65rem .85rem', marginTop: '.5rem' },
  codeLabel:  { fontSize: '.68rem', color: '#334155', display: 'block', marginBottom: '.1rem' },
  errBox:     { color: '#f87171', fontSize: '.8rem', marginBottom: '.75rem', padding: '.5rem .75rem', background: '#2d1515', border: '1px solid #7f1d1d', borderRadius: '6px' },
  footer:     { color: '#2d3148', fontSize: '.7rem', textAlign: 'center', lineHeight: 1.7 },
  footerLink: { color: '#334155' },
};

export default function LoginGate() {
  const [projectId, setProjectId] = useState('');
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState(false);
  const [copiedRole, setCopiedRole] = useState(false);
  const serviceAccount = useServiceAccount();

  const bqApiUrl = `https://console.cloud.google.com/flows/enableapi?apiid=bigquery.googleapis.com`;
  const iamUrl = projectId.trim()
    ? `https://console.cloud.google.com/iam-admin/iam?project=${projectId.trim()}`
    : 'https://console.cloud.google.com/iam-admin/iam';

  const handleLogin = () => {
    const pid = projectId.trim();
    if (!pid) { setError('Please enter your Google Cloud project ID.'); return; }
    if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(pid)) {
      setError("That doesn't look right — 6–30 lowercase letters, digits, or hyphens, starting with a letter.");
      return;
    }
    window.location.href = `/auth/login?project_id=${encodeURIComponent(pid)}`;
  };

  const copyServiceAccount = () => {
    navigator.clipboard.writeText(serviceAccount).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRole = () => {
    navigator.clipboard.writeText('BigQuery Job User').catch(() => {});
    setCopiedRole(true);
    setTimeout(() => setCopiedRole(false), 2000);
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '.25rem' }}>
          <div style={{ fontSize: '2.25rem', marginBottom: '.3rem' }}>⭐</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: '0 0 .2rem' }}>ORION</h1>
          <p style={{ color: '#64748b', fontSize: '.875rem', margin: 0 }}>Research Dashboard</p>
        </div>

        <div style={S.card}>

          {/* Intro */}
          <p style={{ fontSize: '.85rem', color: '#94a3b8', lineHeight: 1.65, marginBottom: 0 }}>
            To use ORION you need to create and set up a <strong style={{ color: '#e2e8f0' }}>Google Cloud project</strong>, which is free and linked to your Google account. It takes about <strong style={{ color: '#e2e8f0' }}>1 minute</strong> and you only do it once. Follow the steps below by clicking the hyperlinks.
          </p>

          <hr style={S.divider} />

          {/* Step 1 */}
          <div style={S.stepRow}>
            <div style={S.stepNum}>1</div>
            <div style={S.stepBody}>
              <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noreferrer" style={S.link}>Create a Google Cloud project ↗</a>
              <span style={{ color: '#94a3b8' }}> — you can choose any name.</span>
            </div>
          </div>

          {/* Step 2 */}
          <div style={S.stepRow}>
            <div style={S.stepNum}>2</div>
            <div style={S.stepBody}>
              <strong style={{ color: '#94a3b8' }}>Set up: </strong>
              <a href="https://cloud.google.com/iam/docs/grant-role-console" target="_blank" rel="noreferrer" style={{ color: '#475569', fontSize: '.78rem', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>the set up grants an IAM role ↗</a>
            </div>
          </div>

          {/* Step 2.1 */}
          <div style={{ ...S.stepRow, paddingLeft: '1.75rem' }}>
            <div style={{ ...S.stepNum, background: 'transparent', border: '1px solid #2d3148', color: '#475569', fontSize: '.65rem' }}>2.1</div>
            <div style={S.stepBody}>
              <a href={bqApiUrl} target="_blank" rel="noreferrer" style={S.link}>Enable access to API ↗</a>
              <span style={{ color: '#94a3b8' }}> — open the link and follow the instructions.</span>
            </div>
          </div>

          {/* Step 2.2 */}
          <div style={{ ...S.stepRow, marginBottom: 0, paddingLeft: '1.75rem' }}>
            <div style={{ ...S.stepNum, background: 'transparent', border: '1px solid #2d3148', color: '#475569', fontSize: '.65rem' }}>2.2</div>
            <div style={S.stepBody}>
              <a href={iamUrl} target="_blank" rel="noreferrer" style={S.link}>Grant an IAM role ↗</a>
              <span style={{ color: '#94a3b8' }}> — open the link, click <strong style={{ color: '#94a3b8' }}>Grant Access</strong> and fill in the fields below.</span>
              <div style={S.codeBox}>
                <span style={S.codeLabel}>New principals</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
                  <code style={{ fontSize: '.77rem', color: '#a78bfa', flex: 1, wordBreak: 'break-all' }}>{serviceAccount}</code>
                  <button
                    onClick={copyServiceAccount}
                    style={{ flexShrink: 0, background: '#2d3148', border: '1px solid #3d4568', borderRadius: '5px', color: copied ? '#4ade80' : '#94a3b8', fontSize: '.72rem', padding: '.25rem .55rem', cursor: 'pointer' }}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <span style={S.codeLabel}>Select a role</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.6rem' }}>
                  <code style={{ fontSize: '.77rem', color: '#4ade80', flex: 1 }}>BigQuery Job User</code>
                  <button
                    onClick={copyRole}
                    style={{ flexShrink: 0, background: '#2d3148', border: '1px solid #3d4568', borderRadius: '5px', color: copiedRole ? '#4ade80' : '#94a3b8', fontSize: '.72rem', padding: '.25rem .55rem', cursor: 'pointer' }}
                  >
                    {copiedRole ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <span style={{ fontSize: '.7rem', color: '#334155' }}>Then click <strong style={{ color: '#475569' }}>Save</strong>.</span>
              </div>
            </div>
          </div>

          {/* Step 2.3 */}
          <div style={{ ...S.stepRow, marginTop: '.85rem', marginBottom: 0, paddingLeft: '1.75rem' }}>
            <div style={{ ...S.stepNum, background: 'transparent', border: '1px solid #2d3148', color: '#475569', fontSize: '.65rem' }}>2.3</div>
            <div style={S.stepBody} title="BigQuery gives you 1 TB of free query processing per month. If you run out, queries will simply fail until the next month resets. You can also enable billing if you prefer uninterrupted access and are comfortable paying for extra usage.">
              <a href="https://console.cloud.google.com/billing/linkedaccount" target="_blank" rel="noreferrer" style={S.link}>Make sure you are not billed ↗</a>
              <span style={{ color: '#94a3b8' }}> — open the link and confirm no billing account is linked to this project.</span>
            </div>
          </div>

          <hr style={S.divider} />

          {/* Sign in */}
          <label style={S.label}>Project ID</label>
          <div style={{ ...S.sublabel }}>
            Your Project ID is shown at{' '}
            <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={S.link}>console.cloud.google.com ↗</a>
            {' '}— it appears just below your project name at the top of the page.
          </div>
          <input
            type="text"
            placeholder="my-project-123456"
            value={projectId}
            onChange={e => { setProjectId(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ ...S.input, marginBottom: '.75rem' }}
          />
          {error && <div style={S.errBox}>{error}</div>}
          <button onClick={handleLogin} style={S.btnPrimary}>
            <GoogleIcon /> Sign in with Google
          </button>

        </div>

        {/* Footer */}
        <p style={S.footer}>
          Your Google account is used for identity only.{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" style={S.footerLink}>Revoke access</a>
          {' · '}
          <a href="https://github.com/jpbascur/orion-app" target="_blank" rel="noreferrer" style={S.footerLink}>github.com/jpbascur/orion-app</a>
        </p>

      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
