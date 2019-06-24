import React from 'react';
import formatMoney from '../lib/formatMoney';
import styled from 'styled-components';
import ProTypes from 'prop-types';
import RemoveFromCart from './RemoveFromCart';

const CartItemStyles = styled.li`
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.lightgray};
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr auto;
  img {
    margin-right: 10px;
  }
  h3,
  p {
    margin: 0;
  }
`;

const CartItems = ({ cartItem }) => {
  if (!cartItem.item) {
    return (
      <CartItemStyles>
        <p>Item removed from shop.</p>
        <RemoveFromCart id={cartItem.id} />
      </CartItemStyles>
    );
  }
  return (
    <CartItemStyles>
      <img width="100" src={cartItem.item.image} alt={cartItem.item.title} />
      <div className="cart-item-details">
        <h3>{cartItem.item.title}</h3>
        <p>{formatMoney(cartItem.item.price)}</p>
        {' - '}
        <em>
          {cartItem.quantity} &times; {formatMoney(cartItem.item.price)} each
        </em>
      </div>
      <RemoveFromCart id={cartItem.id} />
    </CartItemStyles>
  );
};

export default CartItems;
