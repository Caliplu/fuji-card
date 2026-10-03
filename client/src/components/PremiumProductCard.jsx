import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import './PremiumProductCard.css';

const PremiumProductCard = ({ product }) => {
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setAdding(true);
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAdding(false);
    }
  };

  const imageUrl = product.image || product.image_url;
  const category = product.category || product.categories?.name || 'TCG';

  return (
    <div className="premium-product-wrapper">
      <Link to={`/product/${product.id}`} className="premium-product-card">
        <div className="premium-image-container">
          <img src={imageUrl || '/logo.png'} alt={product.name} className="premium-bg-image" loading="lazy" decoding="async" width="600" height="780"
            onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/logo.png'; }} />
          <div className="premium-overlay-gradient"></div>
          
          <div className="premium-content-overlay">
            <span className="premium-category-tag">{category.toUpperCase()}</span>
            <h3 className="premium-title">{product.name}</h3>
            <div className="premium-price-row">
              <span className="premium-currency-symbol">{formatPrice(product.price).split(' ')[0]}</span>
              <span className="premium-price-value">{formatPrice(product.price).split(' ').slice(1).join(' ')}</span>
            </div>
            
            <button 
              className="premium-add-btn"
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
            >
              {adding ? 'ADDING...' : product.stock === 0 ? 'SOLD OUT' : 'ADD TO CART'}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PremiumProductCard;
