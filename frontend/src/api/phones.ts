import { apiClient, ApiResponse, Phone, PriceRecord, WatchlistItem, WatchlistRequest } from './client';

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface DealFilter {
  brand?: string;      // '삼성' | '애플' | '샤오미' | '구글' | '기타'
  minPrice?: number;   // 원 단위
  maxPrice?: number;   // 원 단위
}

export const phoneApi = {
  getAllPhones: async (): Promise<Phone[]> => {
    const res = await apiClient.get<ApiResponse<Phone[]>>('/api/phones');
    return res.data.data;
  },

  getRecentDeals: async (page = 0, size = 20, filter?: DealFilter): Promise<PagedResponse<PriceRecord>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<PriceRecord>>>(
      '/api/prices/recent',
      { params: { page, size, ...filter } }
    );
    return res.data.data;
  },

  getLowestDeals: async (page = 0, size = 20, filter?: DealFilter): Promise<PagedResponse<PriceRecord>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<PriceRecord>>>(
      '/api/prices/lowest',
      { params: { page, size, ...filter } }
    );
    return res.data.data;
  },

  getPriceHistory: async (phoneId: number): Promise<PriceRecord[]> => {
    const res = await apiClient.get<ApiResponse<PriceRecord[]>>(`/api/phones/${phoneId}/prices`);
    return res.data.data;
  },

  getLatestPrice: async (phoneId: number): Promise<PriceRecord> => {
    const res = await apiClient.get<ApiResponse<PriceRecord>>(`/api/phones/${phoneId}/prices/latest`);
    return res.data.data;
  },

  searchPhones: async (keyword: string): Promise<Phone[]> => {
    const res = await apiClient.get<ApiResponse<Phone[]>>('/api/phones/search', {
      params: { keyword },
    });
    return res.data.data;
  },

  addToWatchlist: async (request: WatchlistRequest): Promise<WatchlistItem> => {
    const res = await apiClient.post<ApiResponse<WatchlistItem>>('/api/watchlist', request);
    return res.data.data;
  },

  removeFromWatchlist: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/watchlist/${id}`);
  },

  getWatchlist: async (): Promise<WatchlistItem[]> => {
    const res = await apiClient.get<ApiResponse<WatchlistItem[]>>('/api/watchlist');
    return res.data.data;
  },
};
