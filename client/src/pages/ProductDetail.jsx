import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loadedId, setLoadedId] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const controller = new AbortController();
    const fetchProduct = async () => {
      setLoading(true);
      setImageError(false);
      setQuantity(1);
      try {
        const response = await productsAPI.getOne(id, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setProduct(response.data.product);
        setRelated(response.data.related || []);
        setLoadedId(id);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to fetch product:', error);
        setProduct(null);
        setRelated([]);
        setLoadedId(id);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchProduct();
    return () => controller.abort();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addToCart(product.id, quantity);
      alert('Added to cart!');
    } catch (error) {
      alert('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading || loadedId !== id) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="loading">Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="not-found">
            <h2>Product not found</h2>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        </div>
      </div>
    );
  }

  const placeholderImage = '/logo.png';

  return (
    <div className="product-detail-page">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category || product.categories?.name}`}>{product.category || product.categories?.name}</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-detail">
          <div className="product-image-section">
            <div className="main-image">
              <img 
                src={imageError ? placeholderImage : (product.image || product.image_url || placeholderImage)} 
                alt={product.name}
                width="600"
                height="780"
                decoding="async"
                onError={() => setImageError(true)}
              />
              {product.stock <= 3 && product.stock > 0 && (
                <span className="stock-badge low">Only {product.stock} left!</span>
              )}
              {product.featured && (
                <span className="featured-badge">Featured</span>
              )}
            </div>
          </div>

          <div className="product-info-section">
            <span className="product-category">{product.category}</span>
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-price-large">{formatPrice(product.price)}</div>
            
            <div className="product-attributes">
              <div className="attribute">
                <span className="label">Set:</span>
                <span className="value">{product.set || product.set_name || 'N/A'}</span>
              </div>
              <div className="attribute">
                <span className="label">Rarity:</span>
                <span className="value">{product.rarity || 'N/A'}</span>
              </div>
              <div className="attribute">
                <span className="label">Condition:</span>
                <span className="value">{product.condition || 'Mint'}</span>
              </div>
              <div className="attribute">
                <span className="label">Language:</span>
                <span className="value">{product.language || 'English'}</span>
              </div>
              <div className="attribute">
                <span className="label">Card Type:</span>
                <span className="value">{product.cardType || product.card_type || 'Character'}</span>
              </div>
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            <div className="stock-info">
              {product.stock > 0 ? (
                <span className="in-stock">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="out-of-stock">Out of Stock</span>
              )}
            </div>

            {product.stock > 0 && (
              <div className="add-to-cart-section">
                <div className="quantity-selector">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <button 
                  className="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="related-products">
            <h2>Related Products</h2>
            <div className="products-grid">
              {related.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
