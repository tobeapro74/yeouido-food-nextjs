"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Star, MapPin, Clock, Phone, ExternalLink, Banknote, Building2, Edit3, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Restaurant, getGoogleMapsLink, getGoogleSearchLink } from "@/data/yeouido-food";
import { ReviewSection } from "@/components/review-section";
import { GoogleReviews } from "@/components/google-reviews";
import { CategoryEditModal } from "@/components/category-edit-modal";
import Image from "next/image";

interface UserInfo {
  id: number;
  name: string;
  is_admin: boolean;
}

interface CustomRestaurantInfo {
  place_id: string;
  category: string;
  registered_by: number;
  phone_number?: string;
  price_level?: number;
  photos?: string[];
  opening_hours?: string[];
}

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
  user?: UserInfo | null;
}

const categoryIcons: Record<string, string> = {
  한식: "🍚",
  양식: "🥩",
  중식: "🥟",
  일식: "🍣",
  동남아식: "🍜",
};

// 이미지 캐시 (restaurant-card와 공유하기 위해 window 객체 사용)
const getImageCache = (): Record<string, string> => {
  if (typeof window !== "undefined") {
    if (!(window as unknown as { __imageCache?: Record<string, string> }).__imageCache) {
      (window as unknown as { __imageCache: Record<string, string> }).__imageCache = {};
    }
    return (window as unknown as { __imageCache: Record<string, string> }).__imageCache;
  }
  return {};
};

// 가격대/전화번호 캐시
const getRestaurantInfoCache = (): Record<string, { priceRange: string | null; phoneNumber: string | null }> => {
  if (typeof window !== "undefined") {
    if (!(window as unknown as { __restaurantInfoCache?: Record<string, { priceRange: string | null; phoneNumber: string | null }> }).__restaurantInfoCache) {
      (window as unknown as { __restaurantInfoCache: Record<string, { priceRange: string | null; phoneNumber: string | null }> }).__restaurantInfoCache = {};
    }
    return (window as unknown as { __restaurantInfoCache: Record<string, { priceRange: string | null; phoneNumber: string | null }> }).__restaurantInfoCache;
  }
  return {};
};

