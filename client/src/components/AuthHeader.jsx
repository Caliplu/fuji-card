import { Link } from 'react-router-dom';
import './AuthHeader.css';

const AuthHeader = () => {
  return (
    <header className="auth-header">
      <div className="auth-header-container">
        <Link to="/" className="auth-logo">
          <div className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <span className="logo-text">Fuji Card</span>
        </Link>
      </div>
    </header>
  );
};

export default AuthHeader;
