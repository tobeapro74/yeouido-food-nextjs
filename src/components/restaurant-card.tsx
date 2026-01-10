"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Building2 } from "lucide-react";
import { Restaurant, getPlaceholderImage } from "@/data/yeouido-food";
import Image from "next/image";

function formatReviewCount(count: number): string {
  if (count >= 10000) return `${(count / 1000).toFixed(0)}K`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

const imageCache: Record<string, string> = {};
const closedCache: Record<string, boolean> = {};

const categoryIcons: Record<string, string> = {
  한식: "🍚",
  양식: "🥩",
  중식: "🥟",
  일식: "🍣",
  동남아식: "🍜",
};

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick?: () => void;
  variant?: "horizontal" | "vertical";
  showCategory?: boolean;
}

export function RestaurantCard({
  restaurant,
  onClick,
  variant = "vertical",
  showCategory = false,
}: RestaurantCardProps) {
  const fallbackUrl = getPlaceholderImage(restaurant.이름);
  const [imageUrl, setImageUrl] = useState<string>(fallbackUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const cacheKey = restaurant.이름;

    // 이미 폐업/휴업으로 확인된 경우
    if (closedCache[cacheKey]) {
      setIsClosed(true);
      setIsLoading(false);
      return;
    }

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

        // 휴업/폐업 체크
        if (data.isClosed) {
          closedCache[cacheKey] = true;
          setIsClosed(true);
          return;
        }

        if (data.photoUrl) {
          imageCache[cacheKey] = data.photoUrl;
          setImageUrl(data.photoUrl);
        } else {
          imageCache[cacheKey] = fallbackUrl;
        }
      } catch {
        imageCache[cacheKey] = fallbackUrl;
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [restaurant.이름, restaurant.주소, fallbackUrl]);

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
          {restaurant.평점 && (
            <p className="text-xs flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium">{restaurant.평점}</span>
              {restaurant.리뷰수 && (
                <span className="text-muted-foreground">
                  ({formatReviewCount(restaurant.리뷰수)})
                </span>
              )}
            </p>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{restaurant.지역} · {restaurant.주소.split(' ').slice(-1)[0]}</span>
          </p>
          {restaurant.빌딩 && (
            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{restaurant.빌딩}</span>
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
              {restaurant.평점 && (
                <span className="text-xs flex items-center gap-0.5 flex-shrink-0">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{restaurant.평점}</span>
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{restaurant.지역} · {restaurant.주소.split(' ').slice(-1)[0]}</span>
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
              {restaurant.빌딩 && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                  <Building2 className="h-3 w-3 mr-1" />
                  {restaurant.빌딩}
                </Badge>
              )}
              {restaurant.리뷰수 && (
                <span className="text-xs text-muted-foreground">
                  리뷰 {formatReviewCount(restaurant.리뷰수)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
