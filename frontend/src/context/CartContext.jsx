import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    if (!token) {
      setCart({ items: [], totalAmount: 0 });
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data.success && res.data.cart) {
        setCart(res.data.cart);
      }
    } catch (err) {
      console.error('[Cart Error] Could not fetch cart:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add item to cart
  const addToCart = async (productId, qty = 1) => {
    if (!token) {
      throw new Error('Please login to add items to your cart');
    }
    const res = await api.post('/cart', { productId, qty });
    if (res.data.success) {
      setCart(res.data.cart);
      return res.data.message;
    }
  };

  // Update item quantity
  const updateQty = async (itemId, qty) => {
    if (!token) return;
    const res = await api.put(`/cart/${itemId}`, { qty });
    if (res.data.success) {
      setCart(res.data.cart);
    }
  };

  // Remove item
  const removeFromCart = async (itemId) => {
    if (!token) return;
    const res = await api.delete(`/cart/${itemId}`);
    if (res.data.success) {
      setCart(res.data.cart);
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!token) return;
    const res = await api.delete('/cart');
    if (res.data.success) {
      setCart({ items: [], totalAmount: 0 });
    }
  };

  const itemCount = cart.items
    ? cart.items.reduce((acc, item) => acc + item.qty, 0)
    : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
