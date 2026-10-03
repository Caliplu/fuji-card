import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: '0.00' });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Show the last server-confirmed cart while the current one loads.
  const getLocalCart = useCallback(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fuji_local_cart') || 'null');
      if (!Array.isArray(saved?.items)) throw new Error('Invalid stored cart');
      const items = saved.items.filter(item => !String(item.id).startsWith('local_'));
      const subtotal = items.reduce((sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0), 0);
      return { ...saved, items, itemCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0), subtotal: subtotal.toFixed(2) };
    } catch {
      return { items: [], itemCount: 0, subtotal: '0.00' };
    }
  }, []);

  const saveLocalCart = (cartData) => {
    localStorage.setItem('fuji_local_cart', JSON.stringify(cartData));
  };

  // Generate session ID for guest cart
  useEffect(() => {
    if (!localStorage.getItem('token') && !/^guest_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(localStorage.getItem('sessionId') || '')) {
      localStorage.setItem('sessionId', `guest_${crypto.randomUUID()}`);
    }
    // Initialize cart from local storage for instant UI visibility
    setCart(getLocalCart());
  }, [getLocalCart, isAuthenticated]);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cartAPI.get();
      setCart(response.data);
      saveLocalCart(response.data); // Keep local sync'd with server
    } catch (error) {
      console.warn('API Cart failed, using local fallback:', error);
      setCart(getLocalCart());
    } finally {
      setLoading(false);
    }
  }, [getLocalCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, isAuthenticated]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await cartAPI.add(productId, quantity);
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      setLoading(true);
      await cartAPI.update(itemId, quantity);
      await fetchCart();
    } catch (error) {
      console.error('Failed to update cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);
      await cartAPI.remove(itemId);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await cartAPI.clear();
      await fetchCart();
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart: fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
