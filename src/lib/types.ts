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

// 사용자 등록 맛집 타입
export interface CustomRestaurant {
  _id?: string;
  place_id: string;
  name: string;
  address: string;
  category: "한식" | "양식" | "중식" | "일식" | "동남아식";
  feature?: string;
  region: "서여의도" | "동여의도";
  coordinates: {
    lat: number;
    lng: number;
  };
  google_rating?: number;
  google_reviews_count?: number;
  price_level?: number;
  phone_number?: string;
  opening_hours?: string[];
  photos?: string[];
  website?: string;
  google_map_url?: string;
  registered_by: number;
  registered_by_name: string;
  created_at: string;
  updated_at?: string;
}

// 이메일 인증 타입
export interface EmailVerification {
  _id?: string;
  email: string;
  code: string;
  expiresAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
}
