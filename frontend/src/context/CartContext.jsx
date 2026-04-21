import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // 1. Initialize cart from localStorage, or default to an empty array
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('pinkEditCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 2. Automatically save to localStorage whenever cartItems change
  useEffect(() => {
    localStorage.setItem('pinkEditCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id && item.size === product.size);
      
      if (existingItem) {
        return prevItems.map(item => 
          (item.id === product.id && item.size === product.size) 
            ? { ...item, qty: item.qty + product.qty } 
            : item
        );
      }
      return [...prevItems, product];
    });
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.qty), 0);

  return (
    <CartContext.Provider value={{ cartItems, isCartOpen, toggleCart, addToCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}