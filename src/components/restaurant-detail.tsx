"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Star, MapPin, Clock, Phone, ExternalLink, Banknote, Building2, Tag, Settings, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Restaurant, getGoogleMapsLink, getGoogleSearchLink, generateStaticPlaceId } from "@/data/yeouido-food";
import { ReviewSection } from "@/components/review-section";
import { GoogleReviews } from "@/components/google-reviews";
import { CategoryEditModal } from "@/components/category-edit-modal";
import { RestaurantEditModal } from "@/components/restaurant-edit-modal";
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
  feature?: string;
  phone_number?: string;
  price_level?: number;
  photos?: string[];
  opening_hours?: string[];
  address?: string;
  google_rating?: number;
  google_reviews_count?: number;
  google_map_url?: string;
  coordinates?: { lat: number; lng: number };
}

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
  user?: UserInfo | null;
  onCategoryChange?: (newCategory: string) => void;
  onDelete?: () => void;
  onUpdate?: (updatedData: Partial<CustomRestaurantInfo>) => void;
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

// 가격대/전화번호/영업상태 캐시
const getRestaurantInfoCache = (): Record<string, { priceRange: string | null; phoneNumber: string | null; businessStatusKr: string | null }> => {
  if (typeof window !== "undefined") {
    if (!(window as unknown as { __restaurantInfoCache?: Record<string, { priceRange: string | null; phoneNumber: string | null; businessStatusKr: string | null }> }).__restaurantInfoCache) {
      (window as unknown as { __restaurantInfoCache: Record<string, { priceRange: string | null; phoneNumber: string | null; businessStatusKr: string | null }> }).__restaurantInfoCache = {};
    }
    return (window as unknown as { __restaurantInfoCache: Record<string, { priceRange: string | null; phoneNumber: string | null; businessStatusKr: string | null }> }).__restaurantInfoCache;
  }
  return {};
};

