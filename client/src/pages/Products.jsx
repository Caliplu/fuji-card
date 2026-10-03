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
      const response = await axios.get(`${API_URL}/products`, { params: { ...params, limit: 24 } });
      setProducts(response.data?.products || []);
      setPagination(response.data?.pagination || {});
    } catch (error) {
      console.error('Product load failure:', error);
      setLoadError(true);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

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
  }, [fetchProducts]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

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

  const changePage = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(page));
    setSearchParams(newParams);
    document.querySelector('.products-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getCategoryTitle = () => {
    const titles = {
      pokemon: 'Pokemon TCG',
      onepiece: 'One Piece Card Game',
      yugioh: 'Yu-Gi-Oh! OCG/TCG',
      accessories: 'Premium Accessories',
      other: 'Other Collectibles'
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
                 {['pokemon', 'onepiece', 'yugioh', 'accessories', 'other'].map(cat => (
                   <button 
                     key={cat} 
                     className={category === cat ? 'active' : ''} 
                     onClick={() => handleFilterChange('category', cat)}
                   >
                     {cat === 'other' ? 'OTHER COLLECTIBLES' : cat.toUpperCase()}
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
              <>
                <div className="products-grid">
                  {products.map(product => <ProductCard key={product.id} product={product} />)}
                </div>
                {pagination.totalPages > 1 && (
                  <nav className="catalog-pagination" aria-label="Product pages">
                    <button type="button" disabled={pagination.currentPage === 1}
                      onClick={() => changePage(pagination.currentPage - 1)}>Previous</button>
                    <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                    <button type="button" disabled={pagination.currentPage === pagination.totalPages}
                      onClick={() => changePage(pagination.currentPage + 1)}>Next</button>
                  </nav>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;
