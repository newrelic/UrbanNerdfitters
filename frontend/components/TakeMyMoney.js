import React from 'react';
import StripeCheckout from 'react-stripe-checkout';
import { Mutation } from 'react-apollo';
import Router from 'next/router';
import NProgress from 'nprogress';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import calcTotalPrice from '../lib/calcTotalPrice';
import Error from './ErrorMessage';
import User, { CURRENT_USER_QUERY } from './User';

const CREATE_ORDER_MUTATION = gql`
  mutation createOrder($token: String!) {
    createOrder(token: $token) {
      id
      charge
      total
      items {
        id
        title
      }
    }
  }
`;

function totalItems(cart) {
  return cart.reduce((tally, item) => tally + item.quantity, 0);
}

class TakeMyMoney extends React.Component {
  onToken = async (res, createOrder, me) => {
    NProgress.start();
    console.log('Stripe: ',res);
    const order = await createOrder({
      variables: {
        token: res.id
      }
    })
    .catch(err => alert(err.message));
    newrelic.interaction().setAttribute('userId', me.id);
    newrelic.interaction().setAttribute('cartTotal', `${totalItems(me.cart)}`);
    Router.push({
      pathname: '/order',
      query: { id: order.data.createOrder.id }
    });
  };
  render() {
    return (
      <User>
        {
          ({ data: { me } }) => (
          <Mutation
            mutation={CREATE_ORDER_MUTATION}
            refetchQueries={[{ query: CURRENT_USER_QUERY }]}
          >
            {
              createOrder => (
              <StripeCheckout
                amount={calcTotalPrice(me.cart)}
                name="Nerd Store"
                description={`Order of ${totalItems(me.cart)}`}
                image={
                  me.cart.length && me.cart[0].item && me.cart[0].item.image
                }
                stripeKey={'pk_test_djkdDH15qr5lu7s59lXtSZZi002ATGNg0r'}
                currency="USD"
                email={me.email}
                token={res => this.onToken(res, createOrder, me)}
              >
                {this.props.children}
              </StripeCheckout>
            )}
          </Mutation>
        )}
      </User>
    );
  }
}

export default TakeMyMoney;
