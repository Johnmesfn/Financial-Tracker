import React, { createContext, useContext, useReducer, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isLoading: false,
        isRateLimited: false,
      };
    case "REGISTER":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isLoading: false,
        isRateLimited: false,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        isRateLimited: false,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_RATE_LIMITED":
      return {
        ...state,
        isRateLimited: action.payload,
        isLoading: false,
      };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    isLoading: true,
    isRateLimited: false,
  });

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Set auth header
          api.defaults.headers.common['x-auth-token'] = token;
          
          // Get user data
          const res = await api.get('/auth/me');
          dispatch({ type: 'LOGIN', payload: res.data.data });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        if (err.response?.status === 429) {
          // Rate limited
          dispatch({ type: 'SET_RATE_LIMITED', payload: true });
        } else {
          localStorage.removeItem('token');
          delete api.defaults.headers.common['x-auth-token'];
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await api.post('/auth/login', { email, password });
      
      // Save token to localStorage
      localStorage.setItem('token', res.data.token);
      
      // Set auth header
      api.defaults.headers.common['x-auth-token'] = res.data.token;
      
      // Get user data
      const userRes = await api.get('/auth/me');
      dispatch({ type: 'LOGIN', payload: userRes.data.data });
      
      return { success: true };
    } catch (err) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await api.post('/auth/register', { name, email, password });
      
      // Save token to localStorage
      localStorage.setItem('token', res.data.token);
      
      // Set auth header
      api.defaults.headers.common['x-auth-token'] = res.data.token;
      
      // Get user data
      const userRes = await api.get('/auth/me');
      dispatch({ type: 'REGISTER', payload: userRes.data.data });
      
      return { success: true };
    } catch (err) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { 
        success: false, 
        message: err.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove auth header
    delete api.defaults.headers.common['x-auth-token'];
    
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    ...state,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};