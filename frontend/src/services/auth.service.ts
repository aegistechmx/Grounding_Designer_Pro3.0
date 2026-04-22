// src/services/auth.service.ts
import { api } from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    subscriptionTier: string;
  };
}

export const TOKEN_KEY = 'grounding_token';
export const USER_KEY = 'grounding_user';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', credentials);
  const { accessToken, user } = response.data;
  
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  return { accessToken, user };
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  const { accessToken, user } = response.data;
  
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  return { accessToken, user };
};

export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};
