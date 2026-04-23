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
  token?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    subscriptionTier: string;
    plan?: string;
  };
}

export const TOKEN_KEY = 'grounding_token';
export const USER_KEY = 'grounding_user';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', credentials);
  const accessToken = response.data.accessToken || response.data.token;
  const user = normalizeUser(response.data.user);
  
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  return { accessToken, token: response.data.token, user };
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  const accessToken = response.data.accessToken || response.data.token;
  const user = normalizeUser(response.data.user);
  
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  return { accessToken, token: response.data.token, user };
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
  return userStr ? normalizeUser(JSON.parse(userStr)) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

function normalizeUser(user: any) {
  if (!user) return null;

  return {
    ...user,
    subscriptionTier: user.subscriptionTier || user.plan || 'free',
    plan: user.plan || user.subscriptionTier || 'free',
  };
}
