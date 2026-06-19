import React from 'react';
import BasketPage from './BasketPage';
import {
  buildInstWorksQuery,
  buildInstCoInstQuery,
  buildInstCoFunderQuery,
  buildInstTopicsQuery,
} from './BasketShared';

export default function InstBasket(props) {
  return (
    <BasketPage
      {...props}
      type="institutions"
      idKey="institution_id"
      apiBase="/api/basket/institutions"
      queryBuilders={{
        works:  buildInstWorksQuery,
        coInst: buildInstCoInstQuery,
        coFund: buildInstCoFunderQuery,
        topics: buildInstTopicsQuery,
      }}
      title="Institution Basket"
      emptyHint={<>Empty. Go to <strong>Institutions</strong> and click <strong>+</strong> on any row.</>}
    />
  );
}
