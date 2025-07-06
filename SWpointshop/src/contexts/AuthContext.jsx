import { useState, useEffect, createContext, useCallback } from 'react';
import axios from 'axios';
import { useQueryClient } from 'react-query';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();
  const [refreshInterval, setRefreshInterval] = useState(null);

  const clearAuthState = useCallback(() => {
    const currentUser = user;
    if (currentUser) {
      // Remove user-specific cart data
      localStorage.removeItem(`cart_${currentUser.id}`);
    }
    
    localStorage.removeItem('token');
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    setUser(null);
    setError(null);
    queryClient.clear();
    queryClient.resetQueries();
  }, [refreshInterval, queryClient, user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      return;
    }

    const interval = setInterval(() => {
      fetchUser(token);
    }, 30000); // Refresh every 30 seconds instead of 10
    
    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user]);

  const fetchUser = async (token) => {
    try {
      setError(null);
      const response = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data) {
        throw new Error('No user data received');
      }

      // Ensure numeric values are properly formatted
      const userData = {
        ...response.data,
        points: Number(response.data.points || 0),
        balance: Number(response.data.balance || 0)
      };

      setUser(userData);
      queryClient.setQueryData(['user', userData.id], userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch user data';
      setError(errorMessage);

      if (error.response?.status === 401 || error.response?.status === 404) {
        clearAuthState();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/users/login', {
        email,
        password
      });

      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid response from server');
      }

      const { token, user } = response.data;
      
      // Clear any existing state and cart data
      clearAuthState();
      
      // Set up new session
      localStorage.setItem('token', token);
      const userData = {
        ...user,
        points: Number(user.points || 0),
        balance: Number(user.balance || 0)
      };
      
      setUser(userData);
      queryClient.setQueryData(['user', userData.id], userData);
      queryClient.invalidateQueries();
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/users/register', {
        username,
        email,
        password
      });
      
      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid response from server');
      }

      const { token, user } = response.data;
      
      // Clear any existing state
      clearAuthState();
      
      // Set up new session
      localStorage.setItem('token', token);
      const userData = {
        ...user,
        points: Number(user.points || 0),
        balance: Number(user.balance || 0)
      };
      
      setUser(userData);
      queryClient.setQueryData(['user', userData.id], userData);
      queryClient.invalidateQueries();
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updatePoints = async (newPoints) => {
    if (!user) return;

    try {
      setUser(prev => ({
        ...prev,
        points: Number(newPoints)
      }));

      queryClient.setQueryData(['user', user.id], {
        ...user,
        points: Number(newPoints)
      });

      queryClient.invalidateQueries('pointsHistory');
      queryClient.invalidateQueries('orders');
      queryClient.invalidateQueries(['user', user.id]);

      const token = localStorage.getItem('token');
      if (token) {
        await fetchUser(token);
      }
    } catch (error) {
      console.error('Error updating points:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update points';
      setError(errorMessage);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout: clearAuthState,
    updatePoints,
    refreshUser: () => {
      const token = localStorage.getItem('token');
      if (token) fetchUser(token);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 