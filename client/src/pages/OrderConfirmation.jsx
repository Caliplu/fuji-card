import { useLocation, Link, Navigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const location = useLocation();
  const { formatOrderPrice } = useCurrency();
  const order = location.state?.order;

  if (!order) {
    return <Navigate to="/" />;
  }

  return (
    <div className="confirmation-page">
      <div className="container">
        <div className="confirmation-card">
          <div className="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>

          <h1>Order received</h1>
          <p className="thank-you">Your order has been recorded. Payment is not confirmed until we verify it.</p>

          <div className="order-details">
            <div className="detail-row">
              <span>Order Number</span>
              <span className="order-number">{order.order_number || order.orderNumber || order.id}</span>
            </div>
            <div className="detail-row">
              <span>Order Total</span>
              <span className="order-total">{formatOrderPrice(order.total, order.currency || 'GBP')}</span>
            </div>
            <div className="detail-row">
              <span>Status</span>
              <span className="order-status">{order.status}</span>
            </div>
          </div>

          <p className="email-notice">Check your order status in your account or contact support if you need help.</p>

          <div className="confirmation-actions">
            <Link to="/account" className="btn btn-outline">View My Orders</Link>
            <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
