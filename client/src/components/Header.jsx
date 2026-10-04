import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import './Header.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL?.trim() || '';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [categories, setCategories] = useState([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState({ id: '', name: 'All' });
  const [expandedMobileTab, setExpandedMobileTab] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const currentScrollY = window.scrollY;
        const movement = currentScrollY - lastScrollY;
        if (currentScrollY <= 100) setIsHeaderVisible(true);
        else if (movement > 8) setIsHeaderVisible(false);
        else if (movement < -8) setIsHeaderVisible(true);
        if (Math.abs(movement) > 8 || currentScrollY <= 100) lastScrollY = currentScrollY;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        if (response.data && response.data.categories) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to primary Japanese TCG categories
        setCategories([
          { id: 'c1', name: 'pokemon' },
          { id: 'c2', name: 'onepiece' },
          { id: 'c3', name: 'other' }
        ]);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams({ search: searchQuery.trim() });
      // Only the mobile overlay offers a selected category. Other search bars say All.
      if (e.currentTarget.dataset.categoryScope === 'selected' && selectedCategory.id) {
        params.set('category', selectedCategory.id);
      }
      navigate(`/products?${params}`);
      setSearchQuery('');
      setMobileMenuOpen(false); // CLOSE MENU AFTER SEARCH
      setIsMobileSearchOpen(false); // Close mobile search if open
    }
  };

  const toggleCategories = () => {
    // Determine screen size to either show drawer (mobile) or dropdown (desktop)
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(true);
    } else {
      setCatDropdownOpen(!catDropdownOpen);
    }
  };

  const toggleMobileTab = (tab) => {
    setExpandedMobileTab(expandedMobileTab === tab ? null : tab);
  };

  return (
    <header className={`header-v2 ${isHeaderVisible ? 'visible' : 'hidden'}`}>
      {/* Top Bar - Blue */}
      <div className="header-top-blue">
        <div className="container top-bar-content">
          <div className="top-text-section">
             <span>JAPANESE TCG SHOP</span>
          </div>
          <div className="top-right-mockup">
            <Link to="/contact" className="contact-pill">
              <i className="fa-solid fa-envelope"></i>
              CONTACT
            </Link>
            {instagramUrl && <div className="social-nodes">
              <a href={instagramUrl} target="_blank" rel="noreferrer" className="node" aria-label="Instagram">
                <i className="fa-brands fa-instagram"></i>
              </a>
            </div>}
          </div>
        </div>
      </div>

      {/* Main Bar - White */}
      <div className="header-middle-white">
        <div className="container middle-flex-container">
          <button className="mobile-only-hamburger" onClick={() => setMobileMenuOpen(true)}>
             <i className="fa-solid fa-bars"></i>
          </button>

          <Link to="/" className="branding-mockup">
            <img src="/logo.png" alt="Fuji Card" className="logo-mockup-round" />
            <span className="name-mockup-bold">FUJI CARD</span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="desktop-search-container">
            <form className="search-box-desktop" onSubmit={handleSearch}>
              <div className="search-all-dropdown-container">
                <div className="search-all-dropdown" onClick={toggleCategories}>
                  <span>All</span>
                  <i className={`fa-solid fa-chevron-down ${catDropdownOpen ? 'rotated' : ''}`}></i>
                </div>
                
                {catDropdownOpen && (
                  <ul className="desktop-categories-dropdown">
                    {categories.map(cat => (
                      <li key={cat.id}>
                        <Link to={`/products?category=${cat.name}`} onClick={() => setCatDropdownOpen(false)}>
                          {cat.name.toUpperCase()}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input 
                type="text" 
                placeholder="Which item are you looking for.." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-icon-trigger">
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </form>
          </div>

          <div className="user-cart-mockup">
            <Link to={isAuthenticated ? "/account" : "/login"} className="user-action-mockup">
              <span className="user-label-desktop">{isAuthenticated ? (user?.name || 'ACCOUNT') : 'LOGIN'}</span>
              <div className="user-circle-mockup">
                <i className="fa-solid fa-user"></i>
              </div>
            </Link>

            <div className="divider-desktop"></div>

            <button className="mobile-search-toggle" onClick={() => setIsMobileSearchOpen(true)}>
               <i className="fa-solid fa-magnifying-glass"></i>
            </button>

            <Link to="/cart" className="cart-action-mockup">
              <span className="cart-label-desktop">CART</span>
              <div className="cart-blue-bag">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#004aad" strokeWidth="2.5">
                  <rect x="3" y="8" width="18" height="13" rx="1.5"></rect>
                  <path d="M8 8V6a4 4 0 0 1 8 0v2"></path>
                </svg>
                <span className="cart-digit">{cart.itemCount}</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Nav Bar - Red */}
      <div className="header-bottom-red">
        <div className="container">
          <nav className="centered-navigation">
            <ul className="nav-links-mockup">
              <li className="nav-item-dropdown">
                <Link to="/products?category=pokemon">POKEMON <i className="fa-solid fa-chevron-down"></i></Link>
                <ul className="sub-category-dropdown">
                  <li><Link to="/products?category=pokemon&type=booster">Booster Boxes Pokemon</Link></li>
                  <li><Link to="/products?category=pokemon&type=special">Special Set Pokemon</Link></li>
                  <li><Link to="/products?category=pokemon&type=promo">Promo Cards Pokemon</Link></li>
                </ul>
              </li>
              <li className="nav-item-dropdown">
                <Link to="/products?category=onepiece">ONE PIECE <i className="fa-solid fa-chevron-down"></i></Link>
                <ul className="sub-category-dropdown">
                  <li><Link to="/products?category=onepiece&type=booster">Booster Boxes One Piece</Link></li>
                  <li><Link to="/products?category=onepiece&type=sealed">Sealed Case One Piece</Link></li>
                  <li><Link to="/products?category=onepiece&type=special">Special Set ONE PIECE</Link></li>
                </ul>
              </li>
              <li className="nav-item-dropdown">
                <Link to="/products?category=other">OTHER TCG <i className="fa-solid fa-chevron-down"></i></Link>
                <ul className="sub-category-dropdown">
                   <li><Link to="/products?category=other&type=weiss">Weiss Schwarz</Link></li>
                   <li><Link to="/products?category=other&type=union">UNION ARENA</Link></li>
                   <li><Link to="/products?category=other&type=hololive">hololive OFFICIAL CG</Link></li>
                   <li><Link to="/products?category=other&type=lycee">Lycee Overture</Link></li>
                   <li><Link to="/products?category=other&type=gundam">Gundam Card Game</Link></li>
                   <li><Link to="/products?category=other&type=dragonball">Dragon Ball Fusion World</Link></li>
                   <li><Link to="/products?category=other&type=disney">Disney Lorcana Japanese</Link></li>
                   <li><Link to="/products?category=other&type=mtg">Magic the Gathering</Link></li>
                </ul>
              </li>
              <li className="nav-item-dropdown">
                <Link to="/info">INFO <i className="fa-solid fa-chevron-down"></i></Link>
                <ul className="sub-category-dropdown">
                  <li><Link to="/info?tab=news">Latest News</Link></li>
                  <li><Link to="/info?tab=lists">Card Lists</Link></li>
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="mobile-search-overlay-v2">
          <div className="search-overlay-container">
            <button className="close-search-overlay" onClick={() => setIsMobileSearchOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="search-overlay-content">
              <form onSubmit={handleSearch} data-category-scope="selected" className="mobile-search-integrated-v2">
                <div className="mobile-search-all-v2" onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}>
                   {selectedCategory.name} <i className={`fa-solid fa-chevron-down ${isCategoryDropdownOpen ? 'rotated' : ''}`}></i>
                   {isCategoryDropdownOpen && (
                     <ul className="mobile-category-mini-dropdown">
                        <li><Link to="#" onClick={(e) => {e.preventDefault(); setSelectedCategory({id: '', name: 'All'}); setIsCategoryDropdownOpen(false);}}>All Categories</Link></li>
                        <li><Link to="#" onClick={(e) => {e.preventDefault(); setSelectedCategory({id: 'pokemon', name: 'Pokemon'}); setIsCategoryDropdownOpen(false);}}>Pokemon</Link></li>
                        <li><Link to="#" onClick={(e) => {e.preventDefault(); setSelectedCategory({id: 'onepiece', name: 'One Piece'}); setIsCategoryDropdownOpen(false);}}>One Piece</Link></li>
                        <li><Link to="#" onClick={(e) => {e.preventDefault(); setSelectedCategory({id: 'other', name: 'Other'}); setIsCategoryDropdownOpen(false);}}>Other TCG</Link></li>
                     </ul>
                   )}
                </div>
                <div className="mobile-input-wrapper-v2">
                  <input 
                    type="text" 
                    placeholder="Which item are you looking for.." 
                    value={searchQuery}
                    autoFocus
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="mobile-drawer-v2 open">
            <div className="mobile-drawer-header">
              <button className="drawer-close" onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <nav className="mobile-drawer-nav">
              <ul className="mobile-main-links">
                <li className={expandedMobileTab === 'pokemon' ? 'active' : ''}>
                  <div className="mobile-nav-toggle" onClick={() => toggleMobileTab('pokemon')}>
                    POKEMON <i className={`fa-solid fa-chevron-down ${expandedMobileTab === 'pokemon' ? 'rotated' : ''}`}></i>
                  </div>
                  {expandedMobileTab === 'pokemon' && (
                    <ul className="mobile-sub-category-dropdown">
                      <li><Link to="/products?category=pokemon" onClick={() => setMobileMenuOpen(false)}>All Pokemon</Link></li>
                      <li><Link to="/products?category=pokemon&type=booster" onClick={() => setMobileMenuOpen(false)}>Booster Boxes</Link></li>
                      <li><Link to="/products?category=pokemon&type=special" onClick={() => setMobileMenuOpen(false)}>Special Sets</Link></li>
                      <li><Link to="/products?category=pokemon&type=promo" onClick={() => setMobileMenuOpen(false)}>Promo Cards</Link></li>
                    </ul>
                  )}
                </li>
                <li className={expandedMobileTab === 'onepiece' ? 'active' : ''}>
                  <div className="mobile-nav-toggle" onClick={() => toggleMobileTab('onepiece')}>
                    ONE PIECE <i className={`fa-solid fa-chevron-down ${expandedMobileTab === 'onepiece' ? 'rotated' : ''}`}></i>
                  </div>
                  {expandedMobileTab === 'onepiece' && (
                    <ul className="mobile-sub-category-dropdown">
                      <li><Link to="/products?category=onepiece" onClick={() => setMobileMenuOpen(false)}>All One Piece</Link></li>
                      <li><Link to="/products?category=onepiece&type=booster" onClick={() => setMobileMenuOpen(false)}>Booster Boxes</Link></li>
                      <li><Link to="/products?category=onepiece&type=sealed" onClick={() => setMobileMenuOpen(false)}>Sealed Cases</Link></li>
                      <li><Link to="/products?category=onepiece&type=special" onClick={() => setMobileMenuOpen(false)}>Special Sets</Link></li>
                    </ul>
                  )}
                </li>
                <li className={expandedMobileTab === 'other' ? 'active' : ''}>
                  <div className="mobile-nav-toggle" onClick={() => toggleMobileTab('other')}>
                    OTHER TCG <i className={`fa-solid fa-chevron-down ${expandedMobileTab === 'other' ? 'rotated' : ''}`}></i>
                  </div>
                  {expandedMobileTab === 'other' && (
                    <ul className="mobile-sub-category-dropdown">
                      <li><Link to="/products?category=other" onClick={() => setMobileMenuOpen(false)}>All Other TCG</Link></li>
                      <li><Link to="/products?category=other&type=weiss" onClick={() => setMobileMenuOpen(false)}>Weiss Schwarz</Link></li>
                      <li><Link to="/products?category=other&type=union" onClick={() => setMobileMenuOpen(false)}>UNION ARENA</Link></li>
                      <li><Link to="/products?category=other&type=hololive" onClick={() => setMobileMenuOpen(false)}>hololive OFFICIAL</Link></li>
                      <li><Link to="/products?category=other&type=lycee" onClick={() => setMobileMenuOpen(false)}>Lycee Overture</Link></li>
                      <li><Link to="/products?category=other&type=gundam" onClick={() => setMobileMenuOpen(false)}>Gundam Card Game</Link></li>
                      <li><Link to="/products?category=other&type=dragonball" onClick={() => setMobileMenuOpen(false)}>Dragon Ball Fusion</Link></li>
                      <li><Link to="/products?category=other&type=disney" onClick={() => setMobileMenuOpen(false)}>Disney Lorcana</Link></li>
                      <li><Link to="/products?category=other&type=mtg" onClick={() => setMobileMenuOpen(false)}>Magic The Gathering</Link></li>
                    </ul>
                  )}
                </li>
                <li className={expandedMobileTab === 'info' ? 'active' : ''}>
                  <div className="mobile-nav-toggle" onClick={() => toggleMobileTab('info')}>
                    INFO <i className={`fa-solid fa-chevron-down ${expandedMobileTab === 'info' ? 'rotated' : ''}`}></i>
                  </div>
                  {expandedMobileTab === 'info' && (
                    <ul className="mobile-sub-category-dropdown">
                      <li><Link to="/info" onClick={() => setMobileMenuOpen(false)}>General Info</Link></li>
                      <li><Link to="/info?tab=news" onClick={() => setMobileMenuOpen(false)}>Latest News</Link></li>
                      <li><Link to="/info?tab=lists" onClick={() => setMobileMenuOpen(false)}>Card Lists</Link></li>
                    </ul>
                  )}
                </li>
                <li>
                  <Link to="/info?tab=lists" className="mobile-nav-toggle no-chevron" onClick={() => setMobileMenuOpen(false)}>
                    CARD LISTS
                  </Link>
                </li>
              </ul>

              {/* Mobile Integrated Search */}
              <div className="mobile-search-slot">
                <form className="mobile-search-integrated" onSubmit={handleSearch}>
                  <div className="mobile-search-all">
                    <span>All</span> <i className="fa-solid fa-chevron-down"></i>
                  </div>
                  <div className="mobile-input-wrapper">
                    <input 
                      type="text" 
                      placeholder="Which item are you looking for.." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit">
                      <i className="fa-solid fa-magnifying-glass"></i>
                    </button>
                  </div>
                </form>
              </div>

              <div className="mobile-auth-links">
                <Link to={isAuthenticated ? "/account" : "/login"} onClick={() => setMobileMenuOpen(false)}>
                  {isAuthenticated ? (user?.name?.toUpperCase() || 'ACCOUNT') : 'LOGIN / REGISTER'}
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
