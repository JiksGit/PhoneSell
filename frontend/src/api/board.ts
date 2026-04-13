import { apiClient, ApiResponse } from './client';

export interface Post {
  id: number;
  userId: number;
  username: string;
  title: string;
  content: string;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
}

export interface PostRequest {
  title: string;
  content: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export const boardApi = {
  getPosts: async (page = 0, size = 20): Promise<PagedResponse<Post>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<Post>>>('/api/board', {
      params: { page, size },
    });
    return res.data.data;
  },

  getPost: async (id: number): Promise<Post> => {
    const res = await apiClient.get<ApiResponse<Post>>(`/api/board/${id}`);
    return res.data.data;
  },

  createPost: async (payload: PostRequest): Promise<Post> => {
    const res = await apiClient.post<ApiResponse<Post>>('/api/board', payload);
    return res.data.data;
  },

  updatePost: async (id: number, payload: PostRequest): Promise<Post> => {
    const res = await apiClient.put<ApiResponse<Post>>(`/api/board/${id}`, payload);
    return res.data.data;
  },

  deletePost: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/board/${id}`);
  },

  // ─── 댓글 ──────────────────────────────────────────────────────

  getComments: async (postId: number): Promise<Comment[]> => {
    const res = await apiClient.get<ApiResponse<Comment[]>>(`/api/board/${postId}/comments`);
    return res.data.data;
  },

  addComment: async (postId: number, content: string): Promise<Comment> => {
    const res = await apiClient.post<ApiResponse<Comment>>(
      `/api/board/${postId}/comments`, { content }
    );
    return res.data.data;
  },

  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    await apiClient.delete(`/api/board/${postId}/comments/${commentId}`);
  },
};
