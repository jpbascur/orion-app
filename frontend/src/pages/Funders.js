import React from 'react';
import EntityList from './EntityList';
import { buildFunderSearchQuery } from './BasketShared';

const FIELDS = [
  { value: 'name',        label: 'Name' },
  { value: 'country',     label: 'Country (ISO)' },
  { value: 'description', label: 'Description' },
];

export default function Funders({ funderData, setFunderData, basket, addToBasket, addManyToBasket, projectId }) {
  return (
    <EntityList
      entityData={funderData}
      setEntityData={setFunderData}
      basket={basket}
      addToBasket={addToBasket}
      addManyToBasket={addManyToBasket}
      apiTop="/api/funders/top"
      apiSearch="/api/funders/search"
      idKey="funder_id"
      fields={FIELDS}
      title="Funders"
      csvName="funders.csv"
      projectId={projectId}
      queryBuilder={(yf, yt, q, field) => buildFunderSearchQuery(q, field, yf, yt)}
      renderHeaders={SortTh => <>
        <SortTh k="name">Funder</SortTh>
        <SortTh k="country">Country</SortTh>
        <th>Description</th>
        <SortTh k="works_count">Works</SortTh>
      </>}
      renderRow={(r, inBask, add) => <>
        <td>{r.name}</td>
        <td>{r.country ? <span className="badge-country">{r.country}</span> : '—'}</td>
        <td className="desc">{r.description || '—'}</td>
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
