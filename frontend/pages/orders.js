import React from 'react';
import PleaseSignIn from '../components/PleaseSignIn';
import OrderList from '../components/OrderList';
import { checkPropTypes } from 'prop-types';

const OrdersPage = props => {
  return (
    <PleaseSignIn>
      <OrderList />
    </PleaseSignIn>
  );
};

export default OrdersPage;
