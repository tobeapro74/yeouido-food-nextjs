// 사용자 타입
export interface User {
  _id?: string;
  id?: number;
  name: string;
  email: string;
  password?: string;
  profile_image?: string;
  is_admin: boolean;
  created_at: Date;
}

// 리뷰 타입
export interface Review {
  _id?: string;
  restaurant_id: string;
  user_id: number;
  user_name: string;
  rating: number;
  food_rating?: number;
  service_rating?: number;
  atmosphere_rating?: number;
  content: string;
  photos?: string[];
  meal_type?: string;
  created_at: Date;
}

// API 응답 타입
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 인증 토큰 페이로드
export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  is_admin: boolean;
}
