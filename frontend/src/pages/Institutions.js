import React from 'react';
import EntityList from './EntityList';
import { buildInstSearchQuery } from './BasketShared';

const FIELDS = [
  { value: 'name',    label: 'Name' },
  { value: 'country', label: 'Country (ISO)' },
  { value: 'type',    label: 'Type' },
];

export default function Institutions({ instData, setInstData, basket, addToBasket, addManyToBasket, projectId }) {
  return (
    <EntityList
      entityData={instData}
      setEntityData={setInstData}
      basket={basket}
      addToBasket={addToBasket}
      addManyToBasket={addManyToBasket}
      apiTop="/api/institutions/top"
      apiSearch="/api/institutions/search"
      idKey="institution_id"
      fields={FIELDS}
      title="Institutions"
      csvName="institutions.csv"
      projectId={projectId}
      queryBuilder={(yf, yt, q, field) => buildInstSearchQuery(q, field, yf, yt)}
      renderHeaders={SortTh => <>
        <SortTh k="name">Institution</SortTh>
        <SortTh k="type">Type</SortTh>
        <SortTh k="country">Country</SortTh>
        <SortTh k="works_count">Works</SortTh>
      </>}
      renderRow={(r, inBask, add) => <>
        <td>{r.name}</td>
        <td>{r.type    ? <span className="badge-type">{r.type}</span>       : '—'}</td>
        <td>{r.country ? <span className="badge-country">{r.country}</span> : '—'}</td>
        <td className="works">{Number(r.works_count).toLocaleString()}</td>
        <td onClick={e => e.stopPropagation()}>
          {inBask
            ? <span style={{ color: '#4ade80', fontSize: '.8rem' }}>✓</span>
            : <button className="btn secondary" style={{ padding: '.2rem .5rem', fontSize: '.75rem' }} onClick={() => add(r)}>+</button>}
        </td>
      </>}
    />
  );
}
