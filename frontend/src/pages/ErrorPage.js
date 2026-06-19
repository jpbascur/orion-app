import React from 'react';

const ERRORS = {
  oauth_failed: {
    title: 'Sign-in failed',
    message:
      'The security token was invalid or expired during Google OAuth. ' +
      'This can happen if you took too long to approve access, or if the login link was opened in a different browser.',
    action: 'Try signing in again',
  },
  token_exchange_failed: {
    title: 'Authentication error',
    message:
      'ORION could not complete the Google token exchange. ' +
      'This is usually a temporary issue — please try again.',
    action: 'Try signing in again',
  },
  userinfo_failed: {
    title: 'Profile fetch failed',
    message:
      'Sign-in succeeded, but ORION could not retrieve your Google account info. ' +
      'Please check your connection and try again.',
    action: 'Try signing in again',
  },
  session_expired: {
    title: 'Session expired',
    message:
      'Your session has expired or is no longer valid. Please sign in again to continue.',
    action: 'Sign in again',
  },
  no_project: {
    title: 'No GCP project configured',
    message:
      'Your session is missing a GCP Project ID. Please sign in again and make sure to enter your project before continuing.',
    action: 'Sign in again',
  },
};

const FALLBACK = {
  title: 'Something went wrong',
  message: 'An unexpected error occurred during authentication. Please try again.',
  action: 'Back to sign-in',
};

export default function ErrorPage({ code }) {
  const err = ERRORS[code] || FALLBACK;

  const goBack = () => {
    window.location.href = '/';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f1117',
    }}>
      <div style={{
        background: '#1a1d27',
        border: '1px solid #2d3148',
        borderRadius: '14px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '460px',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>⭐</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '.4rem' }}>
            ORION
          </h1>
          <p style={{ color: '#64748b', fontSize: '.875rem', margin: 0 }}>
            Research Dashboard
          </p>
        </div>

        {/* Error card */}
        <div style={{
          background: '#1e1215',
          border: '1px solid #4c1d25',
          borderRadius: '10px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem' }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1, marginTop: '.1rem', flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{
                color: '#fca5a5',
                fontWeight: 600,
                fontSize: '.95rem',
                margin: '0 0 .4rem',
              }}>
                {err.title}
              </p>
              <p style={{
                color: '#9ca3af',
                fontSize: '.82rem',
                lineHeight: 1.65,
                margin: 0,
              }}>
                {err.message}
              </p>
            </div>
          </div>
        </div>

        {/* Error code for debugging */}
        {code && (
          <p style={{
            color: '#374151',
            fontSize: '.7rem',
            textAlign: 'center',
            marginBottom: '1.25rem',
            fontFamily: 'monospace',
          }}>
            error code: {code}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={goBack}
          style={{
            width: '100%',
            background: '#fff',
            color: '#0f1117',
            border: 'none',
            borderRadius: '6px',
            padding: '.65rem',
            fontSize: '.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          {err.action}
        </button>

        <p style={{
          color: '#374151',
          fontSize: '.72rem',
          marginTop: '1.25rem',
          lineHeight: 1.5,
          textAlign: 'center',
        }}>
          If this keeps happening, contact your ORION administrator.
        </p>
      </div>
    </div>
  );
}
