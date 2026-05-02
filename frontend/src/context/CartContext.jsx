import React, { createContext, useState, useEffect, useCallback } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // 1. Initialize cart from localStorage
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('pinkEditCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 2. Automatically save to localStorage whenever cartItems change
  useEffect(() => {
    localStorage.setItem('pinkEditCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // --- NEW: THE SYNC ENGINE ---
  const syncCartWithServer = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return;

    try {
      const response = await fetch('http://127.0.0.1:5000/api/cart/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ localItems: cartItems }) // Send local items to merge
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cartItems); // Overwrite local with the unified Master Cart
      }
    } catch (error) {
      console.error("Failed to sync cart:", error);
    }
  }, [cartItems]);

  // Run a background sync automatically if they refresh the page while logged in
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      syncCartWithServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // --- NEW: LOGOUT CLEANUP ---
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('pinkEditCart');
  };

  const addToCart = async (product) => {
    let newCartState;
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id && item.size === product.size);
      
      if (existingItem) {
        newCartState = prevItems.map(item => 
          (item.id === product.id && item.size === product.size) 
            ? { ...item, qty: item.qty + product.qty } 
            : item
        );
      } else {
        newCartState = [...prevItems, product];
      }
      return newCartState;
    });

    // If logged in, quietly update the database in the background
    const token = localStorage.getItem('userToken');
    if (token && newCartState) {
      fetch('http://127.0.0.1:5000/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ localItems: newCartState })
      }).catch(err => console.error("Background sync failed", err));
    }
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.qty), 0);

  return (
    <CartContext.Provider value={{ cartItems, isCartOpen, toggleCart, addToCart, cartTotal, syncCartWithServer, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}