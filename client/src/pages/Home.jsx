import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import HomeSlider from '../components/HomeSlider';
import PremiumProductCard from '../components/PremiumProductCard';
import CurrencySelector from '../components/CurrencySelector';
import './Home.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const collections = [
  { name: 'Pokémon', category: 'pokemon', image: '/M4-bb-750x750.webp' },
  { name: 'One Piece', category: 'onepiece', image: '/onepiece/op09_booster_box_premium.png' },
  { name: 'Yu-Gi-Oh!', category: 'yugioh', image: '/yugioh_collection_box.png' }
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await axios.get(`${API_URL}/products?featured=true&limit=1000`);
        setFeaturedProducts(response.data.products || []);
      } catch (error) {
        console.error('Featured products unavailable:', error);
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

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
          <HomeSlider />
        </div>
      </div>

      <section className="collection-gallery" aria-label="Shop card collections">
        <div className="container">
          <div className="collection-gallery-heading">
            <span>Explore the collection</span>
            <h2>Find your next card</h2>
          </div>
          <div className="collection-gallery-grid">
            {collections.map(collection => (
              <Link className="collection-gallery-card" to={`/products?category=${collection.category}`} key={collection.category}>
                <img src={collection.image} alt={`${collection.name} trading cards`} loading="lazy"
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
          <div className="premium-grid">
            {loading && <p>Loading featured products...</p>}
            {!loading && featuredProducts.length === 0 && <p>Featured products are temporarily unavailable.</p>}
            {featuredProducts.map(product => (
              <PremiumProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