export function RestaurantDetail({ restaurant, onBack, user }: RestaurantDetailProps) {
  const cacheKey = restaurant.이름;
  const imageCache = getImageCache();
  const infoCache = getRestaurantInfoCache();
  const [imageUrl, setImageUrl] = useState<string>(imageCache[cacheKey] || "");
  const [isLoading, setIsLoading] = useState(!imageCache[cacheKey]);
  const [priceRange, setPriceRange] = useState<string | null>(infoCache[cacheKey]?.priceRange ?? null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(infoCache[cacheKey]?.phoneNumber ?? null);
  const [infoLoaded, setInfoLoaded] = useState(cacheKey in infoCache);

  // 커스텀 맛집 관련 상태
  const [customInfo, setCustomInfo] = useState<CustomRestaurantInfo | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string>(restaurant.카테고리);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [openingHours, setOpeningHours] = useState<string[] | null>(null);

  // 커스텀 맛집 여부 확인
  const isCustomRestaurant = !!customInfo;
  const canEdit = user && isCustomRestaurant && (user.is_admin || customInfo.registered_by === user.id);

  // 가격대 변환 함수
  const priceLevelToRange = (level: number | undefined): string | null => {
    if (!level) return null;
    const ranges: Record<number, string> = {
      1: "₩ (저렴)",
      2: "₩₩ (보통)",
      3: "₩₩₩ (비쌈)",
      4: "₩₩₩₩ (매우 비쌈)",
    };
    return ranges[level] || null;
  };

  // 커스텀 맛집 정보 조회
  useEffect(() => {
    const fetchCustomInfo = async () => {
      try {
        const res = await fetch("/api/custom-restaurants");
        const data = await res.json();
        if (data.success && data.data) {
          const found = data.data.find((r: { name: string }) => r.name === restaurant.이름);
          if (found) {
            setCustomInfo({
              place_id: found.place_id,
              category: found.category,
              registered_by: found.registered_by,
              phone_number: found.phone_number,
              price_level: found.price_level,
              photos: found.photos,
              opening_hours: found.opening_hours,
            });
            setCurrentCategory(found.category);

            // 커스텀 맛집의 전화번호, 가격대, 영업시간 설정
            if (found.phone_number) {
              setPhoneNumber(found.phone_number);
            }
            if (found.price_level) {
              setPriceRange(priceLevelToRange(found.price_level));
            }
            if (found.opening_hours && found.opening_hours.length > 0) {
              setOpeningHours(found.opening_hours);
            }

            // 커스텀 맛집의 사진 설정
            if (found.photos && found.photos.length > 0) {
              setImageUrl(found.photos[0]);
              setIsLoading(false);
            }

            setInfoLoaded(true);
          }
        }
      } catch {
        // 조회 실패 시 무시
      }
    };
    fetchCustomInfo();
  }, [restaurant.이름]);

  useEffect(() => {
    // 이미 캐시된 경우
    if (imageCache[cacheKey]) {
      setImageUrl(imageCache[cacheKey]);
      setIsLoading(false);
      return;
    }

    const fetchImage = async () => {
      try {
        const query = `${restaurant.이름} ${restaurant.주소 || ""}`.trim();
        const res = await fetch(`/api/place-photo?query=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data.photoUrl) {
          imageCache[cacheKey] = data.photoUrl;
          setImageUrl(data.photoUrl);
        } else {
          // 카테고리 기반 placeholder 사용
          const categoryPlaceholders: Record<string, string> = {
            한식: "/images/placeholder-korean.svg",
            양식: "/images/placeholder-western.svg",
            중식: "/images/placeholder-chinese.svg",
            일식: "/images/placeholder-japanese.svg",
            동남아식: "/images/placeholder-asian.svg",
          };
          const placeholder = categoryPlaceholders[restaurant.카테고리] || "/images/placeholder-food.svg";
          imageCache[cacheKey] = placeholder;
          setImageUrl(placeholder);
        }
      } catch {
        const placeholder = "/images/placeholder-food.svg";
        imageCache[cacheKey] = placeholder;
        setImageUrl(placeholder);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [restaurant.이름, restaurant.주소, restaurant.카테고리, cacheKey, imageCache]);

  // 가격대/전화번호 정보 가져오기 (커스텀 맛집이 아닌 경우에만)
  useEffect(() => {
    // 커스텀 맛집인 경우 이미 fetchCustomInfo에서 처리하므로 스킵
    if (customInfo) {
      return;
    }

    // 이미 캐시된 경우
    if (cacheKey in infoCache) {
      setPriceRange(infoCache[cacheKey].priceRange);
      setPhoneNumber(infoCache[cacheKey].phoneNumber);
      setInfoLoaded(true);
      return;
    }

    const fetchRestaurantInfo = async () => {
      try {
        const res = await fetch(`/api/restaurant-prices/${encodeURIComponent(restaurant.이름)}`);
        const data = await res.json();
        const fetchedPrice = data.priceRange || null;
        const fetchedPhone = data.phoneNumber || null;
        infoCache[cacheKey] = { priceRange: fetchedPrice, phoneNumber: fetchedPhone };
        setPriceRange(fetchedPrice);
        setPhoneNumber(fetchedPhone);
      } catch (error) {
        console.error("Error fetching restaurant info:", error);
        infoCache[cacheKey] = { priceRange: null, phoneNumber: null };
      } finally {
        setInfoLoaded(true);
      }
    };

    fetchRestaurantInfo();
  }, [restaurant.이름, cacheKey, infoCache, customInfo]);

  const mapsLink = getGoogleMapsLink(restaurant.이름, restaurant.주소);
  const searchLink = getGoogleSearchLink(restaurant.이름);

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* 이미지 영역 */}
      <div className="relative h-64 bg-muted">
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted" />
        )}
        <Image
          src={imageUrl}
          alt={restaurant.이름}
          fill
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          sizes="100vw"
          unoptimized
          priority
        />
        {/* 뒤로가기 버튼 - Apple HIG 권장 44x44px 터치 영역 */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="absolute top-4 left-4 h-11 w-11 min-w-[44px] min-h-[44px] bg-black/30 hover:bg-black/50 text-white rounded-full safe-area-top"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      </div>

      {/* 상세 정보 */}
      <div className="p-4 space-y-4">
        {/* 기본 정보 */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{restaurant.이름}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* 커스텀 맛집이면 수정 가능한 카테고리 배지 */}
                {isCustomRestaurant ? (
                  <Badge
                    variant="secondary"
                    className={canEdit ? "cursor-pointer hover:bg-primary/20 transition-colors" : ""}
                    onClick={() => canEdit && setCategoryModalOpen(true)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {categoryIcons[currentCategory]} {currentCategory}
                    {canEdit && <Edit3 className="h-3 w-3 ml-1" />}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {categoryIcons[restaurant.카테고리]} {restaurant.카테고리}
                  </Badge>
                )}
                <Badge variant="outline">{restaurant.지역}</Badge>
                {restaurant.빌딩 && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                    <Building2 className="h-3 w-3 mr-1" />
                    {restaurant.빌딩}
                  </Badge>
                )}
              </div>
            </div>
            {restaurant.평점 && (
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-lg">{restaurant.평점}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* 특징 */}
        {restaurant.특징 && (
          <div>
            <p className="text-muted-foreground">{restaurant.특징}</p>
          </div>
        )}

        {/* 상세 정보 목록 */}
        <div className="space-y-3 bg-muted/30 rounded-xl p-4">
          {/* 주소 */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-sm">{restaurant.주소}</span>
          </div>

          {/* 영업시간 */}
          {(openingHours || restaurant.영업시간) && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {openingHours ? (
                  <div className="space-y-0.5">
                    {openingHours.map((hour, idx) => (
                      <div key={idx}>{hour}</div>
                    ))}
                  </div>
                ) : (
                  <span>{restaurant.영업시간}</span>
                )}
              </div>
            </div>
          )}

          {/* 전화번호 - DB에서 가져온 전화번호 표시 */}
          {phoneNumber && (
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center gap-3 hover:text-primary transition-colors"
            >
              <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{phoneNumber}</span>
            </a>
          )}

          {/* 가격대 - DB에서 가져온 가격대 표시 */}
          {priceRange && (
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{priceRange}</span>
            </div>
          )}
        </div>

        {/* 외부 링크 */}
        <div className="flex gap-3">
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" className="w-full">
              <MapPin className="w-4 h-4 mr-2" />
              지도 보기
            </Button>
          </a>
          <a
            href={searchLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              검색하기
            </Button>
          </a>
        </div>

        <Separator />

        {/* Google 리뷰 섹션 */}
        <GoogleReviews restaurantName={restaurant.이름} />

        <Separator />

        {/* 사용자 리뷰 섹션 */}
        <ReviewSection restaurantId={restaurant.이름} restaurantName={restaurant.이름} />
      </div>

      {/* 카테고리 수정 모달 */}
      {customInfo && (
        <CategoryEditModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          placeId={customInfo.place_id}
          currentCategory={currentCategory}
          onSuccess={(newCategory) => setCurrentCategory(newCategory)}
        />
      )}
    </div>
  );
}
