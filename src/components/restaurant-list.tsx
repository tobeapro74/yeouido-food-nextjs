"use client";

import { useState, useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RestaurantCard } from "@/components/restaurant-card";
import { Restaurant } from "@/data/yeouido-food";

interface RatingsMap {
  [restaurantName: string]: {
    rating: number | null;
    reviewCount: number | null;
  };
}

type RegionFilter = "전체" | "서여의도" | "동여의도";

interface RestaurantListProps {
  title: string;
  restaurants: Restaurant[];
  onBack: () => void;
  onSelect: (restaurant: Restaurant) => void;
  realTimeRatings?: RatingsMap;
  listType?: "category" | "building" | "region"; // 리스트 타입
  buildingRegion?: string; // 빌딩의 경우 해당 지역
}

export function RestaurantList({
  title,
  restaurants,
  onBack,
  onSelect,
  realTimeRatings = {},
  listType = "category",
  buildingRegion,
}: RestaurantListProps) {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("전체");

  // 빌딩 리스트는 필터링 없이 전체 표시
  const isBuilding = listType === "building";

  // 지역 필터링된 맛집 목록
  const filteredRestaurants = useMemo(() => {
    if (isBuilding || regionFilter === "전체") {
      return restaurants;
    }
    return restaurants.filter((r) => r.지역 === regionFilter);
  }, [restaurants, regionFilter, isBuilding]);

  // 카테고리명 추출 (title에서 이모지 제거)
  const categoryName = title.replace(/^[^\s]+\s*/, "").trim() || title;

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
          <h1 className="text-lg font-semibold">{title}</h1>
          {/* 빌딩의 경우 지역 배지 표시 */}
          {isBuilding && buildingRegion && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {buildingRegion}
            </Badge>
          )}
          <span className="ml-2 text-sm text-muted-foreground">
            ({filteredRestaurants.length})
          </span>
        </div>

        {/* 지역 필터 탭 - 빌딩이 아닌 경우만 표시 */}
        {!isBuilding && (
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
        )}
      </header>

      {/* 목록 */}
      <div className="p-4 space-y-3">
        {filteredRestaurants.length > 0 ? (
          filteredRestaurants.map((restaurant, index) => (
            <RestaurantCard
              key={`${restaurant.이름}-${index}`}
              restaurant={restaurant}
              onClick={() => onSelect(restaurant)}
              realTimeRating={realTimeRatings[restaurant.이름]}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {regionFilter === "전체"
              ? "등록된 맛집이 없습니다."
              : `${regionFilter}에 등록된 '${categoryName}' 맛집이 없습니다.`}
          </div>
        )}
      </div>
    </div>
  );
}
