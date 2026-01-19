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

// 맛집 등록 히스토리 타입
export interface RestaurantHistory {
  _id?: string;
  seq: number; // 순번 (자동 증가)
  place_id: string; // Google Place ID
  name: string; // 식당 이름
  short_address: string; // 간단한 장소 (구/동 단위)
  category: string; // 카테고리
  registered_by: number; // 등록한 사용자 ID
  registered_by_name: string; // 등록한 사용자 이름
  registered_at: string; // 등록 일시
  action: "register" | "delete" | "update"; // 액션 유형
  memo?: string; // 메모 (삭제 사유 등)
}
