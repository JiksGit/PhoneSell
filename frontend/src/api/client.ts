import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 — JWT 자동 첨부
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // AsyncStorage 오류는 무시 (웹 fallback 포함)
  }
  return config;
});

// 응답 인터셉터 — 공통 에러 핸들링
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.message ?? '서버 오류가 발생했습니다';
      return Promise.reject(new Error(message));
    }
    if (error.request) {
      return Promise.reject(new Error('서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.'));
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export interface Phone {
  id: number;
  modelName: string;
  brand: string;
  createdAt: string;
}

export interface PriceRecord {
  id: number;
  phoneId: number;
  modelName: string;
  price: number;
  source: string;
  sourceUrl: string | null;
  crawledAt: string;
}

export interface WatchlistItem {
  id: number;
  userId: number;
  phoneId: number;
  modelName: string;
  brand: string;
  targetPrice: number | null;
  currentPrice: number | null;
  createdAt: string;
}

export interface WatchlistRequest {
  phoneId: number;
  targetPrice?: number;
}

export interface AuthUser {
  userId: number;
  username: string;
  role: 'USER' | 'ADMIN';
  token: string;
}
