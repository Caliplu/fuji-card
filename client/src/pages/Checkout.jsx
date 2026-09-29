import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { ordersAPI } from '../services/api';
import './Checkout.css';
import './CheckoutPayment.css';

const orderWhatsAppNumber = (import.meta.env.VITE_ORDER_WHATSAPP_NUMBER || '').replace(/\D/g, '');
const canRequestOrder = /^\d{8,15}$/.test(orderWhatsAppNumber);

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, refreshCart, clearCart } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { formatPrice, convertPrice, getSymbol } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    paymentMethod: 'request'
  });
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const cancelOrderId = searchParams.get('order_id');
  const cancelStatus = searchParams.get('cancel');

  // Handle cancelled payments
  useEffect(() => {
    if (cancelStatus === 'true' && cancelOrderId) {
      const restoreCart = async () => {
        try {
          await ordersAPI.restoreCart(cancelOrderId);
          await refreshCart();
          alert('Payment was cancelled. Your items have been safely restored to your cart.');
          navigate('/cart', { replace: true });
        } catch (e) {
          console.error('Failed to restore cart:', e);
        }
      };
      restoreCart();
    }
  }, [cancelStatus, cancelOrderId, navigate, refreshCart]);

  const paymentMethods = [
    { id: 'request', name: 'Order request via WhatsApp', shortName: 'Order request' }
  ];

  const [requestSent, setRequestSent] = useState(false);

  const sendWhatsAppOrder = () => {
    const whatsappNumber = orderWhatsAppNumber;

    // Create highly professional and fully detailed order message
    let message = `Greetings!\n`;
    message += `I would like to place an order from Fuji Card. Below are the details of my request:\n\n`;

    // Client section
    message += `👤 *CLIENT INFORMATION*\n`;
    message += `• Name: ${user.firstName} ${user.lastName}\n`;
    message += `• Email: ${user.email}\n`;
    message += `• Location: ${user.address}, ${user.city}, ${user.country}\n\n`;

    // Payment Section
    message += `💳 *PAYMENT*\n`;
    message += `• Payment method and availability to be confirmed by the store.\n\n`;

    // Items Section
    message += `📦 *ASSET SUMMARY*\n`;
    cart.items.forEach((item, index) => {
      // Correctly extract nested product properties and format the prices
      const productName = item.product?.name || item.name || 'Pokemon Card';
      const rawPrice = parseFloat(item.price || item.product?.price || 0);

      message += `[Item ${index + 1}] *${productName}*\n`;
      message += `   • Quantity: ${item.quantity}\n`;
      message += `   • Unit Price: ${getSymbol()}${convertPrice(rawPrice)}\n`;
      message += `   • Line Total: ${getSymbol()}${convertPrice(rawPrice * item.quantity)}\n\n`;
    });

    // Request only; the store must confirm inventory, shipping and final price.
    message += `──────────────\n`;
    message += `💰 *ITEMS SUBTOTAL (GBP)*\n`;
    message += `• Listed items: ${getSymbol()}${convertPrice(subtotal)}\n`;
    message += `• Shipping and final amount: to be confirmed by Fuji Card\n`;
    message += `──────────────\n\n`;

    message += `Please confirm availability, shipping, and the payment method before I pay.\n`;
    message += `Thank you!`;

    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    // Popup blocker defensive navigation
    const pendingWin = window.open(whatsappUrl, '_blank');
    if (!pendingWin || pendingWin.closed || typeof pendingWin.closed === 'undefined') {
      // Fallback to direct redirect if popup is suppressed
      window.location.href = whatsappUrl;
      return;
    }

    // Opening WhatsApp is a request, not an accepted or paid order.
    setRequestSent(true);
  };

  if (authLoading) {
    return (
      <div className="checkout-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #e94560', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel your order? Your cart will be cleared.')) return;
    try {
      await clearCart();
    } catch (e) {
      // Cart clear failure shouldn't stop the redirect
    }
    navigate('/');
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="auth-required">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#e94560" strokeWidth="1.5">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <h2>Account Required</h2>
            <p>Please log in or create an account to proceed with checkout</p>
            <div className="auth-buttons">
              <Link to="/login?redirect=/checkout" className="btn btn-primary">Login</Link>
              <Link to="/register?redirect=/checkout" className="btn btn-outline">Create Account</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = parseFloat(cart.subtotal) || 0;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // VALIDATE shipping address fields
    if (!user?.firstName || !user?.firstName.trim()) {
      alert('Please enter your first name');
      return;
    }
    if (!user?.lastName || !user?.lastName.trim()) {
      alert('Please enter your last name');
      return;
    }
    if (!user?.address || !user?.address.trim()) {
      alert('Please enter your address');
      return;
    }
    if (!user?.city || !user?.city.trim()) {
      alert('Please enter your city');
      return;
    }
    if (!user?.postcode || !user?.postcode.trim()) {
      alert('Please enter your postcode');
      return;
    }
    if (!user?.country || !user?.country.trim()) {
      alert('Please select your country');
      return;
    }
    if (!user?.phone || !user?.phone.trim()) {
      alert('Please enter your phone number');
      return;
    }
    if (!user?.email || !user?.email.trim()) {
      alert('Please enter your email address');
      return;
    }
    
    if (!canRequestOrder) {
      alert('Ordering is temporarily unavailable. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      sendWhatsAppOrder();
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-checkout">
            <h2>Your cart is empty</h2>
            <p>Add some products to checkout</p>
            <Link to="/products" className="btn btn-primary">Shop Now</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>

        <div className="checkout-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Request</span>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Confirm</span>
          </div>
        </div>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="form-section">
                <h2>Shipping Information</h2>
                <div className="shipping-address-summary">
                  <div className="address-display">
                    <h3>{user.firstName} {user.lastName}</h3>
                    <p>{user.address}</p>
                    <p>{user.city}, {user.postcode}</p>
                    <p>{user.country}</p>
                    <p>📧 {user.email}</p>
                    <p>📞 {user.phone}</p>
                  </div>
                  <Link to="/account?tab=profile" className="edit-address-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Address
                  </Link>
                </div>

                <h2>Order Request</h2>
                <p className="payment-notice">Request an order. The store will confirm availability, shipping, and payment before you pay.</p>

                <div className="payment-methods-single">
                  <h3>How to request your order:</h3>
                  <div className="payment-options-inline" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '1rem' }}>
                    {paymentMethods.map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 18px',
                          borderRadius: '10px',
                          border: formData.paymentMethod === method.id ? '2px solid #ef4444' : '1px solid #e2e8f0',
                          background: formData.paymentMethod === method.id ? '#fff5f5' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          minWidth: '130px',
                          justifyContent: 'center',
                          boxShadow: formData.paymentMethod === method.id ? '0 4px 12px rgba(239, 68, 68, 0.15)' : 'none',
                          transform: formData.paymentMethod === method.id ? 'scale(1.02)' : 'none'
                        }}
                      >
                        <span aria-hidden="true">✉</span>
                        <span style={{
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          color: formData.paymentMethod === method.id ? '#ef4444' : '#64748b'
                        }}>
                          {method.shortName !== undefined ? method.shortName : method.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {!canRequestOrder && (
                  <p className="payment-notice" role="status">Ordering is temporarily unavailable while the store contact is being set up.</p>
                )}
                {requestSent && (
                  <p className="payment-notice" role="status">WhatsApp opened with your request. Please send the message there; this is not a paid order.</p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !canRequestOrder}
                >
                  {loading ? 'Opening...' : 'Request order via WhatsApp'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  style={{
                    marginTop: '0.75rem',
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#ef4444',
                    borderRadius: '8px',
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.target.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseOut={e => { e.target.style.background = 'transparent'; }}
                >
                  🗑 Cancel Order & Clear Cart
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="form-section">
                <h2>Review Your Order</h2>

                <div className="review-section">
                  <h3>Shipping Address</h3>
                  <p>
                    {user.firstName} {user.lastName}<br />
                    {user.address}<br />
                    {user.city}, {user.postcode}<br />
                    {user.country}<br />
                    📧 {user.email}<br />
                    📞 {user.phone}
                  </p>
                </div>

                <div className="review-section">
                  <h3>Payment Method</h3>
                  <p>Order request via WhatsApp; payment to be confirmed by the store.</p>
                </div>

                <div className="button-row" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading || !canRequestOrder}
                    >
                      {loading ? 'Opening...' : 'Request Order'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      color: '#ef4444',
                      borderRadius: '8px',
                      padding: '0.6rem 1.2rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => { e.target.style.background = 'rgba(239,68,68,0.1)'; }}
                    onMouseOut={e => { e.target.style.background = 'transparent'; }}
                  >
                    🗑 Cancel Order & Clear Cart
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cart.items.map(item => (
                <div key={item.id} className="summary-item">
                  <img
                    src={item.product.image || item.product.image_url || '/logo.png'}
                    alt={item.product.name}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.png'; }}
                  />
                  <div className="summary-item-info">
                    <span className="summary-item-name">{item.product.name}</span>
                    <span className="summary-item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="summary-item-price">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{getSymbol()}{convertPrice(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>To be confirmed</span>
              </div>
              <div className="summary-row total">
                <span>Items subtotal</span>
                <span>{getSymbol()}{convertPrice(subtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
