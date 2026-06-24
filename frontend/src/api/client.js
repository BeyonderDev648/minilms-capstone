import axios from 'axios';

// Vite exposes env vars prefixed with VITE_ to the client at build time.
// Set VITE_API_URL in .env (locally) and in your hosting platform's
// environment variables (when deployed) to point at your live backend.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

// Attach the JWT to every request automatically, if we have one stored.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('minilms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever says the token is invalid/expired, clear it so the
// app falls back to a logged-out state instead of looping on broken requests.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('minilms_token');
      localStorage.removeItem('minilms_user');
    }
    return Promise.reject(error);
  }
);

export default api;
