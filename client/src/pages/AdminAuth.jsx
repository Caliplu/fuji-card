import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

const AdminAuth = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Change Password State
  const [changeForm, setChangeForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Connects to the backend admin-login endpoint we are about to create
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await axios.post(`${API_URL}/auth/admin-login`, {
        username,
        password
      });

      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        navigate('/secret-fuji-admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changeForm.newPassword !== changeForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      await axios.post(`${API_URL}/auth/admin-change-password`, {
        username,
        oldPassword: changeForm.oldPassword,
        newPassword: changeForm.newPassword
      });
      alert('Password updated successfully. Please login with your new credentials.');
      setIsChangingPassword(false);
      setChangeForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const calculateStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length > 6) score += 25;
    if (pwd.length > 10) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    return score;
  };

  return (
    <div className="admin-auth-container">
      <div className="admin-auth-card glass-panel">
        <div className="admin-auth-header">
          <h1 className="admin-title">Classified Access</h1>
          <p className="admin-subtitle">Fuji Card Admin</p>
        </div>

        {error && <div className="admin-alert error">{error}</div>}

        {!isChangingPassword ? (
          <form onSubmit={handleLogin} className="admin-form">
            <div className="form-group-admin">
              <label>Admin ID</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your administrative ID"
                required
              />
            </div>

            <div className="form-group-admin" style={{ position: 'relative' }}>
              <label>Passcode</label>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                className="password-toggle-eye" 
                onClick={() => setShowPass(!showPass)}
                aria-label="Toggle password visibility"
              >
                <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>

            <button
              type="submit"
              className="admin-btn-primary"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Initialize Override'}
            </button>
            
            <div className="admin-links">
              <button type="button" className="btn-link" onClick={() => setIsChangingPassword(true)}>
                Change Administrative Password
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="admin-form">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#fff', textAlign: 'center' }}>Modify Access Level</h2>
            
            <div className="form-group-admin">
              <label>Admin ID</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
            </div>

            <div className="form-group-admin" style={{ position: 'relative' }}>
              <label>Current Passcode</label>
              <input type={showOld ? "text" : "password"} value={changeForm.oldPassword} onChange={(e) => setChangeForm({...changeForm, oldPassword: e.target.value})} placeholder="Old Password" required />
              <button type="button" className="password-toggle-eye" onClick={() => setShowOld(!showOld)}>
                <i className={`fa-solid ${showOld ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>

            <div className="form-group-admin" style={{ position: 'relative' }}>
              <label>New Administrative Passcode</label>
              <input type={showNew ? "text" : "password"} value={changeForm.newPassword} onChange={(e) => setChangeForm({...changeForm, newPassword: e.target.value})} placeholder="New Password" required />
              <button type="button" className="password-toggle-eye" onClick={() => setShowNew(!showNew)}>
                <i className={`fa-solid ${showNew ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
              
              <div className="password-strength-meter">
                <div className="strength-label">Security Grade: {calculateStrength(changeForm.newPassword)}%</div>
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${calculateStrength(changeForm.newPassword)}%`,
                      backgroundColor: calculateStrength(changeForm.newPassword) > 75 ? '#10b981' : calculateStrength(changeForm.newPassword) > 40 ? '#f59e0b' : '#ef4444'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="form-group-admin" style={{ position: 'relative' }}>
              <label>Confirm Identity Token</label>
              <input type={showConfirm ? "text" : "password"} value={changeForm.confirmPassword} onChange={(e) => setChangeForm({...changeForm, confirmPassword: e.target.value})} placeholder="Confirm New Password" required />
              <button type="button" className="password-toggle-eye" onClick={() => setShowConfirm(!showConfirm)}>
                <i className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>

            <button type="submit" className="admin-btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Save New Protocol'}
            </button>
            
            <button type="button" className="admin-btn-secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => { setIsChangingPassword(false); setError(''); }}>
              Return to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminAuth;
