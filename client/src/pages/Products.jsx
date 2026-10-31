import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import PriceRange from '../components/PriceRange';
import {
  CATALOG_CATEGORIES, CATALOG_PAGE_SIZE, activeCatalogFilters, catalogPageLinks,
  changeCatalogFilter, changeCatalogPrices, catalogPriceCeiling, catalogPriceRange, facetChoices
} from '../utils/catalogFilters';
import './Products.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const facets = [
  { key: 'cardType', options: 'cardTypes', label: 'Product type', any: 'All product types' },
  { key: 'language', options: 'languages', label: 'Language', any: 'All languages' },
  { key: 'condition', options: 'conditions', label: 'Condition', any: 'All conditions' },
  { key: 'rarity', options: 'rarities', label: 'Rarity', any: 'All rarities' },
  { key: 'set', options: 'sets', label: 'Set / expansion', any: 'All sets' }
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState({ query: null, products: [], pagination: {}, error: false });
  const [fetching, setFetching] = useState(true);
  const [options, setOptions] = useState({ category: null, data: {}, error: false });
  const [retryIndex, setRetryIndex] = useState(0);
  const [facetRetry, setFacetRetry] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches);
  const sidebarRef = useRef(null);
  const toggleRef = useRef(null);
  const closeRef = useRef(null);

  const queryKey = searchParams.toString();
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const filters = activeCatalogFilters(searchParams);
  const loading = fetching || results.query !== queryKey;
  const optionsReady = options.category === category;
  const filterOptions = optionsReady ? options.data : {};
  const priceLimit = catalogPriceCeiling(filterOptions, searchParams);
  const priceRange = catalogPriceRange(searchParams, priceLimit);
  const { products, pagination, error: loadError } = results;
  const mobileDialog = isMobile && showFilters;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const onChange = event => setIsMobile(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProducts = async () => {
      setFetching(true);
      const params = new URLSearchParams(queryKey);
      try {
        const response = await axios.get(`${API_URL}/products`, {
          params: { ...Object.fromEntries(params), limit: CATALOG_PAGE_SIZE },
          signal: controller.signal, timeout: 10000
        });
        if (controller.signal.aborted) return;
        const pageInfo = response.data?.pagination || {};
        if (pageInfo.totalPages > 0 && pageInfo.currentPage > pageInfo.totalPages) {
          params.set('page', String(pageInfo.totalPages));
          setSearchParams(params, { replace: true });
          return;
        }
        setResults({ query: queryKey, products: response.data?.products || [], pagination: pageInfo, error: false });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Product load failure:', error);
        setResults({ query: queryKey, products: [], pagination: {}, error: true });
      } finally {
        if (!controller.signal.aborted) setFetching(false);
      }
    };
    fetchProducts();
    return () => controller.abort();
  }, [queryKey, retryIndex, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchOptions = async () => {
      try {
        const response = await axios.get(`${API_URL}/products/filters/options`, {
          params: category ? { category } : {}, signal: controller.signal, timeout: 10000
        });
        if (!controller.signal.aborted) setOptions({ category, data: response.data || {}, error: false });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Filter options unavailable:', error);
        setOptions({ category, data: {}, error: true });
      }
    };
    fetchOptions();
    return () => controller.abort();
  }, [category, facetRetry]);

  useEffect(() => {
    if (!mobileDialog) return;
    const panel = sidebarRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowFilters(false);
      } else if (event.key === 'Tab') {
        const controls = [...panel.querySelectorAll('button:not([disabled]), select:not([disabled]), input:not([disabled]), a[href]')]
          .filter(element => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        } else if (!panel.contains(document.activeElement)) {
          event.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [mobileDialog]);

  const handleFilterChange = (key, value) => {
    setSearchParams(previous => changeCatalogFilter(previous, key, value));
  };
  const clearFilters = () => setSearchParams({});
  const changePage = page => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(Math.max(1, Math.min(pagination.totalPages || 1, page))));
    setSearchParams(next);
    document.querySelector('.products-header')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'
    });
  };
  const total = pagination.totalProducts || 0;
  const firstItem = ((pagination.currentPage || 1) - 1) * CATALOG_PAGE_SIZE + 1;
  const lastItem = Math.min(firstItem + products.length - 1, total);
  const pages = catalogPageLinks(pagination.currentPage || 1, pagination.totalPages || 0);

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header">
          <div className="header-left">
            <h1>{search ? `Search: “${search}”` : CATALOG_CATEGORIES[category] || 'All collectibles'}</h1>
            <span className="product-count" role="status">
              {loading ? 'Loading products…' : loadError ? 'Catalog unavailable'
                : total > 0 ? `${firstItem}–${lastItem} of ${total.toLocaleString()} products` : 'No matching products'}
            </span>
          </div>
          <div className="header-right">
            <button ref={toggleRef} className="filter-toggle" type="button" aria-controls="catalog-filters"
              aria-expanded={showFilters} onClick={() => setShowFilters(value => !value)}>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
              <span>Filters{filters.length > 0 ? ` (${filters.length})` : ''}</span>
            </button>
            <label className="catalog-stock-toggle">
              <input type="checkbox" checked={searchParams.get('inStock') === 'true'}
                onChange={event => handleFilterChange('inStock', event.target.checked ? 'true' : '')} />
              In stock only
            </label>
            <label className="catalog-sr-only" htmlFor="catalog-sort">Sort products</label>
            <select id="catalog-sort" className="sort-select" value={searchParams.get('sort') || ''}
              onChange={event => handleFilterChange('sort', event.target.value)}>
              <option value="">Newest arrivals</option><option value="price_asc">Price: Low to high</option>
              <option value="price_desc">Price: High to low</option><option value="name_asc">Name: A–Z</option>
              <option value="name_desc">Name: Z–A</option>
            </select>
          </div>
        </div>

        {filters.length > 0 && <div className="catalog-active-filters" aria-label="Active filters">
          {filters.map(filter => <button key={filter.key} type="button"
            onClick={() => handleFilterChange(filter.key, '')} aria-label={`Remove ${filter.label} filter`}>
            {filter.label}<span aria-hidden="true">×</span>
          </button>)}
          <button type="button" className="catalog-clear-all" onClick={clearFilters}>Clear all</button>
        </div>}

        <div className="products-layout">
          <aside ref={sidebarRef} id="catalog-filters" className={`filters-sidebar ${showFilters ? 'open' : ''}`}
            role={mobileDialog ? 'dialog' : undefined} aria-modal={mobileDialog ? true : undefined}
            aria-label="Refine products">
            <div className="filters-header">
              <h2>Refine products</h2><button type="button" className="clear-filters" onClick={clearFilters}>Reset</button>
              <button ref={closeRef} type="button" className="filter-close-btn" aria-label="Close filters"
                onClick={() => setShowFilters(false)}>×</button>
            </div>
            <div className="filter-group">
              <h3>TCG category</h3>
              <div className="filter-links">
                <button type="button" aria-pressed={!category} className={!category ? 'active' : ''}
                  onClick={() => handleFilterChange('category', '')}>All collections</button>
                {Object.entries(CATALOG_CATEGORIES).map(([key, name]) => <button type="button" key={key}
                  aria-pressed={category === key} className={category === key ? 'active' : ''}
                  onClick={() => handleFilterChange('category', key)}>{name}</button>)}
              </div>
            </div>
            {!optionsReady && <p className="catalog-facet-note" role="status">Loading detailed filters…</p>}
            {optionsReady && options.error && <div className="catalog-facet-note" role="status">
              <p>Detailed filters are temporarily unavailable.</p>
              <button type="button" onClick={() => setFacetRetry(index => index + 1)}>Retry filters</button>
            </div>}
            {facets.map(facet => {
              const selected = searchParams.get(facet.key) || '';
              const choices = facetChoices(filterOptions[facet.options], selected);
              return <div className="filter-group" key={facet.key}>
                <label htmlFor={`catalog-filter-${facet.key}`}>{facet.label}</label>
                <select id={`catalog-filter-${facet.key}`} value={selected}
                  disabled={!optionsReady || options.error || choices.length === 0}
                  onChange={event => handleFilterChange(facet.key, event.target.value)}>
                  <option value="">{facet.any}</option>
                  {choices.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>;
            })}
            <div className="filter-group catalog-price-filter">
              <PriceRange key={`${queryKey}:${priceLimit}`} onFilterChange={range => setSearchParams(previous => changeCatalogPrices(previous, range, priceLimit))}
                maxPrice={priceLimit} minValue={priceRange.min} maxValue={priceRange.max} />
            </div>
            <div className="catalog-mobile-apply">
              <button type="button" onClick={() => setShowFilters(false)}>Show products</button>
            </div>
          </aside>

          <section className="products-main" aria-label="Catalog results" aria-busy={loading}>
            {loading ? <div className="products-grid catalog-skeleton-grid" aria-hidden="true">
              {Array.from({ length: 12 }, (_, index) => <div className="catalog-skeleton-card" key={index}>
                <div/><span/><span/><span/>
              </div>)}
            </div> : loadError ? <div className="no-results" role="alert">
              <h2>Products are temporarily unavailable</h2><p>Please try again shortly.</p>
              <button type="button" onClick={() => setRetryIndex(index => index + 1)} className="btn btn-primary">Try again</button>
            </div> : products.length === 0 ? <div className="no-results">
              <h2>No items match these filters</h2><p>Remove a filter above or clear them to explore the catalog.</p>
              <button type="button" onClick={clearFilters} className="btn btn-primary">Clear filters</button>
            </div> : <>
              <div className="products-grid">{products.map(product => <ProductCard key={product.id} product={product} />)}</div>
              {pagination.totalPages > 1 && <nav className="catalog-pagination" aria-label="Product pages">
                <button type="button" disabled={pagination.currentPage <= 1} onClick={() => changePage(pagination.currentPage - 1)} aria-label="Previous page">←</button>
                {pages.map((page, index) => <span className="catalog-page-entry" key={page}>
                  {index > 0 && page - pages[index - 1] > 1 && <span className="catalog-page-gap" aria-hidden="true">…</span>}
                  <button type="button" aria-label={`Page ${page}`} aria-current={page === pagination.currentPage ? 'page' : undefined}
                    onClick={() => changePage(page)}>{page}</button>
                </span>)}
                <button type="button" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => changePage(pagination.currentPage + 1)} aria-label="Next page">→</button>
              </nav>}
            </>}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Products;