export function RestaurantDetail({ restaurant, onBack, user, onCategoryChange, onDelete, onUpdate }: RestaurantDetailProps) {
  const cacheKey = restaurant.이름;
  const imageCache = getImageCache();
  const infoCache = getRestaurantInfoCache();
  const [imageUrl, setImageUrl] = useState<string>(imageCache[cacheKey] || "");
  const [isLoading, setIsLoading] = useState(!imageCache[cacheKey]);
  const [priceRange, setPriceRange] = useState<string | null>(infoCache[cacheKey]?.priceRange ?? null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(infoCache[cacheKey]?.phoneNumber ?? null);
  const [businessStatusKr, setBusinessStatusKr] = useState<string | null>(infoCache[cacheKey]?.businessStatusKr ?? null);
  const [infoLoaded, setInfoLoaded] = useState(cacheKey in infoCache);

  // 커스텀 맛집 관련 상태
  const [customInfo, setCustomInfo] = useState<CustomRestaurantInfo | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string>(restaurant.카테고리);
  const [currentFeature, setCurrentFeature] = useState<string>(restaurant.특징 || "");
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [openingHours, setOpeningHours] = useState<string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 커스텀 맛집 여부 확인
  const isCustomRestaurant = !!customInfo;

  // 정적 데이터용 place_id 생성 (DB에 없는 경우 사용)
  const staticPlaceId = generateStaticPlaceId(restaurant.이름, restaurant.카테고리);

  // 수정/삭제 권한 확인
  // - DB에 있는 맛집: 등록자 본인 또는 관리자 또는 박병철
  // - 정적 데이터 맛집: 관리자 또는 박병철만 가능
  const canEdit = user && (
    (isCustomRestaurant && customInfo && (user.is_admin || user.name === "박병철" || customInfo.registered_by === user.id)) ||
    (!isCustomRestaurant && (user.is_admin || user.name === "박병철"))
  );

  // 맛집 삭제 핸들러
  const handleDelete = async () => {
    const placeIdToDelete = customInfo?.place_id || staticPlaceId;
    if (!placeIdToDelete) return;

    const isStaticData = placeIdToDelete.startsWith("static_");
    const confirmMessage = isStaticData
      ? `"${restaurant.이름}"을(를) 삭제하시겠습니까?\n\n정적 데이터는 삭제 표시만 되며 복구할 수 있습니다.`
      : `"${restaurant.이름}"을(를) 삭제하시겠습니까?\n\n삭제된 맛집은 복구할 수 없습니다.`;

    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/custom-restaurants?placeId=${encodeURIComponent(placeIdToDelete)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("맛집이 삭제되었습니다.");
        onDelete?.();
        onBack();
      } else {
        toast.error(data.error || "삭제에 실패했습니다.");
      }
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

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

  // 컴포넌트 마운트 시 스크롤 상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
              feature: found.feature,
              phone_number: found.phone_number,
              price_level: found.price_level,
              photos: found.photos,
              opening_hours: found.opening_hours,
              address: found.address,
              google_rating: found.google_rating,
              google_reviews_count: found.google_reviews_count,
              google_map_url: found.google_map_url,
              coordinates: found.coordinates,
            });
            setCurrentCategory(found.category);
            if (found.feature) {
              setCurrentFeature(found.feature);
            }

            // 커스텀 맛집의 전화번호, 가격대, 영업시간 설정
            if (found.phone_number) {
              setPhoneNumber(found.phone_number);
              setCurrentPhoneNumber(found.phone_number);
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
      setBusinessStatusKr(infoCache[cacheKey].businessStatusKr);
      setInfoLoaded(true);
      return;
    }

    const fetchRestaurantInfo = async () => {
      try {
        const res = await fetch(`/api/restaurant-prices/${encodeURIComponent(restaurant.이름)}`);
        const data = await res.json();
        const fetchedPrice = data.priceRange || null;
        const fetchedPhone = data.phoneNumber || null;
        const fetchedStatus = data.businessStatusKr || null;
        infoCache[cacheKey] = { priceRange: fetchedPrice, phoneNumber: fetchedPhone, businessStatusKr: fetchedStatus };
        setPriceRange(fetchedPrice);
        setPhoneNumber(fetchedPhone);
        setBusinessStatusKr(fetchedStatus);
      } catch (error) {
        console.error("Error fetching restaurant info:", error);
        infoCache[cacheKey] = { priceRange: null, phoneNumber: null, businessStatusKr: null };
      } finally {
        setInfoLoaded(true);
      }
    };

    fetchRestaurantInfo();
  }, [restaurant.이름, cacheKey, infoCache, customInfo]);

  // 구글 지도 URL 생성: 사용자 등록 맛집은 google_map_url 또는 address 사용
  const googleMapsUrl = isCustomRestaurant && customInfo
    ? customInfo.google_map_url ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customInfo.address || restaurant.이름)}`
    : getGoogleMapsLink(restaurant.이름, restaurant.주소);
  const searchLink = getGoogleSearchLink(restaurant.이름);

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* 이미지 영역 - aspect ratio로 비율 유지 */}
      <div className="relative aspect-[4/3] md:aspect-[3/2] bg-muted">
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
          className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-4 h-11 w-11 min-w-[44px] min-h-[44px] bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center p-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        {/* 수정/삭제 버튼 (사용자 등록 맛집 + 권한 있는 경우) */}
        {canEdit && (
          <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setEditModalOpen(true)}
              className="h-11 w-11 min-w-[44px] min-h-[44px] bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center p-0"
              title="맛집 정보 수정"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-11 w-11 min-w-[44px] min-h-[44px] bg-black/30 hover:bg-red-500/70 text-white rounded-full flex items-center justify-center p-0"
              title="맛집 삭제"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* 상세 정보 */}
      <div className="p-4 space-y-4">
        {/* 기본 정보 */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{restaurant.이름}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* 커스텀 맛집이면 카테고리 배지 */}
                {isCustomRestaurant ? (
                  <Badge variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {categoryIcons[currentCategory]} {currentCategory}
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
        {(currentFeature || restaurant.특징) && (
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground">{currentFeature || restaurant.특징}</p>
          </div>
        )}

        {/* 상세 정보 목록 */}
        <div className="space-y-3 bg-muted/30 rounded-xl p-4">
          {/* 주소 - 사용자 등록 맛집은 address 사용 */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-sm">{isCustomRestaurant && customInfo?.address ? customInfo.address : restaurant.주소}</span>
          </div>

          {/* Google 평점 (사용자 등록 맛집) */}
          {isCustomRestaurant && customInfo?.google_rating && (
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 fill-yellow-500" />
              <span className="text-sm">
                {customInfo.google_rating.toFixed(1)}
                {customInfo.google_reviews_count && (
                  <span className="text-muted-foreground ml-1">
                    ({customInfo.google_reviews_count.toLocaleString()}개 리뷰)
                  </span>
                )}
              </span>
            </div>
          )}

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

          {/* 영업상태 - DB에서 가져온 영업상태 표시 */}
          {businessStatusKr && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className={`text-sm font-medium ${
                businessStatusKr === '영업중' ? 'text-green-600' :
                businessStatusKr === '임시휴업' ? 'text-orange-500' :
                businessStatusKr === '폐업' ? 'text-red-500' : ''
              }`}>
                {businessStatusKr}
              </span>
            </div>
          )}
        </div>

        {/* 외부 링크 */}
        <div className="flex gap-3">
          <a
            href={googleMapsUrl}
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
      {canEdit && (
        <CategoryEditModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          placeId={customInfo?.place_id || staticPlaceId}
          currentCategory={currentCategory}
          onSuccess={(newCategory) => {
            setCurrentCategory(newCategory);
            onCategoryChange?.(newCategory);
          }}
        />
      )}

      {/* 상세 정보 수정 모달 */}
      {canEdit && (
        <RestaurantEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          restaurant={{
            place_id: customInfo?.place_id || staticPlaceId,
            name: restaurant.이름,
            address: customInfo?.address || restaurant.주소 || "",
            category: currentCategory,
            feature: currentFeature,
            phone_number: currentPhoneNumber || restaurant.전화번호 || "",
            opening_hours: openingHours || (restaurant.영업시간 ? [restaurant.영업시간] : undefined),
            google_map_url: customInfo?.google_map_url,
            coordinates: customInfo?.coordinates,
          }}
          onSuccess={(updatedData: Partial<{ category: string; feature: string; phone_number: string; opening_hours: string[]; address: string; coordinates: { lat: number; lng: number } }>) => {
            if (updatedData.category) {
              setCurrentCategory(updatedData.category);
              onCategoryChange?.(updatedData.category);
            }
            if (updatedData.feature !== undefined) {
              setCurrentFeature(updatedData.feature || "");
            }
            if (updatedData.phone_number !== undefined) {
              setCurrentPhoneNumber(updatedData.phone_number || null);
              setPhoneNumber(updatedData.phone_number || null);
            }
            if (updatedData.opening_hours !== undefined) {
              setOpeningHours(updatedData.opening_hours || null);
            }
            // customInfo 전체 업데이트 (기존 DB 맛집인 경우)
            if (customInfo) {
              setCustomInfo({
                ...customInfo,
                ...(updatedData.category && { category: updatedData.category }),
                ...(updatedData.feature !== undefined && { feature: updatedData.feature }),
                ...(updatedData.phone_number !== undefined && { phone_number: updatedData.phone_number }),
                ...(updatedData.opening_hours !== undefined && { opening_hours: updatedData.opening_hours }),
                ...(updatedData.address !== undefined && { address: updatedData.address }),
                ...(updatedData.coordinates && { coordinates: updatedData.coordinates }),
              });
            } else {
              // 정적 데이터가 DB로 마이그레이션된 경우 새로 조회
              const fetchNewCustomInfo = async () => {
                try {
                  const res = await fetch(`/api/custom-restaurants?place_id=${encodeURIComponent(staticPlaceId)}`);
                  const data = await res.json();
                  if (data.success && data.data && data.data.length > 0) {
                    const found = data.data[0];
                    setCustomInfo({
                      place_id: found.place_id,
                      category: found.category,
                      registered_by: found.registered_by,
                      feature: found.feature,
                      phone_number: found.phone_number,
                      price_level: found.price_level,
                      photos: found.photos,
                      opening_hours: found.opening_hours,
                      address: found.address,
                      google_rating: found.google_rating,
                      google_reviews_count: found.google_reviews_count,
                      google_map_url: found.google_map_url,
                      coordinates: found.coordinates,
                    });
                  }
                } catch {
                  // 무시
                }
              };
              fetchNewCustomInfo();
            }
            onUpdate?.(updatedData);
          }}
        />
      )}
    </div>
  );
}
