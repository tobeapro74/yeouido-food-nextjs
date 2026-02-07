"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Building2 } from "lucide-react";
import { Restaurant } from "@/data/yeouido-food";
import Image from "next/image";
import { imageCache, buildingCache, businessStatusCache } from "@/lib/cache";

function formatReviewCount(count: number): string {
  if (count >= 10000) return `${(count / 1000).toFixed(0)}K`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

// 주소에서 층수 정보 추출 (예: "2층", "B1", "지하 1층" 등)
function extractFloor(address: string): string | null {
  // 다양한 층수 패턴 매칭
  const patterns = [
    /(\d+)\s*층/,           // "2층", "2 층"
    /(\d+)F/i,              // "2F", "2f"
    /(B\d+)/i,              // "B1", "B2"
    /지하\s*(\d+)\s*층?/,    // "지하 1층", "지하1"
    /(\d+)호/,              // "413호" -> 4층으로 추정 (선택적)
  ];

  for (const pattern of patterns) {
    const match = address.match(pattern);
    if (match) {
      const value = match[1] || match[0];
      // B1, B2 등은 그대로 반환
      if (/^B\d+$/i.test(value)) {
        return value.toUpperCase();
      }
      // 지하인 경우
      if (address.includes("지하")) {
        return `B${value}`;
      }
      // 일반 층수
      if (/^\d+$/.test(value)) {
        return `${value}층`;
      }
    }
  }
  return null;
}

const categoryIcons: Record<string, string> = {
  한식: "🍚",
  양식: "🥩",
  중식: "🥟",
  일식: "🍣",
  동남아식: "🍜",
};

interface RealTimeRating {
  rating: number | null;
  reviewCount: number | null;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick?: () => void;
  variant?: "horizontal" | "vertical";
  showCategory?: boolean;
  realTimeRating?: RealTimeRating;
}

export function RestaurantCard({
  restaurant,
  onClick,
  variant = "vertical",
  showCategory = false,
  realTimeRating,
}: RestaurantCardProps) {
  // 실시간 평점 우선, 없으면 정적 평점 사용
  const displayRating = realTimeRating?.rating ?? restaurant.평점;
  const displayReviewCount = realTimeRating?.reviewCount ?? restaurant.리뷰수;
  const cacheKey = restaurant.이름;

  // LRU 캐시에서 초기값 가져오기
  const cachedImage = imageCache.get(cacheKey);
  const cachedBuilding = buildingCache.get(cacheKey);
  const cachedClosed = businessStatusCache.get(cacheKey);

  const [imageUrl, setImageUrl] = useState<string>(cachedImage || "");
  const [isLoading, setIsLoading] = useState(!cachedImage);
  const [isClosed, setIsClosed] = useState(cachedClosed || false);
  const [buildingName, setBuildingName] = useState<string | null>(
    restaurant.빌딩 || cachedBuilding || null
  );

  useEffect(() => {
    // 이미 폐업/휴업으로 확인된 경우
    if (businessStatusCache.get(cacheKey)) {
      setIsClosed(true);
      setIsLoading(false);
      return;
    }

    // 이미 캐시된 경우
    const cachedImg = imageCache.get(cacheKey);
    if (cachedImg) {
      setImageUrl(cachedImg);
      // 건물 정보도 캐시에서 가져오기 (정적 데이터가 없는 경우)
      const cachedBldg = buildingCache.get(cacheKey);
      if (!restaurant.빌딩 && cachedBldg) {
        setBuildingName(cachedBldg);
      }
      setIsLoading(false);
      return;
    }

    const fetchImage = async () => {
      try {
        const query = `${restaurant.이름} ${restaurant.주소 || ""}`.trim();
        const res = await fetch(`/api/place-photo?query=${encodeURIComponent(query)}&name=${encodeURIComponent(restaurant.이름)}`);
        const data = await res.json();

        // 휴업/폐업 체크
        if (data.isClosed) {
          businessStatusCache.set(cacheKey, true);
          setIsClosed(true);
          return;
        }

        if (data.photoUrl) {
          imageCache.set(cacheKey, data.photoUrl);
          setImageUrl(data.photoUrl);
        } else {
          // Google에서 못 찾으면 카테고리 기반 placeholder 사용
          const categoryPlaceholders: Record<string, string> = {
            한식: "/images/placeholder-korean.svg",
            양식: "/images/placeholder-western.svg",
            중식: "/images/placeholder-chinese.svg",
            일식: "/images/placeholder-japanese.svg",
            동남아식: "/images/placeholder-asian.svg",
          };
          const placeholder = categoryPlaceholders[restaurant.카테고리] || "/images/placeholder-food.svg";
          imageCache.set(cacheKey, placeholder);
          setImageUrl(placeholder);
        }

        // 건물 정보 캐시 및 상태 업데이트 (정적 데이터가 없는 경우)
        if (!restaurant.빌딩 && data.buildingName) {
          buildingCache.set(cacheKey, data.buildingName);
          setBuildingName(data.buildingName);
        }
      } catch {
        // 에러 시에도 카테고리 기반 placeholder 사용
        const placeholder = "/images/placeholder-food.svg";
        imageCache.set(cacheKey, placeholder);
        setImageUrl(placeholder);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [restaurant.이름, restaurant.주소, restaurant.카테고리, restaurant.빌딩, cacheKey]);

  // 휴업/폐업 식당은 렌더링하지 않음
  if (isClosed) {
    return null;
  }

  if (variant === "horizontal") {
    return (
      <Card
        className="flex-shrink-0 w-44 cursor-pointer transition-all hover:scale-[1.05] hover:shadow-lg active:scale-[0.98] overflow-hidden shadow-sm"
        onClick={onClick}
      >
        <div className="h-28 relative overflow-hidden bg-muted">
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
            sizes="176px"
            unoptimized
          />
          {showCategory && (
            <Badge className="absolute top-2 left-2 text-xs bg-black/60 text-white border-0">
              {categoryIcons[restaurant.카테고리]} {restaurant.카테고리}
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm truncate">{restaurant.이름}</h3>
          {displayRating && (
            <p className="text-xs flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium">{displayRating}</span>
              {displayReviewCount && (
                <span className="text-muted-foreground">
                  ({formatReviewCount(displayReviewCount)})
                </span>
              )}
            </p>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {restaurant.지역}
              {extractFloor(restaurant.주소) && ` · ${extractFloor(restaurant.주소)}`}
            </span>
          </p>
          {buildingName && (
            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{buildingName}</span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] overflow-hidden shadow-sm"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex">
          <div className="w-24 h-24 relative overflow-hidden flex-shrink-0 bg-muted">
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
              sizes="96px"
              unoptimized
            />
          </div>
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold truncate">{restaurant.이름}</h3>
              {displayRating && (
                <span className="text-xs flex items-center gap-0.5 flex-shrink-0">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{displayRating}</span>
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {restaurant.지역}
                {extractFloor(restaurant.주소) && ` · ${extractFloor(restaurant.주소)}`}
              </span>
            </p>
            {restaurant.특징 && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {restaurant.특징}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-xs bg-accent/20 text-accent-foreground">
                {categoryIcons[restaurant.카테고리]} {restaurant.카테고리}
              </Badge>
              {buildingName && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                  <Building2 className="h-3 w-3 mr-1" />
                  {buildingName}
                </Badge>
              )}
              {displayReviewCount && (
                <span className="text-xs text-muted-foreground">
                  리뷰 {formatReviewCount(displayReviewCount)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
