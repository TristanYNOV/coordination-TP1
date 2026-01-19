export const authTokenKey = 'authToken';

export const getStoredAuthToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(authTokenKey);
};

export const setStoredAuthToken = (token: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(authTokenKey, token);
};

export const clearStoredAuthToken = () => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(authTokenKey);
};

export const buildAuthHeaders = () => {
  const token = getStoredAuthToken();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};
