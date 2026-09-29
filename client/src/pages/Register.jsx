import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);



  const redirect = searchParams.get('redirect') || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Calculate password strength
  useEffect(() => {
    const password = formData.password;
    let strength = 0;

    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    setPasswordStrength(Math.min(strength, 5));
  }, [formData.password]);

  const getStrengthLabel = (strength) => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return labels[strength] || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (passwordStrength < 2) {
      setError('Please choose a stronger password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(formData);
      navigate(redirect);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>Create Account</h1>
          <p className="auth-subtitle">Join Fuji Card for exclusive offers!</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
                autoComplete="new-password"
              />

              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className={`strength-fill strength-${passwordStrength}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className={`strength-text strength-${passwordStrength}`}>
                    {getStrengthLabel(passwordStrength)}
                  </span>
                </div>
              )}
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to={`/login${redirect !== '/' ? `?redirect=${redirect}` : ''}`}>Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
