"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Star, MapPin, Clock, Phone, ExternalLink, Banknote, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Restaurant, getPlaceholderImage, getGoogleMapsLink, getGoogleSearchLink } from "@/data/yeouido-food";
import { ReviewSection } from "@/components/review-section";
import Image from "next/image";

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
}

const categoryIcons: Record<string, string> = {
  한식: "🍚",
  양식: "🥩",
  중식: "🥟",
  일식: "🍣",
  동남아식: "🍜",
};

export function RestaurantDetail({ restaurant, onBack }: RestaurantDetailProps) {
  const fallbackUrl = getPlaceholderImage(restaurant.이름);
  const [imageUrl, setImageUrl] = useState<string>(fallbackUrl);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const query = `${restaurant.이름} ${restaurant.주소 || ""}`.trim();
        const res = await fetch(`/api/place-photo?query=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data.photoUrl) {
          setImageUrl(data.photoUrl);
        }
      } catch {
        // 에러 시 폴백 이미지 사용
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [restaurant.이름, restaurant.주소]);

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
        {/* 뒤로가기 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white rounded-full safe-area-top"
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
                <Badge variant="secondary">
                  {categoryIcons[restaurant.카테고리]} {restaurant.카테고리}
                </Badge>
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
          {restaurant.영업시간 && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{restaurant.영업시간}</span>
            </div>
          )}

          {/* 전화번호 */}
          {restaurant.전화번호 && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{restaurant.전화번호}</span>
            </div>
          )}

          {/* 가격대 */}
          {restaurant.가격대 && (
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{restaurant.가격대}</span>
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

        {/* 리뷰 섹션 */}
        <ReviewSection restaurantId={restaurant.이름} restaurantName={restaurant.이름} />
      </div>
    </div>
  );
}
