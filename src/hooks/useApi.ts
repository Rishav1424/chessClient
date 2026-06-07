import { useState, useCallback } from 'react';
import axios, { AxiosError, type AxiosRequestConfig, type Method } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router';

// Define the base URL for your Spring Boot Monolith
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

interface UseApiState {
  data: unknown;
  error: string | null;
  loading: boolean;
}

export default () => {
  const token = useAuthStore(state => state.token);
  const logout = useAuthStore(state => state.logout);
  const [state, setState] = useState<UseApiState>({
    data: null,
    error: null,
    loading: false,
  });
  const navigate = useNavigate();

  const request = useCallback(
    async <T>(
      method: Method,
      url: string,
      payload?: unknown,
      config?: AxiosRequestConfig
    ): Promise<T | null> => {
      setState({ data: null, error: null, loading: true });

      try {
        const response = await axios({
          method,
          url: `${BASE_URL}${url}`,
          data: payload,
          ...config,
          headers: {
            ...config?.headers,
            // Automatically inject the Bearer token if it exists
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });

        setState({ data: response.data, error: null, loading: false });
        return response.data;
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        if (axiosError.response?.status === 401) {
          logout();
          navigate("/login");
          return null;
        }
        const errorMessage =
          axiosError.response?.data?.message || 'An unexpected error occurred';

        setState({ data: null, error: errorMessage, loading: false });
        return null;
      }
    },
    [token]
  );

  // Helper wrappers for common methods
  const get = useCallback(
    <T>(url: string, config?: AxiosRequestConfig) => request<T>('GET', url, null, config),
    [request]
  );

  const post = useCallback(
    <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => request<T>('POST', url, data, config),
    [request]
  );

  const put = useCallback(
    <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => request<T>('PUT', url, data, config),
    [request]
  );

  const del = useCallback(
    <T>(url: string, config?: AxiosRequestConfig) => request<T>('DELETE', url, null, config),
    [request]
  );

  return { ...state, get, post, put, del, request };
};