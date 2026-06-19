/**
 * Format bytes into a human-readable string (B / KB / MB / GB).
 */
export function formatBytes(bytes) {
  if (bytes == null || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Small inline badge showing how much BigQuery data a request consumed.
 * Shows in grey, unobtrusive.
 */
export function BytesTag({ bytes }) {
  if (bytes == null) return null;
  const label = bytes === 0 ? '⚡ cached' : `⚡ ${formatBytes(bytes)} scanned`;
  return (
    <span title={bytes === 0 ? 'Result served from cache (no data scanned)' : 'BigQuery data scanned for this request'} style={{
      fontSize: '.7rem',
      color: '#475569',
      background: '#1a1d27',
      border: '1px solid #2d3148',
      borderRadius: '4px',
      padding: '1px 6px',
      fontFamily: 'monospace',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
