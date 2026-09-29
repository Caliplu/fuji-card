import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { products as localProductStore } from '../data/products';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: '0.00' });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load from local storage for high-impact fallback persistence
  const getLocalCart = useCallback(() => {
    const local = localStorage.getItem('fuji_local_cart');
    let cartData = local ? JSON.parse(local) : { items: [], itemCount: 0, subtotal: '0.00' };
    
    // RE-SYNC Product Info to Ensure Images/Prices are Correct in Fallback
    if (cartData.items.length > 0) {
      cartData.items = cartData.items.map(item => {
        const fullProd = localProductStore.find(p => p.id === item.productId);
        if (fullProd) {
          return {
            ...item,
            product: {
              ...fullProd,
              image_url: fullProd.image // Map frontend field to expected API field
            }
          };
        }
        return item;
      });
      
      const sub = cartData.items.reduce((sum, i) => sum + (parseFloat(i.product?.price || 0) * i.quantity), 0);
      cartData.subtotal = sub.toFixed(2);
      cartData.itemCount = cartData.items.reduce((sum, i) => sum + i.quantity, 0);
    }
    
    return cartData;
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
      console.log('Adding to cart - Product ID:', productId, 'Quantity:', quantity);
      
      // Try server first
      try {
        await cartAPI.add(productId, quantity);
        await fetchCart();
      } catch (apiError) {
        console.warn('Server Add failed, implementing high-fidelity local persistence fallback');
        const currentLocal = getLocalCart();
        
        // Find if item exists in local cart
        const existingIndex = currentLocal.items.findIndex(item => item.productId === productId);
        const productInfo = localProductStore.find(p => p.id === productId);
        
        if (existingIndex > -1) {
          currentLocal.items[existingIndex].quantity += quantity;
        } else {
          currentLocal.items.push({
            id: `local_${Date.now()}_${productId}`,
            productId: productId,
            quantity: quantity,
            product: productInfo ? { ...productInfo, image_url: productInfo.image } : { id: productId, name: 'Product', price: 0 }
          });
        }
        
        const sub = currentLocal.items.reduce((sum, i) => sum + (parseFloat(i.product?.price || 0) * i.quantity), 0);
        currentLocal.subtotal = sub.toFixed(2);
        currentLocal.itemCount = currentLocal.items.reduce((sum, item) => sum + item.quantity, 0);
        
        setCart({...currentLocal});
        saveLocalCart(currentLocal);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      setLoading(true);
      try {
        await cartAPI.update(itemId, quantity);
      } catch (e) {
        const local = getLocalCart();
        const item = local.items.find(i => i.id === itemId);
        if (item) {
          if (quantity <= 0) local.items = local.items.filter(i => i.id !== itemId);
          else item.quantity = quantity;
          
          const sub = local.items.reduce((sum, i) => sum + (parseFloat(i.product?.price || 0) * i.quantity), 0);
          local.subtotal = sub.toFixed(2);
          local.itemCount = local.items.reduce((sum, i) => sum + i.quantity, 0);
          
          setCart({...local});
          saveLocalCart(local);
        }
      }
      await fetchCart();
    } catch (error) {
      console.error('Failed to update cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);
      try {
        await cartAPI.remove(itemId);
      } catch (e) {
        const local = getLocalCart();
        local.items = local.items.filter(i => i.id !== itemId);
        
        const sub = local.items.reduce((sum, i) => sum + (parseFloat(i.product?.price || 0) * i.quantity), 0);
        local.subtotal = sub.toFixed(2);
        local.itemCount = local.items.reduce((sum, i) => sum + i.quantity, 0);
        
        setCart({...local});
        saveLocalCart(local);
      }
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      try {
        await cartAPI.clear();
      } catch (e) {
        const cleared = { items: [], itemCount: 0, subtotal: '0.00' };
        setCart(cleared);
        saveLocalCart(cleared);
      }
      await fetchCart();
    } catch (error) {
      console.error('Failed to clear cart:', error);
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
