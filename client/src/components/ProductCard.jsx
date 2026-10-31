import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import MarketReference from './MarketReference';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const [adding, setAdding] = useState(false);
  const [failedImage, setFailedImage] = useState(null);
  const [addError, setAddError] = useState('');
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const imageUrl = product.image || product.image_url || '/logo.png';
  const imageUnavailable = failedImage === imageUrl;
  const inStock = Number(product.stock) > 0;
  const category = product.category || product.categories?.name || 'Collectible';
  const setName = product.catalog_reference?.set || product.set || product.set_name;
  const originalPrice = product.originalPrice || product.original_price;
  const squarePhoto = /box|case|pack|deck/i.test(product.cardType || product.card_type || '') || category === 'accessories';

  const handleAddToCart = async () => {
    setAddError('');
    setAdding(true);
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      const message = error.response?.data?.error;
      setAddError(typeof message === 'string' ? message : 'Could not add this item. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className={`product-card ${squarePhoto ? 'product-card-square' : ''}`}>
      <Link to={`/product/${product.id}`} className="product-card-details" aria-label={`View ${product.name}`}>
        <div className="product-image">
          <img src={imageUnavailable ? '/logo.png' : imageUrl}
            alt={imageUnavailable ? `${product.name} — photo unavailable` : product.name}
            loading="lazy" decoding="async" width="600" height={squarePhoto ? '600' : '840'}
            onError={() => setFailedImage(imageUrl)} />
          {inStock && product.stock <= 3 && <span className="stock-badge low">Only {product.stock} left</span>}
          {!inStock && <span className="stock-badge out">Sold out</span>}
          {product.featured && <span className="featured-badge">Featured</span>}
          {product.promo && product.discount && <span className="promo-badge">-{product.discount}%</span>}
          {product.photo_gallery?.length > 1 && <span className="product-photo-count">{product.photo_gallery.length} photos</span>}
        </div>
        <div className="product-info">
          <span className="product-category">{category}</span>
          <h2 className="product-name">{product.name}</h2>
          <div className="product-meta">
            {setName && <span className="product-set">{setName}</span>}
            {product.language && <span>{product.language}</span>}
            {product.condition && <span className="product-condition">{product.condition}</span>}
          </div>
          <p className="product-card-description">{product.description}</p>
          {product.graded && <div className="grading-info">
            <span className="grading-badge">{product.gradingCompany || product.grading_company} {product.grade}</span>
          </div>}
          <MarketReference reference={product.market_reference} compact />
        </div>
      </Link>
      <div className="product-footer">
        <div className="price-container">
          {product.promo && originalPrice && <span className="original-price">{formatPrice(originalPrice)}</span>}
          <span className="product-price">{formatPrice(product.price)}</span>
        </div>
        <button type="button" className="add-to-cart-btn" onClick={handleAddToCart}
          aria-label={`Add ${product.name} to cart`} disabled={adding || !inStock}>
          {adding ? 'Adding…' : inStock ? 'Add to cart' : 'Sold out'}
        </button>
        {addError && <p className="product-cart-error" role="alert">{addError}</p>}
      </div>
    </article>
  );
};

export default ProductCard;
