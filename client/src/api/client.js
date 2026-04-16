import axios from 'axios';

const api = axios.create({
  // Vite uses import.meta.env for environment variables
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export default api;