import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  club?: string; // Club ID for club managers
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  studentId?: string;
  userType: string;
  club?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('http://localhost:5001/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
          setIsAuthenticated(true);
          localStorage.setItem('userId', response.data._id);
        } catch (error) {
          console.error('Error checking auth:', error);
          logout();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const register = async (data: RegisterData) => {
    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user._id);
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password
      });
      
      const { token, user } = response.data;
      if (!token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user._id);
      setUser(user);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid email or password');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      }
      throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        logout,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 