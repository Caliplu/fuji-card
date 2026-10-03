import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';
import Header from './components/Header';
import AuthHeader from './components/AuthHeader';
import Footer from './components/Footer';
import Home from './pages/Home';
import './App.css';
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Account = lazy(() => import('./pages/Account'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const PaymentMethodsPage = lazy(() => import('./pages/PaymentMethods'));
const Info = lazy(() => import('./pages/Info'));
const AdminAuth = lazy(() => import('./pages/AdminAuth'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Contact = lazy(() => import('./pages/Contact'));

// Component to conditionally render header and footer
const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/secret-fuji-admin');
  const showFooter = location.pathname === '/' && !isAdminPage;

  useEffect(() => {
    if (isAdminPage) {
      document.body.classList.add('admin-page-body');
    } else {
      document.body.classList.remove('admin-page-body');
    }
  }, [isAdminPage]);

  return (
    <div className={`app ${isAdminPage ? 'admin-app' : ''}`}>
      {!isAdminPage && (isAuthPage ? <AuthHeader /> : <Header />)}
      <main className={`main-content ${isAuthPage ? 'auth-main-content' : ''} ${isAdminPage ? 'admin-main-content' : ''}`}>
        <Suspense fallback={<div className="route-loading" role="status">Loading page...</div>}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<Account />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          <Route path="/payment-methods" element={<PaymentMethodsPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/info" element={<Info />} />
          <Route path="/secret-fuji-admin" element={<AdminAuth />} />
          <Route path="/secret-fuji-admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
      </main>

      {showFooter && !isAdminPage && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
