"use client";

import { FortuneResult } from "@/lib/fortune";
import { Restaurant, getRestaurantsByCategoryAndRegion } from "@/data/yeouido-food";
import { MapPin, Utensils, Compass, Sparkles, Star } from "lucide-react";
import { RestaurantCard } from "./restaurant-card";
import { useState, useEffect } from "react";

interface FortuneResultViewProps {
  result: FortuneResult;
  onReset: () => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

// 오행 한글 설명
const 오행설명: Record<string, string> = {
  목: "나무 (木)",
  화: "불 (火)",
  토: "흙 (土)",
  금: "쇠 (金)",
  수: "물 (水)"
};

// 띠 관계 배경색
const 관계색상: Record<string, string> = {
  육합: "bg-green-100 text-green-800 border-green-300",
  삼합: "bg-blue-100 text-blue-800 border-blue-300",
  충: "bg-red-100 text-red-800 border-red-300",
  보통: "bg-gray-100 text-gray-700 border-gray-300"
};

export function FortuneResultView({ result, onReset, onSelectRestaurant }: FortuneResultViewProps) {
  const [recommendations, setRecommendations] = useState<Restaurant[]>([]);

  useEffect(() => {
    // 추천 카테고리와 지역에 맞는 식당 필터링
    const filtered = getRestaurantsByCategoryAndRegion(
      result.luckyFood.category,
      result.luckyRegion
    );

    // 평점 높은 순으로 정렬 후 최대 3개
    const sorted = [...filtered]
      .filter(r => r.평점)
      .sort((a, b) => (b.평점 || 0) - (a.평점 || 0))
      .slice(0, 3);

    setRecommendations(sorted);
  }, [result]);

  const today = new Date();
  const dateString = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="space-y-6 pb-24">
      {/* 헤더 */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">{dateString}</p>
        <h2 className="text-xl font-bold">오늘의 맛집 운세</h2>
      </div>

      {/* 띠 정보 카드 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{result.zodiac.emoji}</span>
            <div>
              <p className="font-bold text-lg">{result.zodiac.name}</p>
              <p className="text-xs text-muted-foreground">{result.zodiac.personality}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">오늘의 일진</p>
            <p className="text-2xl">{result.todayZodiac.emoji}</p>
          </div>
        </div>

        {/* 띠 관계 표시 */}
        <div className={`rounded-lg p-3 border ${관계색상[result.zodiacRelation.relation]}`}>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4" />
            <span className="font-medium text-sm">
              오늘의 띠 궁합: {result.zodiacRelation.relation}
              {result.zodiacRelation.relation === "육합" && " ⭐⭐⭐"}
              {result.zodiacRelation.relation === "삼합" && " ⭐⭐"}
              {result.zodiacRelation.relation === "충" && " ⚠️"}
            </span>
          </div>
          <p className="text-xs">{result.zodiacRelation.description}</p>
        </div>
      </div>

      {/* 운세 카드 */}
      {/* 토(노랑), 금(흰색)은 밝은 배경이므로 어두운 텍스트 사용 */}
      <div
        className={`rounded-2xl p-5 space-y-4 ${
          result.personElement === "토" || result.personElement === "금"
            ? "text-gray-800"
            : "text-white"
        }`}
        style={{
          background: `linear-gradient(135deg, ${result.color}dd, ${result.color}99)`
        }}
      >
        {/* 오행 정보 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm opacity-80">나의 오행</p>
            <p className="text-2xl font-bold">{오행설명[result.personElement]}</p>
          </div>
          <div className="text-5xl">
            {result.personElement === "목" && "🌳"}
            {result.personElement === "화" && "🔥"}
            {result.personElement === "토" && "🏔️"}
            {result.personElement === "금" && "⚔️"}
            {result.personElement === "수" && "💧"}
          </div>
        </div>

        {/* 오늘의 운세 메시지 */}
        <div className={`rounded-xl p-4 backdrop-blur-sm ${
          result.personElement === "토" || result.personElement === "금"
            ? "bg-black/10"
            : "bg-white/20"
        }`}>
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{result.message}</p>
          </div>
        </div>

        {/* 길방과 음식 */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl p-3 backdrop-blur-sm ${
            result.personElement === "토" || result.personElement === "금"
              ? "bg-black/10"
              : "bg-white/20"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4" />
              <span className="text-xs opacity-80">오늘의 길방</span>
            </div>
            <p className="font-bold text-lg">{result.luckyDirection}쪽</p>
            <p className="text-xs opacity-80">{result.luckyRegion}</p>
          </div>
          <div className={`rounded-xl p-3 backdrop-blur-sm ${
            result.personElement === "토" || result.personElement === "금"
              ? "bg-black/10"
              : "bg-white/20"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Utensils className="w-4 h-4" />
              <span className="text-xs opacity-80">추천 음식</span>
            </div>
            <p className="font-bold text-lg">{result.luckyFood.category}</p>
            <p className="text-xs opacity-80">{오행설명[result.luckyFood.element]}</p>
          </div>
        </div>
      </div>

      {/* 추천 음식 설명 */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium">
          {result.personElement === result.luckyFood.element
            ? `${오행설명[result.luckyFood.element]}의 기운으로 조화를 이루세요`
            : `${오행설명[result.luckyFood.element]}의 기운이 ${오행설명[result.personElement]}인 당신에게 힘을 줍니다`
          }
        </p>
        <div className="flex flex-wrap gap-2">
          {result.luckyFood.foods.map((food) => (
            <span
              key={food}
              className="px-2.5 py-1 bg-background rounded-full text-xs"
            >
              {food}
            </span>
          ))}
        </div>
      </div>

      {/* 추천 맛집 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            오늘의 추천 맛집
          </h3>
          <span className="text-xs text-muted-foreground">
            {result.luckyRegion} · {result.luckyFood.category}
          </span>
        </div>

        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((restaurant) => (
              <RestaurantCard
                key={restaurant.이름}
                restaurant={restaurant}
                onClick={() => onSelectRestaurant(restaurant)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>해당 조건의 맛집이 없습니다</p>
            <p className="text-sm mt-1">다른 지역도 확인해보세요!</p>
          </div>
        )}
      </div>

      {/* 다시하기 버튼 */}
      <button
        onClick={onReset}
        className="w-full py-3 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
      >
        다시 운세 보기 🔄
      </button>
    </div>
  );
}
