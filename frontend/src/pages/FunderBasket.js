import React from 'react';
import BasketPage from './BasketPage';
import {
  buildFunderWorksQuery,
  buildFunderCoInstQuery,
  buildFunderCoFunderQuery,
  buildFunderTopicsQuery,
} from './BasketShared';

export default function FunderBasket(props) {
  return (
    <BasketPage
      {...props}
      type="funders"
      idKey="funder_id"
      apiBase="/api/basket/funders"
      queryBuilders={{
        works:  buildFunderWorksQuery,
        coInst: buildFunderCoInstQuery,
        coFund: buildFunderCoFunderQuery,
        topics: buildFunderTopicsQuery,
      }}
      title="Funder Basket"
      emptyHint={<>Empty. Go to <strong>Funders</strong> and click <strong>+</strong> on any row.</>}
    />
  );
}
