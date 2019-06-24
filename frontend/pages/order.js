import React from 'react';
import PleaseSignIn from '../components/PleaseSignIn';
import Order from '../components/Order';
import { checkPropTypes } from 'prop-types';

const OrderPage = props => {
  return (
    <PleaseSignIn>
      <Order id={props.query.id} />
      {/* <p>Order</p> */}
    </PleaseSignIn>
  );
};

export default OrderPage;
