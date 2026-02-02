import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../constants/api';

function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = `http://${window.location.hostname}:5001/api/auth/me`;
      const response = await authFetch(apiUrl);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      setUser(data.user || null);
      setRole(data.user?.role || 'student');
    } catch (error) {
      setError(error.message);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      const logoutUrl = `http://${window.location.hostname}:5001/api/auth/logout`;
      await fetch(logoutUrl, {
        credentials: 'include'
      });
    } finally {
      setUser(null);
      setRole(null);
      navigate('/');
    }
  };

  // Check auth on mount and set up polling
  useEffect(() => {
    checkAuth();
    const interval = setInterval(checkAuth, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [checkAuth]);

  return { user, role, logout };
}

export default useAuth;
