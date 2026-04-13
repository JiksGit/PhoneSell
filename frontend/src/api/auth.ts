import { apiClient, ApiResponse, AuthUser } from './client';

export interface LoginPayload {
  username: string;
  password: string;
  deviceToken?: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  deviceToken?: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthUser> => {
    const res = await apiClient.post<ApiResponse<AuthUser>>('/api/auth/login', payload);
    return res.data.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthUser> => {
    const res = await apiClient.post<ApiResponse<AuthUser>>('/api/auth/register', payload);
    return res.data.data;
  },
};
