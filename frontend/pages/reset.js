import React from 'react';
import Link from 'next/link';
import ResetPassword from '../components/Reset';

const Reset = props => {
  return (
    <div>
      <p>Token: {props.query.resetToken}</p>
      <ResetPassword resetToken={props.query.resetToken} />
    </div>
  );
};

export default Reset;
