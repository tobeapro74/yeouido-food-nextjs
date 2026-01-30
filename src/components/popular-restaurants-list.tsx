"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RestaurantCard } from "@/components/restaurant-card";
import { Restaurant, getAllRestaurants } from "@/data/yeouido-food";

interface RatingsMap {
  [restaurantName: string]: {
    rating: number | null;
    reviewCount: number | null;
  };
}

type RegionFilter = "전체" | "서여의도" | "동여의도";

interface PopularRestaurantsListProps {
  onBack: () => void;
  onSelect: (restaurant: Restaurant) => void;
  realTimeRatings?: RatingsMap;
}

export function PopularRestaurantsList({
  onBack,
  onSelect,
  realTimeRatings = {},
}: PopularRestaurantsListProps) {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("전체");

  // 평점 기준 상위 맛집 (실시간 평점 우선)
  const popularRestaurants = useMemo(() => {
    const all = getAllRestaurants();
    return [...all]
      .filter((r) => r.평점 || realTimeRatings[r.이름]?.rating)
      .sort((a, b) => {
        const ratingA = realTimeRatings[a.이름]?.rating ?? a.평점 ?? 0;
        const ratingB = realTimeRatings[b.이름]?.rating ?? b.평점 ?? 0;
        return ratingB - ratingA;
      })
      .slice(0, 50); // 상위 50개
  }, [realTimeRatings]);

  // 지역 필터링
  const filteredRestaurants = useMemo(() => {
    if (regionFilter === "전체") return popularRestaurants;
    return popularRestaurants.filter((r) => r.지역 === regionFilter);
  }, [popularRestaurants, regionFilter]);

  return (
    <div className="min-h-screen pb-20">
      {/* 헤더 */}
      <header className="bg-card border-b border-border sticky top-0 z-10 safe-area-top">
        <div className="flex items-center px-2 py-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="h-11 w-11 min-w-[44px] min-h-[44px] rounded-full mr-2"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Flame className="h-5 w-5 text-orange-500 mr-2" />
          <h1 className="text-lg font-semibold">인기 맛집</h1>
          <span className="ml-2 text-sm text-muted-foreground">
            ({filteredRestaurants.length})
          </span>
        </div>

        {/* 지역 필터 탭 */}
        <div className="flex border-t border-border">
          {(["전체", "서여의도", "동여의도"] as RegionFilter[]).map((region) => (
            <button
              key={region}
              onClick={() => setRegionFilter(region)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                regionFilter === region
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </header>

      {/* 목록 */}
      <div className="p-4 space-y-3">
        {filteredRestaurants.length > 0 ? (
          filteredRestaurants.map((restaurant, index) => (
            <div key={`${restaurant.이름}-${index}`} className="relative">
              {/* 순위 배지 (전체 탭에서만 표시) */}
              {regionFilter === "전체" && index < 3 && (
                <Badge
                  className={`absolute -left-1 -top-1 z-10 ${
                    index === 0
                      ? "bg-amber-500"
                      : index === 1
                      ? "bg-gray-400"
                      : "bg-orange-600"
                  } text-white border-0`}
                >
                  {index + 1}위
                </Badge>
              )}
              <RestaurantCard
                restaurant={restaurant}
                onClick={() => onSelect(restaurant)}
                realTimeRating={realTimeRatings[restaurant.이름]}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {regionFilter === "전체"
              ? "등록된 맛집이 없습니다."
              : `${regionFilter}에 등록된 인기 맛집이 없습니다.`}
          </div>
        )}
      </div>
    </div>
  );
}
