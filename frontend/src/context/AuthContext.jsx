import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(() => {
    const saved = localStorage.getItem('currentOrg');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUserData = async () => {
    try {
      const [userRes, orgsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/organizations'),
      ]);

      setUser(userRes.data);
      localStorage.setItem('user', JSON.stringify(userRes.data));

      const orgs = orgsRes.data || [];
      setOrganizations(orgs);

      // Auto-select first org if none selected or invalid
      if (orgs.length > 0) {
        const savedOrg = localStorage.getItem('currentOrg');
        let selected = orgs[0];
        if (savedOrg) {
          const parsed = JSON.parse(savedOrg);
          const found = orgs.find((o) => o._id === parsed._id);
          if (found) selected = found;
        }
        selectOrganization(selected);
      }
    } catch (err) {
      console.error('Failed to load user or tenant context', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
    toast.success(`Welcome back, ${userData.firstName}!`);
    return res;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { token, user: newUser } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(token);
    setUser(newUser);
    toast.success('Account created successfully!');
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentOrg');
    localStorage.removeItem('currentTenant');
    setToken(null);
    setUser(null);
    setCurrentOrg(null);
    setOrganizations([]);
    toast.success('Logged out successfully');
  };

  const selectOrganization = (org) => {
    setCurrentOrg(org);
    localStorage.setItem('currentOrg', JSON.stringify(org));
    localStorage.setItem('currentTenant', org.slug);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        organizations,
        currentOrg,
        loading,
        login,
        register,
        logout,
        selectOrganization,
        refreshOrganizations: loadUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

