import { Link } from 'react-router-dom';
import './Footer.css';

const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL?.trim() || '';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Company Info */}
            <div className="footer-column">
              <h3 className="footer-title">FUJI CARD</h3>
              <p className="footer-description">
                Your premium destination for trading cards, sealed products, and accessories. 
                We contribute to the collecting hobby by being reliable, delivering quality, 
                and serving unique products.
              </p>
            </div>

            {/* Quick Links */}
            <div className="footer-column">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/products?category=pokemon">Pokemon Cards</Link></li>
                <li><Link to="/products?category=yugioh">Yu-Gi-Oh! Cards</Link></li>
                <li><Link to="/products?category=onepiece">One Piece Cards</Link></li>
                <li><Link to="/products?category=newarrivals">New Arrivals</Link></li>
                <li><Link to="/products?category=specialrare">Special & Rare</Link></li>
                <li><Link to="/products?category=promo">Promo Cards</Link></li>
              </ul>
            </div>

            {/* Products */}
            <div className="footer-column">
              <h4 className="footer-heading">Products</h4>
              <ul className="footer-links">
                <li><Link to="/products?category=sealed">Sealed Products</Link></li>
                <li><Link to="/products?category=accessories">Accessories</Link></li>
                <li><Link to="/products">All Products</Link></li>
                <li><Link to="/products?featured=true">Featured Items</Link></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className="footer-column">
              <h4 className="footer-heading">Customer Service</h4>
              <ul className="footer-links">
                <li><Link to="/account">My Account</Link></li>
                <li><Link to="/cart">Shopping Cart</Link></li>
                <li><Link to="/checkout">Checkout</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>

            {/* Contact & Newsletter */}
            <div className="footer-column">
              <h4 className="footer-heading">Stay Connected</h4>
              <p className="footer-contact-text">Visit the contact page for support information.</p>
              {instagramUrl && <div className="social-links">
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="social-icon" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
              </div>}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <p className="copyright">&copy; 2026 Fuji Card. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
