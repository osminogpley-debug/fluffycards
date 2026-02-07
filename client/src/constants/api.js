const getApiBaseUrl = () => {
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const FILE_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    ME: `${API_BASE_URL}/auth/me`
  },
  DATA: {
    STATS: `${API_BASE_URL}/stats/dashboard`,
    STATS_SESSION: `${API_BASE_URL}/stats/session`,
    SETS: `${API_BASE_URL}/sets`,
    FOLDERS: `${API_BASE_URL}/folders`,
    HEALTH: `${API_BASE_URL}/health`
  },
  GAMIFICATION: `${API_BASE_URL}/gamification`,
  SOCIAL: `${API_BASE_URL}/social`,
  LIVE: `${API_BASE_URL}/live`,
  ADMIN: `${API_BASE_URL}/admin`
};

// Helper function for authenticated requests
export const authFetch = (url, options = {}) => {
  // Get token from localStorage as fallback for cookie issues (LAN play)
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers
  };
  
  // Add token to header if available (for cross-origin/LAN requests)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
};

// Store token after login (for LAN play compatibility)
export const storeToken = (token) => {
  localStorage.setItem('token', token);
};

// Clear token on logout
export const clearToken = () => {
  localStorage.removeItem('token');
};
