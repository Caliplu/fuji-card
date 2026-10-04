import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import HomeSlider from '../components/HomeSlider';
import PremiumProductCard from '../components/PremiumProductCard';
import CurrencySelector from '../components/CurrencySelector';
import MarketReference from '../components/MarketReference';
import './Home.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const collections = [
  { name: 'Pokémon', category: 'pokemon', image: '/M4-bb-750x750.webp' },
  { name: 'One Piece', category: 'onepiece', image: '/OP-15-bb-750x750.webp.webp' },
  { name: 'Yu-Gi-Oh!', category: 'yugioh', image: 'https://images.ygoprodeck.com/images/cards/89631139.jpg' }
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [highlightError, setHighlightError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchFeatured = async () => {
      const results = await Promise.allSettled([
        axios.get(`${API_URL}/products?featured=true&limit=12`, { signal: controller.signal, timeout: 10000 }),
        axios.get(`${API_URL}/products/highlights`, { signal: controller.signal, timeout: 10000 })
      ]);
      if (controller.signal.aborted) return;
      setFeaturedProducts(results[0].status === 'fulfilled' ? results[0].value.data.products || [] : []);
      setHighlights(results[1].status === 'fulfilled' ? results[1].value.data.products || [] : []);
      setHighlightError(results[1].status === 'rejected');
      setLoading(false);
    };
    fetchFeatured();
    return () => controller.abort();
  }, []);

  const highlightedIds = new Set(highlights.map(product => product.id));
  const otherFeatured = featuredProducts.filter(product => !highlightedIds.has(product.id));

  return (
    <div className="home-page-container">
      {/* Top Controls Row */}
      <div className="home-top-bar">
        <div className="container">
          <CurrencySelector />
        </div>
      </div>

      {/* Main Announcement Slider */}
      <div className="home-main-hero">
        <div className="container">
          <HomeSlider products={highlights} />
        </div>
      </div>

      <section className="catalog-showcase" aria-labelledby="catalog-showcase-title">
        <div className="container">
          <div className="catalog-showcase-heading">
            <div><span>Explore Japanese editions</span><h2 id="catalog-showcase-title">A closer look at the boxes</h2>
              <p>Product photos, pack contents, and dated UK retailer price checks.</p></div>
            <Link to="/products?type=booster&language=Japanese">Browse all booster boxes →</Link>
          </div>
          {loading && <p role="status">Loading booster boxes...</p>}
          {!loading && (highlightError || highlights.length === 0) && <p>Booster box highlights are temporarily unavailable. <Link to="/products">Browse the catalog</Link>.</p>}
          <div className="catalog-showcase-grid">
            {highlights.map(product => (
              <Link to={`/product/${product.id}`} key={product.id} className="catalog-showcase-card">
                <div className="catalog-showcase-photo">
                  <img src={product.image || product.image_url || '/logo.png'} alt={`${product.catalog_reference.name} — Japanese booster box`}
                    width="700" height="700" loading="lazy" decoding="async"
                    onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/logo.png'; }} />
                  <span>{product.catalog_reference.set} · Japanese</span>
                </div>
                <div className="catalog-showcase-info">
                  <h3>{product.catalog_reference.name}</h3>
                  <p>{product.catalog_reference.packs_per_box} packs · {product.catalog_reference.cards_per_pack} cards per pack</p>
                  <div className="catalog-showcase-price"><span>Fuji Card</span><strong>£{Number(product.price).toFixed(2)}</strong></div>
                  {product.stock === 0 && <span className="catalog-showcase-sold-out">Sold out</span>}
                  <MarketReference reference={product.market_reference} compact />
                  <span className="catalog-showcase-link">Photos & details <span aria-hidden="true">↗</span></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="collection-gallery" aria-label="Shop card collections">
        <div className="container">
          <div className="collection-gallery-heading">
            <span>Explore the collection</span>
            <h2>Find your next card</h2>
          </div>
          <div className="collection-gallery-grid">
            {collections.map(collection => (
              <Link className="collection-gallery-card" to={`/products?category=${collection.category}`} key={collection.category}>
                <img src={highlights.find(product => product.category === collection.category)?.image || collection.image} alt={`${collection.name} trading cards`} loading="lazy" decoding="async" width="750" height="750"
                  onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/logo.png'; }} />
                <div className="collection-gallery-label"><strong>{collection.name}</strong><span>Shop collection →</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Primary Products Grid (Directly below spinner) */}
      <section className="premium-collection-section">
        <div className="container">
          <h2 className="section-title">More from the collection</h2>
          <div className="premium-grid">
            {loading && <p>Loading featured products...</p>}
            {!loading && featuredProducts.length === 0 && <p>Featured products are temporarily unavailable.</p>}
            {otherFeatured.map(product => (
              <PremiumProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
