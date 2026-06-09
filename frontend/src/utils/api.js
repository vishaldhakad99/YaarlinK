import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const store = JSON.parse(localStorage.getItem('yaarlink-store') || '{}');
  const token = store?.state?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const store = JSON.parse(localStorage.getItem('yaarlink-store') || '{}');
        const refreshToken = store?.state?.refreshToken;
        if (refreshToken) {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          const { accessToken } = res.data;
          const parsed = JSON.parse(localStorage.getItem('yaarlink-store') || '{}');
          parsed.state.accessToken = accessToken;
          localStorage.setItem('yaarlink-store', JSON.stringify(parsed));
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        }
      } catch (e) {
        localStorage.removeItem('yaarlink-store');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
