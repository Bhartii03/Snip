import axios from 'axios';

// This automatically attaches the base URL to every request we make
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export default api;