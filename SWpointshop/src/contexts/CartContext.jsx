import { createContext, useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import useAuth from '../hooks/useAuth';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Load cart data when user changes
  useEffect(() => {
    if (user) {
      const savedCart = localStorage.getItem(`cart_${user.id}`);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      } else {
        setCartItems([]);
      }
    } else {
      // Clear cart when no user is logged in
      setCartItems([]);
    }
  }, [user]);

  const saveCart = (items) => {
    if (user) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(items));
      setCartItems(items);
      // Invalidate product queries when cart changes
      queryClient.invalidateQueries('products');
      queryClient.invalidateQueries('featuredProducts');
    }
  };

  const addToCart = (product, quantity = 1, usePoints = false) => {
    if (!user) return; // Prevent adding to cart if not logged in

    const existingItem = cartItems.find(
      item => item.id === product.id && item.usePoints === usePoints
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      const newItems = cartItems.map(item =>
        item.id === product.id && item.usePoints === usePoints
          ? { ...item, quantity: newQuantity }
          : item
      );
      saveCart(newItems);
    } else {
      saveCart([...cartItems, { ...product, quantity, usePoints }]);
    }
  };

  const updateQuantity = (productId, quantity, usePoints = false) => {
    if (!user) return; // Prevent updates if not logged in

    if (quantity <= 0) {
      removeFromCart(productId, usePoints);
      return;
    }

    const newItems = cartItems.map(item =>
      item.id === productId && item.usePoints === usePoints
        ? { ...item, quantity }
        : item
    );
    saveCart(newItems);
  };

  const removeFromCart = (productId, usePoints = false) => {
    if (!user) return; // Prevent removal if not logged in

    const newItems = cartItems.filter(
      item => !(item.id === productId && item.usePoints === usePoints)
    );
    saveCart(newItems);
  };

  const clearCart = () => {
    if (user) {
      localStorage.removeItem(`cart_${user.id}`);
    }
    setCartItems([]);
    // Invalidate product queries when cart is cleared
    queryClient.invalidateQueries('products');
    queryClient.invalidateQueries('featuredProducts');
  };

  const getCartTotal = () => {
    return cartItems
      .filter(item => !item.usePoints)
      .reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getPointsTotal = () => {
    return cartItems
      .filter(item => item.usePoints)
      .reduce((total, item) => total + (item.points_price * item.quantity), 0);
  };

  const getRewardPoints = () => {
    return cartItems
      .filter(item => !item.usePoints)
      .reduce((total, item) => total + item.points_reward * item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getPointsTotal,
    getRewardPoints
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}; 