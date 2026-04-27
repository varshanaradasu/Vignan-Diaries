import axios from 'axios';
import { API_URL, getToken } from './lib/auth';

export const api = axios.create({
  baseURL: `${String(API_URL).replace(/\/$/, '')}/api`,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
