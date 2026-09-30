import React from 'react';
import './PaymentMethods.css';

const PaymentMethods = () => (
  <section className="payment-methods">
    <div className="payment-header">
      <h2>Payment Information</h2>
      <p>Payment options are confirmed for each order.</p>
    </div>
    <div className="payment-footer">
      <div className="security-info">
        <span>This page does not process payments. Please wait for Fuji Card to confirm availability, shipping, and the final amount before paying.</span>
      </div>
    </div>
  </section>
);

export default PaymentMethods;
