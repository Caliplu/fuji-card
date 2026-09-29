import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import PriceRange from '../components/PriceRange';
import './Products.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const params = Object.fromEntries(searchParams.entries());
      const response = await axios.get(`${API_URL}/products`, { params: { ...params, limit: 1000 } });
      
      // Manual Filtering across everything
      let filtered = response.data?.products || [];
      
      if (category) {
        filtered = filtered.filter(p => {
          const pCat = (p.categories?.name || p.category?.name || p.category || 'other').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
          const targetCat = category.toLowerCase().replace(/[^a-z0-9]/g, '');
          return pCat === targetCat;
        });
      }
      
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(s) || 
          p.description?.toLowerCase().includes(s) ||
          p.set?.toLowerCase().includes(s) ||
          p.set_name?.toLowerCase().includes(s)
        );
      }

      const type = searchParams.get('type');
      if (type) {
        const t = type.toLowerCase();
        filtered = filtered.filter(p => {
          const name = p.name.toLowerCase();
          const desc = (p.description || '').toLowerCase();
          
          if (t === 'booster') return name.includes('booster') || desc.includes('booster');
          if (t === 'special') return name.includes('special') || name.includes('high class') || desc.includes('special');
          if (t === 'promo') return name.includes('promo') || desc.includes('promo');
          if (t === 'sealed') return name.includes('sealed') || name.includes('case') || desc.includes('sealed');
          
          // OTHER TCG Types
          if (t === 'weiss') return name.includes('weiss') || desc.includes('weiss');
          if (t === 'union') return name.includes('union') || desc.includes('union');
          if (t === 'hololive') return name.includes('hololive') || desc.includes('hololive');
          if (t === 'lycee') return name.includes('lycee') || desc.includes('lycee');
          if (t === 'gundam') return name.includes('gundam') || desc.includes('gundam');
          if (t === 'dragonball') return name.includes('dragon ball') || name.includes('fusion') || desc.includes('dragon ball');
          if (t === 'disney') return name.includes('lorcana') || name.includes('disney') || desc.includes('lorcana');
          if (t === 'mtg') return name.includes('magic') || name.includes('mtg') || desc.includes('magic');

          return true;
        });
      }
      
      const minPrice = parseFloat(searchParams.get('minPrice')) || 0;
      const maxPrice = parseFloat(searchParams.get('maxPrice')) || 1000000;
      filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);
      
      const sort = searchParams.get('sort');
      if (sort === 'price_asc') filtered.sort((a,b) => a.price - b.price);
      else if (sort === 'price_desc') filtered.sort((a,b) => b.price - a.price);
      else if (sort === 'name_asc') filtered.sort((a,b) => a.name.localeCompare(b.name));
      else {
        // Default sort (newest or featured)
      }
      
      setProducts(filtered);
      setPagination({
        totalProducts: filtered.length,
        totalPages: 1,
        currentPage: 1
      });
    } catch (error) {
      console.error('Product load failure:', error);
      setLoadError(true);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams, category, search]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/products/filters/options`, { params: { category } });
      setFilterOptions(response.data);
    } catch (error) {
      setFilterOptions({ rarities: [], conditions: [], languages: [], sets: [] });
    }
  }, [category]);

  useEffect(() => {
    fetchProducts();
    fetchFilterOptions();
  }, [fetchProducts, fetchFilterOptions]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePriceRangeChange = (range) => {
    const newParams = new URLSearchParams(searchParams);
    if (range.min > 0) newParams.set('minPrice', range.min.toString());
    else newParams.delete('minPrice');
    if (range.max < 2000) newParams.set('maxPrice', range.max.toString());
    else newParams.delete('maxPrice');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const getCategoryTitle = () => {
    const titles = {
      pokemon: 'Pokemon TCG',
      onepiece: 'One Piece Card Game',
      yugioh: 'Yu-Gi-Oh! OCG/TCG',
      accessories: 'Premium Accessories'
    };
    return titles[category] || 'All Collectibles';
  };

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header">
          <div className="header-left">
            <h1>{search ? `Search: "${search}"` : getCategoryTitle()}</h1>
            <span className="product-count">{pagination.totalProducts || 0} items found</span>
          </div>
          <div className="header-right">
            <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
              <span>Filters</span>
            </button>
            <select className="sort-select" value={searchParams.get('sort') || ''} onChange={(e) => handleFilterChange('sort', e.target.value)}>
              <option value="">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A-Z</option>
            </select>
          </div>
        </div>

        <div className="products-layout">
          <aside className={`filters-sidebar ${showFilters ? 'open' : ''}`}>
             <div className="filters-header">
               <h3>Refine Selection</h3>
               <button className="clear-filters" onClick={clearFilters}>Reset</button>
               <button className="filter-close-btn" onClick={() => setShowFilters(false)}>×</button>
             </div>

             <div className="filter-group">
               <h4>TCG Category</h4>
               <div className="filter-links">
                 {['pokemon', 'onepiece', 'yugioh', 'accessories'].map(cat => (
                   <button 
                     key={cat} 
                     className={category === cat ? 'active' : ''} 
                     onClick={() => handleFilterChange('category', cat)}
                   >
                     {cat.toUpperCase()}
                   </button>
                 ))}
               </div>
             </div>

             <div className="filter-group">
               <h4>Price Range</h4>
               <PriceRange onFilterChange={handlePriceRangeChange} maxPrice={2000} />
             </div>
          </aside>

          <main className="products-main">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Curating your collection...</p>
              </div>
            ) : loadError ? (
              <div className="no-results">
                <h3>Products are temporarily unavailable</h3>
                <p>Please try again shortly.</p>
                <button onClick={fetchProducts} className="btn btn-primary">Try Again</button>
              </div>
            ) : products.length === 0 ? (
              <div className="no-results">
                <h3>No items match your criteria</h3>
                <p>Try resetting the filters to explore our full inventory.</p>
                <button onClick={clearFilters} className="btn btn-primary">Reset Filters</button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;
