import { apiClient, ApiResponse } from './client';
import { Post, PagedResponse } from './board';

export interface UserProfile {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  postCount: number;
  watchlistCount: number;
}

export const meApi = {
  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get<ApiResponse<UserProfile>>('/api/me');
    return res.data.data;
  },

  getMyPosts: async (page = 0, size = 20): Promise<PagedResponse<Post>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<Post>>>('/api/me/posts', {
      params: { page, size },
    });
    return res.data.data;
  },

  updateDeviceToken: async (deviceToken: string): Promise<void> => {
    await apiClient.patch('/api/me/device-token', { deviceToken });
  },
};
