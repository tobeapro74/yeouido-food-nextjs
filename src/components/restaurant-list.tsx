"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RestaurantCard } from "@/components/restaurant-card";
import { Restaurant } from "@/data/yeouido-food";

interface RatingsMap {
  [restaurantName: string]: {
    rating: number | null;
    reviewCount: number | null;
  };
}

interface RestaurantListProps {
  title: string;
  restaurants: Restaurant[];
  onBack: () => void;
  onSelect: (restaurant: Restaurant) => void;
  realTimeRatings?: RatingsMap;
}

export function RestaurantList({
  title,
  restaurants,
  onBack,
  onSelect,
  realTimeRatings = {},
}: RestaurantListProps) {
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
          <span className="ml-2 text-sm text-muted-foreground">
            ({restaurants.length})
          </span>
        </div>
      </header>

      {/* 목록 */}
      <div className="p-4 space-y-3">
        {restaurants.length > 0 ? (
          restaurants.map((restaurant, index) => (
            <RestaurantCard
              key={`${restaurant.이름}-${index}`}
              restaurant={restaurant}
              onClick={() => onSelect(restaurant)}
              realTimeRating={realTimeRatings[restaurant.이름]}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            등록된 맛집이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
