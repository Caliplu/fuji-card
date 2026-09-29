import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import './Cart.css';

const Cart = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { formatPrice, convertPrice, getSymbol } = useCurrency();

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      alert('Failed to update quantity');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      alert('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart();
      } catch (error) {
        alert('Failed to clear cart');
      }
    }
  };

  const subtotal = parseFloat(cart.subtotal) || 0;

  if (loading && cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="loading">Loading cart...</div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items yet</p>
            <Link to="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          <button className="clear-cart-btn" onClick={handleClearCart}>Clear Cart</button>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  <img 
                    src={item.product.image || item.product.image_url} 
                    alt={item.product.name}
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/100x130?text=${encodeURIComponent(item.product.name)}`;
                    }}
                  />
                </div>
                <div className="item-details">
                  <Link to={`/product/${item.product.id}`} className="item-name">
                    {item.product.name}
                  </Link>
                  <div className="item-meta">
                    <span>{item.product.set_name || item.product.set}</span>
                    <span>{item.product.condition}</span>
                  </div>
                  <div className="item-price">{formatPrice(item.product.price)}</div>
                </div>
                <div className="item-quantity">
                  <button 
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                  >
                    +
                  </button>
                </div>
                <div className="item-total">
                  {formatPrice(item.product.price * item.quantity)}
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => handleRemove(item.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal ({cart.itemCount} items)</span>
              <span>{getSymbol()}{convertPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>To be confirmed</span>
            </div>
            <div className="summary-total">
              <span>Items subtotal</span>
              <span>{getSymbol()}{convertPrice(subtotal)}</span>
            </div>
            <Link to="/checkout" className="checkout-btn">
              Proceed to Checkout
            </Link>
            <Link to="/products" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
