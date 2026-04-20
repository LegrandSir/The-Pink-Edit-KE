import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

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