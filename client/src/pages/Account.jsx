import { useState, useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { ordersAPI } from '../services/api';
import './Account.css';
import './AccountTransactions.css';

const Account = () => {
  const { user, isAuthenticated, loading: authLoading, logout, updateProfile } = useAuth();
  const { formatPrice } = useCurrency();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'orders');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Update activeTab if query param changes
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
      setEditing(tab === 'profile'); // Auto-enable editing for profile tab
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        address: user.address || '',
        city: user.city || '',
        postcode: user.postcode || '',
        country: user.country || 'United Kingdom',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      fetchOrders();
      fetchTransactions();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(Array.isArray(response.data) ? response.data : (response.data?.orders || []));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      // Fetch from orders API - these are the transactions
      const response = await ordersAPI.getAll();
      setTransactions(Array.isArray(response.data) ? response.data : (response.data?.orders || []));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Validate passwords if changing
    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
      if (formData.newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }
      if (!formData.currentPassword) {
        setPasswordError('Current password is required to change password');
        return;
      }
    }

    setLoading(true);
    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        postcode: formData.postcode,
        country: formData.country,
        phone: formData.phone
      };

      // Only include password fields if changing
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      await updateProfile(updateData);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="account-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #e94560', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/account" />;
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      confirmed: '#2196f3',
      shipped: '#9c27b0',
      delivered: '#4caf50',
      cancelled: '#f44336'
    };
    return colors[status] || '#666';
  };

  // Calculate total transaction value for minimum check
  const getTotalTransactionValue = () => {
    return transactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
  };

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-layout">
          <aside className="account-sidebar">
            <div className="user-info">
              <div className="avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="9" r="3" />
                  <path d="M12 15c-2.5 0-4.5 1.5-5 3h10c-.5-1.5-2.5-3-5-3z" />
                </svg>
              </div>
              <h3>{user?.firstName} {user?.lastName}</h3>
              <p>{user?.email}</p>
            </div>
            <nav className="account-nav">
              <button
                className={activeTab === 'orders' ? 'active' : ''}
                onClick={() => setActiveTab('orders')}
              >
                My Orders
              </button>
              <button
                className={activeTab === 'transactions' ? 'active' : ''}
                onClick={() => setActiveTab('transactions')}
              >
                Order History
              </button>
              <button
                className={activeTab === 'profile' ? 'active' : ''}
                onClick={() => setActiveTab('profile')}
              >
                Profile Settings
              </button>
              <button onClick={logout} className="logout-btn">
                Logout
              </button>
            </nav>
          </aside>

          <main className="account-main">
            {activeTab === 'orders' && (
              <div className="orders-section">
                <h2>My Orders</h2>
                {!orders || orders.length === 0 ? (
                  <div className="empty-orders">
                    <p>You haven't placed any orders yet.</p>
                    <Link to="/products" className="btn btn-primary">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="orders-list">
                    {(orders || []).map(order => (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <div className="order-info">
                            <span className="order-number">{order.order_number || order.orderNumber}</span>
                            <span className="order-date">
                              {new Date(order.created_at || order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <span
                            className="order-status"
                            style={{ background: getStatusColor(order.status) }}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="order-items">
                          {(order.items || []).slice(0, 3).map((item, index) => (
                            <div key={index} className="order-item">
                              <img
                                src={item.image || item.image_url || '/logo.png'}
                                alt={item.name}
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.png'; }}
                              />
                              <div className="order-item-info">
                                <span className="item-name">{item.name}</span>
                                <span className="item-qty">Qty: {item.quantity}</span>
                              </div>
                            </div>
                          ))}
                          {(order.items || []).length > 3 && (
                            <span className="more-items">+{(order.items || []).length - 3} more</span>
                          )}
                        </div>
                        <div className="order-footer">
                          <span className="order-total">
                            Total: {formatPrice(parseFloat(order.total))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="transactions-section">
                <div className="section-header">
                  <h2>Order History</h2>
                  <div className="transaction-stats">
                    <div className="stat-card">
                      <span className="stat-label">Orders</span>
                      <span className="stat-value">{transactions.length}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Order value</span>
                      <span className="stat-value">{formatPrice(getTotalTransactionValue())}</span>
                    </div>
                  </div>
                </div>
                {transactions.length === 0 ? (
                  <div className="empty-transactions">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                      <path d="M7 15h.01" />
                      <path d="M11 15h2" />
                    </svg>
                    <p>No orders yet</p>
                    <Link to="/products" className="btn btn-primary">Make Your First Purchase</Link>
                  </div>
                ) : (
                  <div className="transactions-list">
                    {transactions.map(transaction => (
                      <div key={transaction.id} className="transaction-card">
                        <div className="transaction-header">
                          <div className="transaction-info">
                            <span className="transaction-number">Order #{transaction.order_number}</span>
                            <span className="transaction-date">
                              {new Date(transaction.created_at).toLocaleString()}
                            </span>
                          </div>
                          <span
                            className="transaction-status"
                            style={{ background: getStatusColor(transaction.status) }}
                          >
                            {transaction.status}
                          </span>
                        </div>

                        <div className="transaction-items">
                          <h4>Order items</h4>
                          <div className="items-grid">
                            {transaction.items?.slice(0, 3).map((item, index) => (
                              <div key={index} className="mini-item">
                                <img
                                  src={item.image || item.image_url || '/logo.png'}
                                  alt={item.name}
                                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.png'; }}
                                />
                                <div className="mini-item-info">
                                  <span className="mini-item-name">{item.name}</span>
                                  <span className="mini-item-details">
                                    Qty: {item.quantity} × {formatPrice(parseFloat(item.price))}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {transaction.items?.length > 3 && (
                              <div className="more-items">
                                +{transaction.items.length - 3} more items
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="transaction-details">
                          <div className="detail-grid">
                            <div className="detail-row">
                              <span className="label">Payment Method:</span>
                              <span className="value payment-method">
                                {({ paystack: 'Paystack', payfast: 'PayFast', cryptomus: 'Crypto', request: 'Order request', card: 'Card' })[transaction.payment_method] || transaction.payment_method || 'To be confirmed'}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="label">Currency:</span>
                              <span className="value">{transaction.currency || 'GBP'}</span>
                            </div>
                            <div className="detail-row">
                              <span className="label">Subtotal:</span>
                              <span className="value">{formatPrice(parseFloat(transaction.subtotal))}</span>
                            </div>
                            <div className="detail-row">
                              <span className="label">Shipping:</span>
                              <span className="value">
                                {parseFloat(transaction.shipping_cost) === 0 ? 'FREE' : formatPrice(parseFloat(transaction.shipping_cost))}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Parse shipping address from notes if available */}
                        {transaction.notes && (
                          <div className="transaction-shipping">
                            <h4>Shipping Address</h4>
                            <div className="shipping-info">
                              {(() => {
                                try {
                                  const notes = JSON.parse(transaction.notes);
                                  const address = notes.shippingAddress;
                                  return address ? (
                                    <>
                                      <p><strong>{address.firstName} {address.lastName}</strong></p>
                                      <p>{address.address}</p>
                                      <p>{address.city}, {address.postcode}</p>
                                      <p>{address.country}</p>
                                      <p>📧 {address.email}</p>
                                      <p>📞 {address.phone}</p>
                                    </>
                                  ) : null;
                                } catch (e) {
                                  return <p>Address information available</p>;
                                }
                              })()}
                            </div>
                          </div>
                        )}

                        <div className="transaction-footer">
                          <div className="transaction-summary">
                            <span className="transaction-total">
                              Total: {formatPrice(parseFloat(transaction.total))}
                            </span>
                            <div className="transaction-actions">
                              <button className="btn-small">View Details</button>
                              <button className="btn-small outline">Track Order</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="profile-section">
                <h2>Profile Settings</h2>
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        disabled={!editing}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        disabled={!editing}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!editing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={!editing}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        disabled={!editing}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Postcode</label>
                      <input
                        type="text"
                        value={formData.postcode || ''}
                        onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                        disabled={!editing}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Country</label>
                    <select
                      value={formData.country || ''}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      disabled={!editing}
                      required
                    >
                      <option>United Kingdom</option>
                      <option>United States</option>
                      <option>Germany</option>
                      <option>France</option>
                      <option>Japan</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editing}
                      required
                    />
                  </div>

                  {editing && (
                    <>
                      <hr style={{ margin: '20px 0', border: '1px solid #eee' }} />
                      <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#e94560' }}>Change Password (Optional)</h3>

                      <div className="form-group">
                        <label>Current Password</label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>New Password</label>
                          <input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            placeholder="New password"
                          />
                        </div>
                        <div className="form-group">
                          <label>Confirm New Password</label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>

                      {passwordError && (
                        <div className="error-message" style={{ color: '#f44336', marginBottom: '15px', fontSize: '14px' }}>
                          {passwordError}
                        </div>
                      )}
                    </>
                  )}

                  <div className="form-actions">
                    {editing ? (
                      <>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => {
                            setEditing(false);
                            setPasswordError('');
                            setFormData({
                              ...formData,
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: ''
                            });
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setEditing(true)}
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Account;
