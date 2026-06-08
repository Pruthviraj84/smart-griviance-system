// Authentication utilities and helpers

// Validation helpers
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

export const validatePhone = (phone) => {
  const re = /^[0-9]{10}$/;
  return re.test(phone.replace(/\D/g, ''));
};

// Token helpers
export const getToken = () => localStorage.getItem('authToken');
export const getUser = () => {
  const user = localStorage.getItem('authUser');
  return user ? JSON.parse(user) : null;
};

export const setAuth = (token, user) => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('authUser', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
};

export const isAuthenticated = () => !!getToken();

export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API helpers
export const apiCall = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Read as text first — avoids "Unexpected token" crash when server returns HTML
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Server returned non-JSON (HTML error page, proxy error, etc.)
    console.error('[apiCall] Non-JSON response from', url, '→', text.slice(0, 200));
    throw new Error(`Server returned an unexpected response (not JSON). Status: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(data.message || 'API Error');
  }
  return data;
};

// Form validation helper
export const validateForm = (form, required = []) => {
  const errors = {};
  
  required.forEach((field) => {
    if (!form[field]) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
    }
  });

  if (form.email && !validateEmail(form.email)) {
    errors.email = 'Invalid email format.';
  }

  if (form.password && !validatePassword(form.password)) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (form.phone && !validatePhone(form.phone)) {
    errors.phone = 'Phone must be 10 digits.';
  }

  return errors;
};
