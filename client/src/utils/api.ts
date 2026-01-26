import axios from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't automatically redirect on 401 - let components handle auth flow
    console.log('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// API functions
export const apiClient = {
  // Health check
  health: () => api.get<ApiResponse>('/health'),
  
  // Test endpoint
  hello: () => api.get<ApiResponse>('/hello'),
  
  // Authentication endpoints
  auth: {
    me: () => {
      // Auth endpoints are at /auth, not /api/auth
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      return axios.get<ApiResponse>(`${baseUrl}/auth/me`, { withCredentials: true });
    },
    logout: () => {
      // Auth endpoints are at /auth, not /api/auth
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      return axios.post<ApiResponse>(`${baseUrl}/auth/logout`, {}, { withCredentials: true });
    },
  },
  
  // User endpoints (to be implemented)
  user: {
    getProfile: () => api.get<ApiResponse>('/user/me'),
    updateProfile: (data: any) => api.put<ApiResponse>('/user/profile', data),
    onboard: (data: any) => api.post<ApiResponse>('/user/onboard', data),
    checkDuplicate: (rNumber: string) => api.post<ApiResponse>('/user/check-duplicate', { rNumber }),
    linkAccount: (token: string, password?: string) => api.post<ApiResponse>('/user/link-account', { token, password }),
    resetForLinking: (email: string) => api.post<ApiResponse>('/user/reset-for-linking', { email }),
  },
  
  // File upload endpoints (to be implemented)
  files: {
    uploadProfilePicture: (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);
      return api.post<ApiResponse>('/files/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    uploadResume: (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      return api.post<ApiResponse>('/files/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },
};

// Legacy API call function for backward compatibility
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export default api;