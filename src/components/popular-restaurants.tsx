"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Building2, ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PopularRestaurant } from "@/data/yeouido-food";
import Image from "next/image";
import { fetchSingleImage } from "@/hooks/useImageBatch";

const categoryIcons: Record<string, string> = {
  한식: "🍚",
  양식: "🥩",
  중식: "🥟",
  일식: "🍣",
  동남아식: "🍜",
};

const categoryPlaceholders: Record<string, string> = {
  한식: "/images/placeholder-korean.svg",
  양식: "/images/placeholder-western.svg",
  중식: "/images/placeholder-chinese.svg",
  일식: "/images/placeholder-japanese.svg",
  동남아식: "/images/placeholder-asian.svg",
};

interface ImageData {
  photoUrl: string | null;
  buildingName?: string | null;
  isClosed?: boolean;
}

interface RatingsMap {
  [restaurantName: string]: {
    rating: number | null;
    reviewCount: number | null;
  };
}

interface PopularRestaurantsProps {
  restaurants: PopularRestaurant[];
  onSelect: (restaurant: PopularRestaurant) => void;
  onShowAll?: () => void;
  realTimeRatings?: RatingsMap;
}

export function PopularRestaurants({ restaurants, onSelect, onShowAll, realTimeRatings = {} }: PopularRestaurantsProps) {
  const [imagesMap, setImagesMap] = useState<Map<string, ImageData>>(new Map());
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());

  // 식당 이름 목록
  const restaurantNames = useMemo(
    () => restaurants.map((r) => r.이름),
    [restaurants]
  );

  // 배치로 이미지 불러오기
  useEffect(() => {
    if (restaurantNames.length === 0) return;

    const fetchBatchImages = async () => {
      // 로딩 시작
      setLoadingSet(new Set(restaurantNames));

      try {
        const response = await fetch("/api/place-photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names: restaurantNames }),
        });

        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        const newMap = new Map<string, ImageData>();

        for (const result of data.results) {
          if (result.isClosed) {
            newMap.set(result.restaurantName, {
              photoUrl: null,
              isClosed: true,
            });
          } else if (result.photoUrl) {
            newMap.set(result.restaurantName, {
              photoUrl: result.photoUrl,
              buildingName: result.buildingName,
            });
          } else {
            // 캐시에 없는 경우 - 개별 API 호출 필요
            // 해당 식당 찾기
            const restaurant = restaurants.find((r) => r.이름 === result.restaurantName);
            if (restaurant) {
              const query = `${restaurant.이름} ${restaurant.주소 || ""}`.trim();
              const singleResult = await fetchSingleImage(restaurant.이름, query);
              if (singleResult.isClosed) {
                newMap.set(result.restaurantName, {
                  photoUrl: null,
                  isClosed: true,
                });
              } else {
                newMap.set(result.restaurantName, {
                  photoUrl: singleResult.photoUrl,
                  buildingName: singleResult.buildingName,
                });
              }
            }
          }
        }

        setImagesMap(newMap);
      } catch (error) {
        console.error("Batch image fetch error:", error);
      } finally {
        setLoadingSet(new Set());
      }
    };

    fetchBatchImages();
  }, [restaurantNames.join(",")]);

  // 폐업/휴업이 아닌 식당만 필터링
  const activeRestaurants = restaurants.filter((r) => {
    const imageData = imagesMap.get(r.이름);
    return !imageData?.isClosed;
  });

  return (
    <section className="bg-card rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">인기 맛집</h2>
        {onShowAll && (
          <button
            onClick={onShowAll}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>전체보기</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {activeRestaurants.map((restaurant, index) => {
            const imageData = imagesMap.get(restaurant.이름);
            const isLoading = loadingSet.has(restaurant.이름);
            const imageUrl = imageData?.photoUrl || categoryPlaceholders[restaurant.카테고리] || "/images/placeholder-food.svg";
            const buildingName = restaurant.빌딩 || imageData?.buildingName;

            // 실시간 평점 우선, 없으면 정적 평점 사용
            const rtRating = realTimeRatings[restaurant.이름];
            const displayRating = rtRating?.rating ?? restaurant.평점;
            const displayReviewCount = rtRating?.reviewCount ?? restaurant.리뷰수;

            return (
              <Card
                key={`${restaurant.이름}-${index}`}
                className="flex-shrink-0 w-36 cursor-pointer transition-all hover:scale-[1.05] hover:shadow-lg active:scale-[0.98] overflow-hidden shadow-sm"
                onClick={() => onSelect(restaurant)}
              >
                <div className="h-20 relative overflow-hidden bg-muted">
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
                    sizes="144px"
                    unoptimized
                  />
                  <Badge className="absolute top-1.5 left-1.5 text-[10px] bg-black/60 text-white border-0 py-0.5 px-1.5">
                    {categoryIcons[restaurant.카테고리]} {restaurant.카테고리}
                  </Badge>
                </div>
                <CardContent className="p-2">
                  <h3 className="font-semibold text-xs truncate">{restaurant.이름}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {displayRating && (
                      <span className="text-[10px] flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{displayRating}</span>
                      </span>
                    )}
                    {displayReviewCount && (
                      <span className="text-[10px] text-muted-foreground">
                        ({displayReviewCount})
                      </span>
                    )}
                  </div>
                  {buildingName && (
                    <p className="text-[10px] text-blue-600 flex items-center gap-0.5 mt-0.5 truncate">
                      <Building2 className="h-2.5 w-2.5 flex-shrink-0" />
                      <span className="truncate">{buildingName}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
