import { useState, useMemo } from 'react';

/**
 * useTable — display limit + column sorting for a data list.
 *
 * Sorting operates ONLY on the visible slice (first `displayLimit` rows).
 * The full list stays in the original BQ rank order; sorting does not
 * change which rows are visible, only their order within the slice.
 * This is O(n log n) on at most a few hundred items — instantaneous.
 */
export default function useTable(fullRows, displayLimit = 50) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  const visibleRows = useMemo(() => {
    const slice = fullRows.slice(0, displayLimit);
    if (!sortKey) return slice;
    return [...slice].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [fullRows, displayLimit, sortKey, sortDir]);

  const onSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortIcon = key => (
    <span className="sort-icon">
      {sortKey !== key ? '⇅' : sortDir === 'asc' ? '↑' : '↓'}
    </span>
  );

  return { visibleRows, onSort, sortIcon, sortKey };
}
