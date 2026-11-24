import React, { createContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../lib/api';

export const CartContext = createContext();

export const FREE_SHIPPING_THRESHOLD = 25000;

export function CartProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('pinkEditCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem('pinkEditWishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('pinkEditCart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('pinkEditWishlist', JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  const toggleCart = () => setIsCartOpen((prev) => !prev);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const pushCartState = useCallback((items, replace = true) => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/cart/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ localItems: items, replace }),
    }).catch((err) => console.error('Background cart sync failed:', err));
  }, []);

  const syncCartWithServer = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ localItems: cartItems, replace: false }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.cartItems)) {
          setCartItems(data.cartItems);
        }
      }
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  }, [cartItems]);

  const syncWishlist = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const products = await res.json();
        if (Array.isArray(products)) {
          setWishlistIds(products.map((p) => p.id));
        }
      }
    } catch (err) {
      console.error('Wishlist sync failed:', err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      syncCartWithServer();
      syncWishlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('pinkEditCart');
    pushCartState([], true);
  };

  const matchItem = (a, b) =>
    a.id === b.id && (a.variantId || a.size || 'Standard') === (b.variantId || b.size || 'Standard');

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => matchItem(item, product));
      const updated = existing
        ? prevItems.map((item) =>
            matchItem(item, product) ? { ...item, qty: item.qty + (product.qty || 1) } : item
          )
        : [...prevItems, { ...product, qty: product.qty || 1 }];

      pushCartState(updated, true);
      return updated;
    });
  };

  const updateQuantity = (itemTarget, delta) => {
    setCartItems((prevItems) => {
      const updated = prevItems
        .map((item) =>
          matchItem(item, itemTarget) ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0);
      pushCartState(updated, true);
      return updated;
    });
  };

  const removeFromCart = (itemTarget) => {
    setCartItems((prevItems) => {
      const updated = prevItems.filter((item) => !matchItem(item, itemTarget));
      pushCartState(updated, true);
      return updated;
    });
  };

  const toggleWishlist = async (productId) => {
    const alreadySaved = wishlistIds.includes(productId);
    const nextIds = alreadySaved
      ? wishlistIds.filter((id) => id !== productId)
      : [...wishlistIds, productId];
    setWishlistIds(nextIds);

    const token = localStorage.getItem('userToken');
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/wishlist/${productId}`, {
          method: alreadySaved ? 'DELETE' : 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Wishlist update error:', err);
      }
    }
    return !alreadySaved;
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.qty, 0);
  const cartCount = cartItems.reduce((total, item) => total + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        toggleCart,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        cartTotal,
        cartCount,
        syncCartWithServer,
        clearCart,
        wishlistIds,
        toggleWishlist,
        syncWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}