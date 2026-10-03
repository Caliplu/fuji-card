import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';
import '../components/ProductCard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');

    // Dashboard Stats
    const [stats, setStats] = useState({ users: 0, products: 0, orders: 0 });
    const [loading, setLoading] = useState(true);

    // Products State
    const [products, setProducts] = useState([]);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [imageSourceFilter, setImageSourceFilter] = useState('all');
    const [catalogLoadError, setCatalogLoadError] = useState(false);
    const [isEditing, setIsEditing] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Users State
    const [usersList, setUsersList] = useState([]);

    // Orders State
    const [ordersList, setOrdersList] = useState([]);

    // Drag & Drop UI State
    const [isDragging, setIsDragging] = useState(false);

    // Category Filter State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);

    // Bulk Stock Update State
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [bulkStockAdd, setBulkStockAdd] = useState('');

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    // Crypto wallet config editor state
    const [cryptoWallets, setCryptoWallets] = useState({
        BTC: { label: 'Bitcoin', address: '', trustLink: '', qrFile: '', color: '#f7931a' },
        ETH: { label: 'Ethereum', address: '', trustLink: '', qrFile: '', color: '#627eea' },
        USDT: { label: 'Tether (USDT)', address: '', trustLink: '', qrFile: '', color: '#26a17b' },
        USDC: { label: 'USD Coin (USDC)', address: '', trustLink: '', qrFile: '', color: '#2775ca' },
        LTC: { label: 'Litecoin', address: '', trustLink: '', qrFile: '', color: '#bfbbbb' }
    });
    const [paystackConfig, setPaystackConfig] = useState({ publicKey: '', secretKey: '' });
    const [payfastConfig, setPayfastConfig] = useState({ merchantId: '', merchantKey: '', passphrase: '', url: 'https://www.payfast.co.za/eng/process' });
    const [hasUnread, setHasUnread] = useState(false);

    // Low Stock restock input amounts keyed by product id
    const [lowStockAmounts, setLowStockAmounts] = useState({});
    const [bulkAllLowStock, setBulkAllLowStock] = useState('');

    // Search filtering state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);

    const subCatsMap = {
        'pokemon': ['Booster Boxes Pokemon', 'Special Set Pokemon', 'Promo Cards Pokemon'],
        'onepiece': ['Booster Boxes One Piece', 'Sealed Case One Piece', 'Special Set ONE PIECE'],
        'other': [
            'Weiss Schwarz', 'UNION ARENA', 'hololive OFFICIAL CG', 'Lycee Overture',
            'Gundam Card Game', 'Dragon Ball Fusion World', 'Disney Lorcana Japanese',
            'Magic the Gathering'
        ]
    };

    // File Input Ref for click-to-upload
    const fileInputRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || '/api';

    // Run strictly once on mount to fetch broad data
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/secret-fuji-admin');
            return;
        }
        fetchNotifications(token);
        fetchCategories();
    }, [navigate]);

    // targeted tab execution
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        if (activeTab === 'dashboard') {
            fetchStats(token);
        } else if (activeTab === 'products' || activeTab === 'supplier') {
            fetchProducts();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'orders') {
            fetchOrders();
        } else if (activeTab === 'settings') {
            fetchPaystackConfig(token);
            fetchPayfastConfig(token);
        }
    }, [activeTab]);

    // Fetch all products on mount so Low Stock panel on dashboard has data
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchStats = async (token) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(data);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) navigate('/secret-fuji-admin');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            setCatalogLoadError(false);
            const allProducts = [];
            for (let page = 1; ; page++) {
                const { data } = await axios.get(`${API_URL}/products`, {
                    params: { page, limit: 500, _t: Date.now() }
                });
                allProducts.push(...(data.products || []));
                if (!data.pagination?.hasMore) break;
            }

            const normalized = allProducts.map(p => ({
                ...p,
                cardType: p.card_type || p.cardType || 'Character',
                image_url: p.image_url || p.image
            }));
            setProducts(normalized);
        } catch (err) {
            setCatalogLoadError(true);
            console.error("Failed to fetch products", err);
        } finally {
            setLoading(false);
        }
    };

    const exportSupplierReview = () => {
        if (!products.length || catalogLoadError) return;
        const cell = value => {
            const raw = String(value ?? '');
            const safe = /^[=+@-]/.test(raw) ? "'" + raw : raw;
            return '"' + safe.replaceAll('"', '""') + '"';
        };
        const columns = [
            'product_id', 'name', 'category', 'set_name', 'language',
            'current_price_gbp', 'recorded_stock', 'supplier_sku',
            'supplier_available_quantity', 'supplier_unit_cost',
            'lead_time_days', 'image_permission_or_url', 'quote_reference',
            'current_image_url', 'current_image_source'
        ];
        const rows = products.map(product => [
            product.id, product.name, product.categories?.name || product.category,
            product.set_name || product.set, product.language, product.price, product.stock,
            '', '', '', '', '', '', product.image_url, getImageSource(product.image_url)
        ].map(cell).join(','));
        const csv = [columns.join(','), ...rows].join(String.fromCharCode(13, 10));
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'fuji-card-supplier-review.csv';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    };

    const getImageSource = imageUrl => {
        if (!imageUrl) return 'Missing';
        try {
            const url = new URL(imageUrl, window.location.origin);
            return url.origin === window.location.origin ? 'Fuji Card / local' : url.hostname;
        } catch {
            return 'Invalid URL';
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/categories`);
            setCategories(Array.isArray(data?.categories) ? data.categories : []);
        } catch (err) {
            console.error("Failed to fetch categories", err);
            setCategories([]);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.get(`${API_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsersList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.get(`${API_URL}/admin/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrdersList(data || []);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaystackConfig = async (token) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/admin/paystack-config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPaystackConfig(data || { publicKey: '', secretKey: '', currency: 'USD' });
        } catch (err) {
            console.error("Failed to fetch Paystack config", err);
        } finally {
            setLoading(false);
        }
    };
    const handleSavePaystack = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            await axios.put(`${API_URL}/admin/paystack-config`, paystackConfig, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Paystack settings updated successfully!');
        } catch (error) {
            console.error('Failed to save Paystack settings', error);
            alert('Failed to save settings.');
        }
    };

    const fetchPayfastConfig = async (token) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/admin/payfast-config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayfastConfig(data || { merchantId: '', merchantKey: '', passphrase: '', url: 'https://www.payfast.co.za/eng/process' });
        } catch (err) {
            console.error("Failed to fetch PayFast config", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePayfast = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            await axios.put(`${API_URL}/admin/payfast-config`, payfastConfig, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('PayFast settings updated successfully!');
        } catch (error) {
            console.error('Failed to save PayFast settings', error);
            alert('Failed to save settings.');
        }
    };

    const fetchNotifications = async (token) => {
        try {
            const { data } = await axios.get(`${API_URL}/admin/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => {
                const newData = data || [];
                // Only trigger the unread badge if new notifications actually arrived since last fetch
                if (newData.length > 0 && prev.length === 0) {
                    setHasUnread(true);
                } else if (newData.length > prev.length) {
                    setHasUnread(true);
                }
                return newData;
            });
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/secret-fuji-admin');
    };

    // Product Handlers
    const handleEditClick = (product, defaultCategory = 'pokemon') => {
        setIsEditing(product.id || 'new');
        setEditForm(product.id ? { ...product } : {
            name: '', description: '', price: 0, category_name: product.category_name || selectedCategory || defaultCategory, image_url: '', stock: 0, condition: 'Mint'
        });
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    // Drag & Drop Image Handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleImageUpload(file);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        if (file) handleImageUpload(file);
    };

    const handleDropzoneClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleImageUpload = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please drop a valid image file');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setEditForm(prev => ({ ...prev, image_url: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        try {
            setIsSaving(true);
            if (isEditing === 'new') {
                await axios.post(`${API_URL}/admin/products`, editForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Product IDs are text in the live catalog, including imported "cc-" IDs.
                await axios.put(`${API_URL}/admin/products/${isEditing}`, editForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsEditing(null);
            await fetchProducts(); // Refresh list
            alert(`Card "${editForm.name}" ${isEditing === 'new' ? 'created' : 'updated'} successfully! Changes are now live on the database.`);
        } catch (error) {
            console.error('Failed to save product', error);
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
            alert(`Failed to save product: ${errorMsg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to delete this card?")) return;
        const token = localStorage.getItem('adminToken');
        try {
            await axios.delete(`${API_URL}/admin/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchProducts(); // Refresh
        } catch (error) {
            console.error('Failed to delete product', error);
            alert('Failed to delete. Active orders might depend on this product.');
        }
    };

    const handleBulkStockUpdate = async () => {
        if (selectedProducts.size === 0) return alert('Select at least one product.');
        if (!bulkStockAdd || isNaN(bulkStockAdd) || Number(bulkStockAdd) <= 0) return alert('Enter a valid stock number to add');

        const token = localStorage.getItem('adminToken');
        try {
            await axios.put(`${API_URL}/admin/products/bulk-stock`, {
                productIds: Array.from(selectedProducts),
                stockToAdd: Number(bulkStockAdd)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedProducts(new Set());
            setBulkStockAdd('');
            fetchProducts();
            alert('Bulk stock update successful!');
        } catch (error) {
            console.error('Bulk update failed', error);
            alert('Bulk update failed.');
        }
    };

    // Restock a single low-stock product
    const handleRestockSingle = async (productId) => {
        const amount = parseInt(lowStockAmounts[productId], 10);
        if (!amount || amount <= 0) return alert('Enter a valid quantity to add.');
        const token = localStorage.getItem('adminToken');
        try {
            await axios.put(`${API_URL}/admin/products/bulk-stock`, {
                productIds: [productId],
                stockToAdd: amount
            }, { headers: { Authorization: `Bearer ${token}` } });
            setLowStockAmounts(prev => ({ ...prev, [productId]: '' }));
            fetchProducts();
            alert('Stock added successfully!');
        } catch (err) {
            console.error('Restock failed', err);
            alert('Failed to update stock. Check server logs.');
        }
    };

    const handleRestockAllLowStock = async () => {
        const amount = parseInt(bulkAllLowStock, 10);
        if (!amount || amount <= 0) return alert('Enter a valid quantity to add.');

        const lowStockIds = products
            .filter(p => Number(p.stock) < 10)
            .map(p => p.id);

        if (lowStockIds.length === 0) return alert('No low stock products found.');

        const token = localStorage.getItem('adminToken');
        try {
            await axios.put(`${API_URL}/admin/products/bulk-stock`, {
                productIds: lowStockIds,
                stockToAdd: amount
            }, { headers: { Authorization: `Bearer ${token}` } });
            setBulkAllLowStock('');
            fetchProducts();
            alert(`Stock successfully added to all ${lowStockIds.length} items!`);
        } catch (err) {
            console.error('Bulk restock failed', err);
            alert('Failed to update stock. Check server logs.');
        }
    };

    // User Handlers
    const handleToggleBanUser = async (id, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return;
        const token = localStorage.getItem('adminToken');
        try {
            await axios.put(`${API_URL}/admin/users/${id}/ban`, { is_banned: !currentStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            console.error('Failed to change user status', error);
            alert('Failed to change user status.');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to PERMANENTLY delete this user? This cannot be undone.")) return;
        const token = localStorage.getItem('adminToken');
        try {
            await axios.delete(`${API_URL}/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user', error);
            alert('Failed to delete. Active orders might depend on this user.');
        }
    };

    // DELETE ALL USERS (nuclear — double confirmed)
    const handleDeleteAllUsers = async () => {
        const first = window.confirm('⚠️ WARNING: This will permanently delete ALL user accounts.\n\nThis action CANNOT be undone.\n\nAre you sure?');
        if (!first) return;
        const second = window.confirm('🚨 FINAL WARNING: You are about to delete EVERY user from the database.\n\nType OK to confirm this irreversible action.');
        if (!second) return;
        const token = localStorage.getItem('adminToken');
        try {
            await axios.delete(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
            fetchUsers();
            alert('All users have been deleted.');
        } catch (error) {
            console.error('Failed to delete all users', error);
            alert('Failed to delete all users: ' + (error.response?.data?.error || error.message));
        }
    };

    // DELETE ALL ORDERS (nuclear — double confirmed)
    const handleDeleteAllOrders = async () => {
        const first = window.confirm('⚠️ WARNING: This will permanently delete ALL orders and payment records.\n\nThis action CANNOT be undone.\n\nAre you sure?');
        if (!first) return;
        const second = window.confirm('🚨 FINAL WARNING: You are about to wipe the ENTIRE orders history.\n\nClick OK to confirm.');
        if (!second) return;
        const token = localStorage.getItem('adminToken');
        try {
            await axios.delete(`${API_URL}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } });
            fetchOrders();
            alert('All orders have been deleted.');
        } catch (error) {
            console.error('Failed to delete all orders', error);
            alert('Failed to delete all orders: ' + (error.response?.data?.error || error.message));
        }
    };

    // Category Handlers
    const handleAddCategory = async () => {
        const catName = window.prompt("Enter new category name:");
        if (!catName || !catName.trim()) return;

        const token = localStorage.getItem('adminToken');
        try {
            await axios.post(`${API_URL}/admin/categories`, { name: catName.trim() }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCategories(); // Refresh categories
        } catch (error) {
            console.error('Failed to add category', error);
            alert('Failed to add category');
        }
    };

    const handleDeleteCategory = async (e, id) => {
        e.stopPropagation(); // Prevent clicking into the category
        if (!window.confirm("Are you sure you want to delete this category? Make sure no products are using it!")) return;

        const token = localStorage.getItem('adminToken');
        try {
            await axios.delete(`${API_URL}/admin/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCategories(); // Refresh categories
        } catch (error) {
            console.error('Failed to delete category', error);
            alert('Failed to delete category. Ensure no products exist in it.');
        }
    };

    return (
        <div className="admin-dashboard-container">
            <style>{`
                .spinner-mini {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            {/* Sidebar Toggle for Mobile */}
            <nav className="admin-sidebar glass-panel">
                <div className="admin-logo">
                    <h2>Fuji Admin</h2>
                    <span className="live-status">Secure Connection Verified</span>
                </div>
                <ul className="admin-nav-links">
                    <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>System Overview</li>
                    <li className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>Cards Management</li>
                    <li className={activeTab === 'supplier' ? 'active' : ''} onClick={() => setActiveTab('supplier')}>Supplier Review</li>
                    <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users Management</li>
                    <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>Orders Tracking</li>
                    <li className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Payment Settings</li>
                </ul>
                <div className="sidebar-bottom">
                    <button className="admin-btn-secondary" onClick={handleLogout}>Terminate Session</button>
                </div>
            </nav>

            <div className="admin-main-view" style={{ position: 'relative' }}>
                <div className="admin-top-bar" style={{ position: 'absolute', top: '1.5rem', right: '3rem', zIndex: 100 }}>
                    <div className="notification-bell" onClick={() => { setShowNotifications(!showNotifications); setHasUnread(false); }} style={{ position: 'relative', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        {hasUnread && notifications.length > 0 && (
                            <span className="notification-badge" style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
                                {notifications.length}
                            </span>
                        )}
                    </div>

                    {showNotifications && (
                        <div className="notification-panel glass-panel" style={{ position: 'absolute', top: '120%', right: '0', width: '380px', borderRadius: '12px', padding: '1.5rem', maxHeight: '400px', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 101 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontFamily: "'Space Grotesk', sans-serif" }}>Recent Transactions</h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={() => setNotifications([])}
                                        title="Clear all notifications"
                                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                                        Clear All
                                    </button>
                                )}
                            </div>
                            {notifications.length === 0 ? (
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No recent activity.</p>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} className="notification-item" onClick={() => { setShowNotifications(false); setActiveTab('orders'); }} style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 'bold', color: '#60a5fa', fontSize: '1rem' }}>{notif.customer}</span>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.2rem 0' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Paid: <strong style={{ color: '#fff' }}>{notif.currency} {notif.amount}</strong></span>
                                            <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', background: ['crypto', 'cryptocurrency', 'cryptomus'].includes(notif.method) ? 'rgba(251, 191, 36, 0.2)' : 'rgba(167, 139, 250, 0.2)', color: ['crypto', 'cryptocurrency', 'cryptomus'].includes(notif.method) ? '#fbbf24' : '#a78bfa' }}>
                                                {notif.method}
                                            </span>
                                        </div>
                                        {notif.email && notif.email !== 'N/A' && (
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{notif.email}</span>
                                        )}
                                        <div style={{ marginTop: '0.2rem', fontSize: '0.75rem', color: '#3b82f6', textAlign: 'right' }}>Click to view details ↗</div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {loading && <div className="admin-loading">Processing...</div>}
                {!loading && !isEditing && activeTab === 'dashboard' && (
                    <div>
                        <header className="admin-dashboard-header">
                            <h1>System Overview</h1>
                        </header>

                        <div className="admin-stats-grid">
                            <div className="stat-card glass-panel">
                                <h3>Total Registered Users</h3>
                                <div className="stat-value">{stats.users} Active</div>
                            </div>
                            <div className="stat-card glass-panel">
                                <h3>Total Inventory (Cards)</h3>
                                <div className="stat-value">{stats.products} Units</div>
                            </div>
                            <div className="stat-card glass-panel">
                                <h3>Total Orders Processed</h3>
                                <div className="stat-value alert-text">{stats.orders} Actions</div>
                            </div>
                        </div>

                        {/* Low Stock Alert Panel */}
                        {products.filter(p => Number(p.stock) < 10).length > 0 && (
                            <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                                    <h3 style={{ margin: 0, color: '#f59e0b' }}>
                                        Low Stock Alert — {products.filter(p => Number(p.stock) < 10).length} card(s) running low
                                    </h3>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Add to all"
                                            value={bulkAllLowStock}
                                            onChange={e => setBulkAllLowStock(e.target.value)}
                                            style={{
                                                width: '100px', padding: '0.5rem', borderRadius: '8px',
                                                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                                                color: '#f1f5f9', fontSize: '0.9rem'
                                            }}
                                        />
                                        <button
                                            onClick={handleRestockAllLowStock}
                                            style={{
                                                padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
                                            }}
                                        >
                                            Restock All
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {products
                                        .filter(p => Number(p.stock) < 10)
                                        .sort((a, b) => Number(a.stock) - Number(b.stock))
                                        .map(product => (
                                            <div key={product.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '1rem',
                                                background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
                                                padding: '0.75rem 1rem', flexWrap: 'wrap'
                                            }}>
                                                {product.image_url && (
                                                    <img src={product.image_url} alt={product.name}
                                                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                                                )}
                                                <div style={{ flex: 1, minWidth: '160px' }}>
                                                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{product.name}</div>
                                                    <div style={{
                                                        fontSize: '0.82rem', marginTop: '2px',
                                                        color: Number(product.stock) === 0 ? '#ef4444' : '#f59e0b',
                                                        fontWeight: 600
                                                    }}>
                                                        {Number(product.stock) === 0 ? '🔴 Sold Out' : `🟡 ${product.stock} left`}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        placeholder="Qty"
                                                        value={lowStockAmounts[product.id] || ''}
                                                        onChange={e => setLowStockAmounts(prev => ({ ...prev, [product.id]: e.target.value }))}
                                                        style={{
                                                            width: '80px', padding: '0.4rem 0.6rem', borderRadius: '6px',
                                                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                                            color: '#f1f5f9', fontSize: '0.9rem'
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleRestockSingle(product.id)}
                                                        style={{
                                                            padding: '0.4rem 0.9rem', borderRadius: '6px', border: 'none',
                                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                                            color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        + Add Stock
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        <div className="admin-recent-activity glass-panel" style={{ marginTop: '2rem' }}>
                            <h3>Administrative Operations</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Sync your local flagship inventory (100+ items) to the Supabase cloud ledger to enable live database management.
                            </p>
                            <button
                                className="admin-btn-primary"
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                                onClick={async () => {
                                    if (!window.confirm("Initialize mass synchronization to Supabase? This will populate your cloud database with all local flagship items.")) return;
                                    try {
                                        const token = localStorage.getItem('adminToken');
                                        const API_URL = import.meta.env.VITE_API_URL || '/api';
                                        const { data } = await axios.post(`${API_URL}/admin/sync-flagship`, {}, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        alert(data.message || "Sync successful!");
                                        window.location.reload();
                                    } catch (err) {
                                        alert("Sync failed: " + (err.response?.data?.error || err.message));
                                    }
                                }}
                            >
                                ⚡ Synchronize Cloud Ledger
                            </button>
                            <ul className="log-list" style={{ marginTop: '1.5rem' }}>
                                <li>[Sys] Admin dashboard established contact w/ system.</li>
                                <li>[Intel] Currently monitoring local flagship assets.</li>
                                {stats.fallbackMode && <li style={{ color: '#f59e0b' }}>[Warning] Running in Legacy Fallback mode (Supabase disconnected).</li>}
                            </ul>
                        </div>
                    </div>
                )}

                {!loading && isEditing && (
                    <div className="admin-edit-container" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: '1rem' }}>
                        <div className="admin-edit-form glass-panel" style={{ flex: 1, minWidth: '400px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0 }}>{isEditing === 'new' ? 'Initialize New Card Asset' : 'Modify Asset Properties'}</h3>
                                <button className="admin-btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem' }} onClick={() => setIsEditing(null)}>
                                    Abort
                                </button>
                            </div>
                            <form onSubmit={handleSaveProduct} className="admin-form">
                                <div className="form-group-admin">
                                    <label>Card Name</label>
                                    <input name="name" value={editForm.name || ''} onChange={handleFormChange} required />
                                </div>
                                <div className="form-group-admin">
                                    <label>Price (£)</label>
                                    <input type="number" step="0.01" name="price" value={editForm.price || ''} onChange={handleFormChange} required />
                                </div>
                                <div className="form-group-admin">
                                    <label>Category Code</label>
                                    <select name="category_name" value={editForm.category_name || (editForm.categories?.name) || ''} onChange={handleFormChange}>
                                        <option value="" disabled>Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group-admin">
                                    <label>Stock Count</label>
                                    <input type="number" min="0" step="1" name="stock" value={editForm.stock ?? 0} onChange={handleFormChange} required />
                                </div>
                                <div className="form-group-admin">
                                    <label>Classification (Subcategory/Type)</label>
                                    <select name="cardType" value={editForm.cardType || ''} onChange={handleFormChange}>
                                        <option value="">Select Classification</option>
                                        {Object.values(subCatsMap).flat().map(sc => (
                                            <option key={sc} value={sc}>{sc}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group-admin">
                                    <label>Condition</label>
                                    <select name="condition" value={editForm.condition || 'Mint'} onChange={handleFormChange}>
                                        <option value="Mint">Mint</option>
                                        <option value="Near Mint">Near Mint</option>
                                        <option value="Excellent">Excellent</option>
                                        <option value="Good">Good</option>
                                        <option value="Fair">Fair</option>
                                        <option value="Poor">Poor</option>
                                        <option value="Sealed">Sealed</option>
                                    </select>
                                </div>
                                <div className="form-group-admin">
                                    <label>Set Name</label>
                                    <input name="set_name" value={editForm.set_name || ''} onChange={handleFormChange} placeholder="e.g. Vivid Voltage" />
                                </div>
                                <div className="form-group-admin">
                                    <label>Image Resource</label>
                                    <div
                                        className={`admin-image-dropzone ${isDragging ? 'dragging' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={handleDropzoneClick}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                            onChange={handleFileInputChange}
                                        />
                                        <div className="dropzone-placeholder">
                                            <div className="upload-icon">📸</div>
                                            <p>{editForm.image_url ? 'Asset imported. Drag or click here to replace.' : 'Drag & Drop an image here or click to browse'}</p>
                                            <p className="small-text">or paste an image URL below</p>
                                        </div>
                                    </div>
                                    <input
                                        name="image_url"
                                        value={editForm.image_url || ''}
                                        onChange={handleFormChange}
                                        placeholder="https://... or base64 format..."
                                        style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button
                                        type="submit"
                                        className="admin-btn-primary"
                                        disabled={isSaving}
                                        style={{ flex: 2, background: isSaving ? '#64748b' : 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                                    >
                                        {isSaving ? (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <div className="spinner-mini"></div> Processing...
                                            </span>
                                        ) : 'Commit Changes'}
                                    </button>
                                    <button type="button" className="admin-btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditing(null)}>Abort</button>
                                </div>
                            </form>
                        </div>

                        {/* LIVE PREVIEW PANEL */}
                        <div className="admin-preview-panel glass-panel" style={{ width: '320px', padding: '1.5rem', borderRadius: '16px' }}>
                            <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '1.5rem', fontFamily: "'Space Grotesk', sans-serif" }}>Storefront Simulator</h3>

                            <div className="product-card" style={{ pointerEvents: 'none', margin: '0 auto', background: '#fff' }}>
                                <div className="product-image">
                                    <img
                                        src={editForm.image_url || `https://via.placeholder.com/300x400?text=${encodeURIComponent(editForm.name || 'New Card')}`}
                                        alt={editForm.name || 'Preview'}
                                    />
                                    {editForm.stock <= 3 && editForm.stock > 0 && (
                                        <span className="stock-badge low">Only {editForm.stock} left!</span>
                                    )}
                                    {editForm.stock == 0 && (
                                        <span className="stock-badge out">Sold Out</span>
                                    )}
                                </div>
                                <div className="product-info">
                                    <span className="product-category">{editForm.category_name || editForm.categories?.name || 'pokemon'}</span>
                                    <h3 className="product-name">{editForm.name || 'Card Name'}</h3>
                                    <div className="product-meta">
                                        <span className="product-set">{editForm.set_name || 'N/A'}</span>
                                        <span className="product-condition">{editForm.condition || 'Mint'}</span>
                                    </div>
                                    <div className="product-footer">
                                        <div className="price-container">
                                            <span className="product-price">£{Number(editForm.price || 0).toFixed(2)}</span>
                                        </div>
                                        <button className="add-to-cart-btn" disabled>Add to Cart</button>
                                    </div>
                                </div>
                            </div>
                            {editForm.image_url && (
                                <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    style={{ width: '100%', marginTop: '1rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                                    onClick={() => setEditForm(prev => ({ ...prev, image_url: '' }))}
                                >
                                    Remove Current Image
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {!loading && !isEditing && activeTab === 'supplier' && (
                    <section className="glass-panel" style={{ padding: '2rem', marginTop: '1rem' }}>
                        <header className="admin-dashboard-header">
                            <h1>Supplier Review</h1>
                            <p>Check exact products, quantities, cost and image rights with your TCG supplier before updating the public catalog.</p>
                        </header>
                        {catalogLoadError ? (
                            <div role="alert">
                                <p>Catalog could not be loaded. No supplier sheet was prepared.</p>
                                <button className="admin-btn-secondary" onClick={fetchProducts}>Try Again</button>
                            </div>
                        ) : (
                            <>
                                <div className="admin-stats-grid">
                                    <div className="stat-card glass-panel"><h3>Catalog entries</h3><div className="stat-value">{products.length}</div></div>
                                    <div className="stat-card glass-panel"><h3>Recorded stock above zero</h3><div className="stat-value">{products.filter(p => Number(p.stock) > 0).length}</div></div>
                                    <div className="stat-card glass-panel"><h3>Missing images</h3><div className="stat-value">{products.filter(p => !p.image_url).length}</div></div>
                                    <div className="stat-card glass-panel"><h3>External image sources</h3><div className="stat-value">{new Set(products.map(p => getImageSource(p.image_url)).filter(source => source !== 'Missing' && source !== 'Fuji Card / local')).size}</div></div>
                                </div>
                                <p>Recorded stock is the database value. Supplier availability has not been verified in this dashboard.</p>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', margin: '1.5rem 0' }}>
                                    <button className="admin-btn-primary" onClick={exportSupplierReview} disabled={!products.length}>Download supplier review CSV</button>
                                    <button className="admin-btn-secondary" onClick={() => { setActiveTab('products'); handleEditClick({}); }}>Add a confirmed product</button>
                                    <input aria-label="Search supplier review products" placeholder="Search name, set or ID"
                                        value={supplierSearch} onChange={event => setSupplierSearch(event.target.value)}
                                        style={{ padding: '.65rem', minWidth: '220px', flex: 1 }} />
                                    <select aria-label="Filter image source" value={imageSourceFilter} onChange={event => setImageSourceFilter(event.target.value)} style={{ padding: '.65rem', minWidth: '190px' }}>
                                        <option value="all">All image sources</option>
                                        <option value="external">External images</option>
                                        <option value="local">Fuji Card / local</option>
                                        <option value="missing">Missing images</option>
                                    </select>
                                </div>
                                <p>The CSV includes each current image URL and source. Supplier SKU, confirmed quantity, cost, lead time, image permission and quote reference remain blank for the supplier to complete. New products start at zero stock until you enter a confirmed quantity.</p>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="admin-table" style={{ width: '100%' }}>
                                        <thead><tr><th>Image</th><th>Product</th><th>Image source</th><th>Set / language</th><th>Recorded stock</th><th>Listed price</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {products.filter(p => {
                                                const term = supplierSearch.trim().toLowerCase();
                                                const source = getImageSource(p.image_url);
                                                const matchesSource = imageSourceFilter === 'all' ||
                                                    (imageSourceFilter === 'external' && source !== 'Missing' && source !== 'Fuji Card / local') ||
                                                    (imageSourceFilter === 'local' && source === 'Fuji Card / local') ||
                                                    (imageSourceFilter === 'missing' && source === 'Missing');
                                                return matchesSource && (!term || [p.name, p.id, p.set_name, p.language, source].some(value => String(value || '').toLowerCase().includes(term)));
                                            }).slice(0, 40).map(product => (
                                                <tr key={product.id}>
                                                    <td>{product.image_url ? <img src={product.image_url} alt="" loading="lazy" style={{ width: 48, height: 64, objectFit: 'contain' }} /> : '—'}</td>
                                                    <td>{product.name}</td>
                                                    <td>{getImageSource(product.image_url)}</td>
                                                    <td>{product.set_name || '—'} / {product.language || '—'}</td>
                                                    <td>{product.stock}</td>
                                                    <td>£{Number(product.price).toFixed(2)}</td>
                                                    <td><button className="admin-btn-secondary" onClick={() => { setActiveTab('products'); handleEditClick(product); }}>Edit</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p>Showing up to 40 matches. The CSV includes the full catalog.</p>
                            </>
                        )}
                    </section>
                )}

                {!loading && activeTab === 'products' && !isEditing && (
                    <div>
                        <header className="admin-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1>Cards Management {selectedCategory ? `- ${selectedCategory.toUpperCase()}` : ''} {selectedSubCategory ? `| ${selectedSubCategory}` : ''}</h1>
                                {(selectedCategory || selectedSubCategory) && (
                                    <button className="admin-btn-secondary" style={{ marginTop: '0.5rem', padding: '0.3rem 1.2rem', fontSize: '0.9rem', fontWeight: 800 }} onClick={() => {
                                        if (selectedSubCategory) setSelectedSubCategory(null);
                                        else setSelectedCategory(null);
                                    }}>
                                        « BACK {selectedSubCategory ? 'TO CATEGORY' : 'TO ALL'}
                                    </button>
                                )}
                            </div>

                            {!isEditing && (
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div className="admin-search-wrapper" style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            placeholder="Global Card Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{
                                                padding: '0.6rem 1rem',
                                                paddingLeft: '2.5rem',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(255,255,255,0.05)',
                                                color: '#fff',
                                                width: '300px',
                                                outline: 'none',
                                                transition: 'all 0.2s',
                                                boxShadow: searchTerm ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'none'
                                            }}
                                            onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                                            onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                                        />
                                        <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                    {selectedCategory && (
                                        <button className="admin-btn-primary" onClick={() => handleEditClick({})}>+ Add {selectedCategory} Card</button>
                                    )}
                                </div>
                            )}
                        </header>

                        {!isEditing && !selectedCategory && !searchTerm && (
                            <div className="admin-category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                                {Array.isArray(categories) && categories.map(cat => (
                                    <div key={cat?.id || Math.random()} className="stat-card glass-panel" style={{ cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s', position: 'relative' }}
                                        onClick={() => setSelectedCategory(cat?.name || cat?.id)}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'none'}
                                    >
                                        <button
                                            onClick={(e) => handleDeleteCategory(e, cat?.id)}
                                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                                            title="Delete Category"
                                        >
                                            ×
                                        </button>
                                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📁</div>
                                        <h3 style={{ color: '#3b82f6', fontSize: '1.2rem', textTransform: 'uppercase' }}>{cat.name}</h3>
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                            {products.filter(p => (p.categories?.name || p.category_id || p.category_name) === cat.name || (p.categories?.id === cat.id)).length} Items
                                        </p>
                                    </div>
                                ))}

                                <div className="stat-card glass-panel" style={{ cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s', position: 'relative', border: '1px solid rgba(251, 191, 36, 0.3)' }}
                                    onClick={() => setSelectedCategory('LOW_STOCK')}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'none'}
                                >
                                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚡</div>
                                    <h3 style={{ color: '#fbbf24' }}>Low Stock (&lt;5)</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                        {products.filter(p => Number(p.stock) < 5 && Number(p.stock) > 0).length} Items
                                    </p>
                                </div>
                                
                                <div className="stat-card glass-panel" style={{ cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s', position: 'relative', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                    onClick={() => setSelectedCategory('SOLD_OUT')}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'none'}
                                >
                                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
                                    <h3 style={{ color: '#ef4444' }}>Sold Out</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                        {products.filter(p => Number(p.stock) === 0).length} Items
                                    </p>
                                </div>
                                <div className="stat-card glass-panel" style={{ cursor: 'pointer', textAlign: 'center', transition: 'background 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', border: '2px dashed rgba(255,255,255,0.1)' }}
                                    onClick={handleAddCategory}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '0.5rem' }}>+</div>
                                    <h3 style={{ color: '#94a3b8' }}>Add Category</h3>
                                </div>
                                {/* NEW SUBCATEGORY PICKER */}
                                {selectedCategory && subCatsMap[selectedCategory.toLowerCase()] && !selectedSubCategory && !searchTerm && (
                                    <div className="admin-subcategory-navigator" style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>Choose classification within {selectedCategory}</h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                            <div key="all-items" className="stat-card glass-panel" style={{ cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s', border: '2px solid rgba(59, 130, 246, 0.5)', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                                                onClick={() => setSelectedSubCategory('__ALL__')}
                                                onMouseOver={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'; }}
                                                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'; e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; }}
                                            >
                                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✨</div>
                                                <h3 style={{ fontSize: '1.1rem', color: '#60a5fa', fontWeight: 'bold' }}>View All</h3>
                                                <div style={{ padding: '0.3rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '0.75rem', color: '#60a5fa', marginTop: '1rem' }}>
                                                    {products.filter(p => (p.categories?.name || p.category_id || p.category_name) === selectedCategory).length} TOTAL
                                                </div>
                                            </div>
                                            {subCatsMap[selectedCategory.toLowerCase()].map(sc => (
                                                <div key={sc} className="stat-card glass-panel" style={{ cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                                                    onClick={() => setSelectedSubCategory(sc)}
                                                    onMouseOver={e => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)'}
                                                >
                                                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
                                                    <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>{sc}</h3>
                                                    <div style={{ padding: '0.3rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '0.75rem', color: '#60a5fa', marginTop: '1rem' }}>
                                                        {products.filter(p => p.cardType === sc).length} ASSETS
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {(selectedSubCategory || (selectedCategory && !subCatsMap[selectedCategory.toLowerCase()]) || searchTerm || selectedCategory === 'LOW_STOCK' || selectedCategory === 'SOLD_OUT') && !isEditing && (
                            <div className="admin-table-container glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                                {searchTerm && !selectedCategory && <h3 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#60a5fa' }}>Global Search Results</h3>}

                                {selectedCategory === 'LOW_STOCK' && (
                                    <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', alignItems: 'center', borderRadius: '8px 8px 0 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <h4 style={{ margin: 0, color: '#e2e8f0' }}>Low Stock Items - Restock Needed</h4>
                                        <input
                                            type="number"
                                            placeholder="Stock to add"
                                            value={bulkAllLowStock}
                                            onChange={e => setBulkAllLowStock(e.target.value)}
                                            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', width: '150px' }}
                                        />
                                        <button
                                            className="admin-btn-primary"
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                                            onClick={handleRestockAllLowStock}
                                        >
                                            Add Stock to All Low Stock Items
                                        </button>
                                    </div>
                                )}

                                {selectedCategory === 'SOLD_OUT' && (
                                    <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', alignItems: 'center', borderRadius: '8px 8px 0 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <h4 style={{ margin: 0, color: '#e2e8f0' }}>Bulk Stock Update</h4>
                                        <input
                                            type="number"
                                            placeholder="Stock to add"
                                            value={bulkStockAdd}
                                            onChange={e => setBulkStockAdd(e.target.value)}
                                            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', width: '150px' }}
                                        />
                                        <button
                                            className="admin-btn-primary"
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                                            onClick={handleBulkStockUpdate}
                                            disabled={selectedProducts.size === 0}
                                        >
                                            Add Stock to Selected ({selectedProducts.size})
                                        </button>
                                        <button
                                            className="admin-btn-secondary"
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                                            onClick={() => {
                                                const emptyProducts = products.filter(p => Number(p.stock) === 0);
                                                if (selectedProducts.size === emptyProducts.length) {
                                                    setSelectedProducts(new Set());
                                                } else {
                                                    setSelectedProducts(new Set(emptyProducts.map(p => p.id)));
                                                }
                                            }}
                                        >
                                            {selectedProducts.size > 0 ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                )}
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            {selectedCategory === 'SOLD_OUT' && <th>Select</th>}
                                            <th>Card Name</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.isArray(products) && products
                                            .filter(p => {
                                                if (!p) return false;
                                                if (searchTerm && !selectedCategory) return true; // Show all for global search
                                                if (selectedCategory === 'SOLD_OUT') return Number(p.stock) === 0;
                                                if (selectedCategory === 'LOW_STOCK') return Number(p.stock) < 5 && Number(p.stock) > 0;
                                                return (p.categories?.name || p.category_id || p.category_name) === selectedCategory;
                                            })
                                            .filter(p => {
                                                if (!selectedSubCategory || selectedSubCategory === '__ALL__') return true;
                                                return p.cardType === selectedSubCategory;
                                            })
                                            .filter(p => p?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()))
                                            .map(p => (
                                                <tr key={p.id}>
                                                    {selectedCategory === 'SOLD_OUT' && (
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedProducts.has(p.id)}
                                                                onChange={(e) => {
                                                                    const newSet = new Set(selectedProducts);
                                                                    if (e.target.checked) newSet.add(p.id);
                                                                    else newSet.delete(p.id);
                                                                    setSelectedProducts(newSet);
                                                                }}
                                                            />
                                                        </td>
                                                    )}
                                                    <td>{p.name}</td>
                                                    <td>{p.categories?.name || p.category_id}</td>
                                                    <td>£{Number(p.price).toFixed(2)}</td>
                                                    <td style={{ color: Number(p.stock) === 0 ? '#ef4444' : 'inherit', fontWeight: Number(p.stock) === 0 ? 'bold' : 'normal' }}>{p.stock}</td>
                                                    <td className="admin-table-actions">
                                                        <button onClick={() => handleEditClick(p)}>Edit</button>
                                                        <button className="danger" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        {products
                                            .filter(p => {
                                                if (searchTerm && !selectedCategory) return true;
                                                if (selectedCategory === 'SOLD_OUT') return Number(p.stock) === 0;
                                                if (selectedCategory === 'LOW_STOCK') return Number(p.stock) < 5 && Number(p.stock) > 0;
                                                return (p.categories?.name || p.category_id || p.category_name) === selectedCategory;
                                            })
                                            .filter(p => {
                                                if (!selectedSubCategory || selectedSubCategory === '__ALL__') return true;
                                                return p.cardType === selectedSubCategory;
                                            })
                                            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                                <tr>
                                                    <td colSpan={selectedCategory === 'SOLD_OUT' ? 6 : 5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No items found in this section.</td>
                                                </tr>
                                            )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {!loading && activeTab === 'users' && (
                    <div>
                        <header className="admin-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h1>Users Management</h1>
                            <button
                                onClick={handleDeleteAllUsers}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #ef4444',
                                    background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                    fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
                                }}
                            >
                                🗑 Delete All Users
                            </button>
                        </header>

                        <div className="admin-table-container glass-panel" style={{ marginTop: '2rem' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email Address</th>
                                        <th>Joined At</th>
                                        <th>Account Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersList.map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 'bold' }}>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <span style={{
                                                    padding: '0.3rem 0.6rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.85rem',
                                                    backgroundColor: u.is_banned ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                                    color: u.is_banned ? '#ef4444' : '#4ade80',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {u.is_banned ? 'Banned' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="admin-table-actions">
                                                <button
                                                    className={u.is_banned ? "admin-btn-secondary" : "danger"}
                                                    onClick={() => handleToggleBanUser(u.id, u.is_banned)}
                                                    style={u.is_banned ? { borderColor: '#4ade80', color: '#4ade80' } : {}}
                                                >
                                                    {u.is_banned ? 'Unban' : 'Ban'}
                                                </button>
                                                <button className="danger" onClick={() => handleDeleteUser(u.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {usersList.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No user records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loading && activeTab === 'orders' && (
                    <div>
                        <header className="admin-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h1>Orders & Payments Log</h1>
                            <button
                                onClick={handleDeleteAllOrders}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #ef4444',
                                    background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                    fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
                                }}
                            >
                                🗑 Delete All Orders
                            </button>
                        </header>

                        <div className="admin-table-container glass-panel" style={{ marginTop: '2rem' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order Number</th>
                                        <th>Customer</th>
                                        <th>Total Paid</th>
                                        <th>Date/Time</th>
                                        <th>Status</th>
                                        <th>Method</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ordersList.map(order => (
                                        <tr key={order.id} style={{ borderLeft: order.status === 'completed' ? '4px solid #4ade80' : '4px solid #facc15' }}>
                                            <td style={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#94a3b8' }}>{order.order_number}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{order.users ? order.users.username : 'Guest User'}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{order.users ? order.users.email : 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 'bold', color: '#fff' }}>{order.currency} {Number(order.total).toFixed(2)}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(order.created_at).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: order.status === 'completed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(250, 204, 21, 0.2)', color: order.status === 'completed' ? '#4ade80' : '#facc15' }}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: order.payment_method === 'crypto' || order.payment_method === 'cryptocurrency' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(167, 139, 250, 0.2)', color: order.payment_method === 'crypto' || order.payment_method === 'cryptocurrency' ? '#fbbf24' : '#a78bfa' }}>
                                                    {order.payment_method || 'card'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {ordersList.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No completed transactions yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loading && activeTab === 'settings' && (
                    <div>
                        <header className="admin-dashboard-header">
                            <h1>Payment Gateway Settings</h1>
                        </header>

                        {/* ── Paystack Config ─────────────────────────────── */}
                        <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '14px' }}>
                            <h2 style={{ margin: '0 0 1.25rem', color: '#00bbff', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Paystack_Logo.png" alt="Paystack" style={{ height: '20px' }} /> Paystack Gateway ({paystackConfig.currency || 'USD'})
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Public Key (Live)</label>
                                    <input
                                        type="text"
                                        value={paystackConfig.publicKey}
                                        onChange={e => setPaystackConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Secret Key (Live)</label>
                                    <input
                                        type="password"
                                        value={paystackConfig.secretKey}
                                        onChange={e => setPaystackConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Paystack Currency</label>
                                    <select
                                        value={paystackConfig.currency || 'USD'}
                                        onChange={e => setPaystackConfig(prev => ({ ...prev, currency: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
                                    >
                                        <option value="USD">USD - International</option>
                                        <option value="ZAR">ZAR - South Africa</option>
                                        <option value="NGN">NGN - Nigeria</option>
                                        <option value="GHS">GHS - Ghana</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                className="admin-btn-primary"
                                style={{ marginTop: '1.5rem', width: '200px' }}
                                onClick={handleSavePaystack}
                            >
                                Save Paystack Keys
                            </button>
                        </div>

                        {/* ── PayFast Config ─────────────────────────────── */}
                        <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '14px' }}>
                            <h2 style={{ margin: '0 0 1.25rem', color: '#ff4b4b', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/PayFast_logo.png" alt="PayFast" style={{ height: '20px' }} /> PayFast Gateway (ZAR)
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Merchant ID</label>
                                    <input
                                        type="text"
                                        value={payfastConfig.merchantId}
                                        onChange={e => setPayfastConfig(prev => ({ ...prev, merchantId: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Merchant Key</label>
                                    <input
                                        type="text"
                                        value={payfastConfig.merchantKey}
                                        onChange={e => setPayfastConfig(prev => ({ ...prev, merchantKey: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Passphrase</label>
                                    <input
                                        type="text"
                                        value={payfastConfig.passphrase}
                                        onChange={e => setPayfastConfig(prev => ({ ...prev, passphrase: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Process URL</label>
                                    <input
                                        type="text"
                                        value={payfastConfig.url}
                                        onChange={e => setPayfastConfig(prev => ({ ...prev, url: e.target.value }))}
                                        placeholder="https://www.payfast.co.za/eng/process"
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>
                            <button
                                className="admin-btn-primary"
                                style={{ marginTop: '1.5rem', width: '200px', backgroundColor: '#ff4b4b', border: 'none' }}
                                onClick={handleSavePayfast}
                            >
                                Save PayFast Settings
                            </button>
                        </div>

                        {/* ── Crypto Wallet Manager (Moved here) ──────────── */}
                        <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '14px' }}>
                            <h2 style={{ margin: '0 0 1.25rem', color: '#e2e8f0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontSize: '1.3rem' }}>₿</span> Crypto Wallet Manager
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: '-0.75rem' }}>
                                Wallet settings are not used by the current order-request checkout. Verify ownership before enabling any crypto payment flow.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                                {Object.entries(cryptoWallets).map(([symbol, w]) => (
                                    <div key={symbol} style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${w.color}33`, borderRadius: '12px', padding: '1.25rem' }}>
                                        {/* Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: w.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '0.7rem' }}>{symbol.slice(0, 2)}</div>
                                            <span style={{ color: w.color, fontWeight: 700, fontSize: '1rem' }}>{w.label} ({symbol})</span>
                                        </div>

                                        {/* Current QR preview */}
                                        {w.qrFile && (
                                            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                                                <img src={`/${w.qrFile}`} alt={`${symbol} QR`}
                                                    style={{ width: '90px', height: '90px', borderRadius: '8px', border: `2px solid ${w.color}55`, objectFit: 'cover' }}
                                                    onError={e => e.target.style.display = 'none'}
                                                />
                                            </div>
                                        )}

                                        {/* Upload new QR */}
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>Upload New QR Code</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    const formData = new FormData();
                                                    formData.append('qr', file);
                                                    formData.append('coin', symbol.toLowerCase());
                                                    const token = localStorage.getItem('adminToken');
                                                    try {
                                                        await axios.post(`${API_URL}/admin/crypto-wallets/qr`, formData, {
                                                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                                                        });
                                                        setCryptoWallets(prev => ({ ...prev, [symbol]: { ...prev[symbol], qrFile: `${symbol.toLowerCase()}-qr.png?t=${Date.now()}` } }));
                                                        alert(`${symbol} QR code updated!`);
                                                    } catch (err) {
                                                        alert('QR upload failed: ' + (err.response?.data?.error || err.message));
                                                    }
                                                }}
                                                style={{ fontSize: '0.78rem', color: '#94a3b8', width: '100%' }}
                                            />
                                        </div>

                                        {/* Wallet Address */}
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>Wallet Address</label>
                                            <input
                                                type="text"
                                                value={w.address}
                                                onChange={e => setCryptoWallets(prev => ({ ...prev, [symbol]: { ...prev[symbol], address: e.target.value } }))}
                                                style={{ width: '100%', padding: '0.5rem 0.7rem', background: 'rgba(255,255,255,0.05)', border: `1px solid ${w.color}33`, borderRadius: '6px', color: '#f1f5f9', fontSize: '0.75rem', fontFamily: 'monospace', boxSizing: 'border-box' }}
                                            />
                                        </div>

                                        {/* Trust Wallet Link */}
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>Trust Wallet Deep Link</label>
                                            <input
                                                type="text"
                                                value={w.trustLink}
                                                onChange={e => setCryptoWallets(prev => ({ ...prev, [symbol]: { ...prev[symbol], trustLink: e.target.value } }))}
                                                style={{ width: '100%', padding: '0.5rem 0.7rem', background: 'rgba(255,255,255,0.05)', border: `1px solid ${w.color}33`, borderRadius: '6px', color: '#f1f5f9', fontSize: '0.75rem', fontFamily: 'monospace', boxSizing: 'border-box' }}
                                            />
                                        </div>

                                        {/* Save button */}
                                        <button
                                            onClick={async () => {
                                                const token = localStorage.getItem('adminToken');
                                                try {
                                                    await axios.put(`${API_URL}/admin/crypto-wallets/${symbol}`, { address: w.address, trustLink: w.trustLink }, {
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    });
                                                    alert(`${symbol} wallet details saved!`);
                                                } catch (err) {
                                                    alert('Save failed: ' + (err.response?.data?.error || err.message));
                                                }
                                            }}
                                            style={{ width: '100%', padding: '0.55rem', background: `${w.color}22`, border: `1px solid ${w.color}66`, borderRadius: '8px', color: w.color, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                                        >
                                            💾 Save {symbol} Changes
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
