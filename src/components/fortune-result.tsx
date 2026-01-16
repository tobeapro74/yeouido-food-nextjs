"use client";

import { FortuneResult, getFortuneExplanation, FortuneDetailExplanation } from "@/lib/fortune";
import { Restaurant, getRestaurantsByCategoryAndRegion } from "@/data/yeouido-food";
import { MapPin } from "lucide-react";
import { RestaurantCard } from "./restaurant-card";
import { FortuneDetailModal } from "./fortune-detail-modal";
import { useState, useEffect } from "react";

interface FortuneResultViewProps {
  result: FortuneResult;
  onReset: () => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

// 운세 지수를 이모지로 변환
function renderScoreEmoji(score: number, emoji: string): string {
  return emoji.repeat(score);
}

// 운세 카테고리 정보
const fortuneCategories = [
  { id: "overall", label: "종합운", emoji: "⭐", color: "bg-yellow-100 border-yellow-300 text-yellow-700" },
  { id: "wealth", label: "재물운", emoji: "💰", color: "bg-green-100 border-green-300 text-green-700" },
  { id: "family", label: "가정운", emoji: "🏠", color: "bg-pink-100 border-pink-300 text-pink-700" },
  { id: "social", label: "사회운", emoji: "👔", color: "bg-blue-100 border-blue-300 text-blue-700" },
] as const;

export function FortuneResultView({ result, onReset, onSelectRestaurant }: FortuneResultViewProps) {
  const [recommendations, setRecommendations] = useState<Restaurant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"overall" | "wealth" | "family" | "social" | null>(null);
  const [modalExplanation, setModalExplanation] = useState<FortuneDetailExplanation | null>(null);
  const [modalScore, setModalScore] = useState<number>(0);

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

  // 운세 카테고리 클릭 핸들러
  const handleCategoryClick = (category: "overall" | "wealth" | "family" | "social") => {
    const score = result.scores[category];
    const explanation = getFortuneExplanation(category, score);
    setSelectedCategory(category);
    setModalExplanation(explanation);
    setModalScore(score);
  };

  const today = new Date();
  const dateString = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="space-y-5 pb-24">
      {/* 헤더 */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">{dateString}</p>
        <h2 className="text-xl font-bold">오늘의 맛집 운세</h2>
      </div>

      {/* 위트 있는 헤드라인 카드 */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">{result.zodiac.emoji}</span>
          <span className="text-lg">{result.starSign.emoji}</span>
          <span className="text-sm opacity-80">{result.zodiac.name} · {result.starSign.name}</span>
        </div>
        <p className="text-lg font-bold leading-snug">
          {result.wittyMessage.headline}
        </p>
        <p className="text-sm mt-2 opacity-90">
          {result.wittyMessage.detail}
        </p>
      </div>

      {/* 운세 지수 카드 - 클릭 가능 */}
      <div className="bg-white rounded-2xl p-4 border shadow-sm">
        <p className="text-xs text-gray-500 text-center mb-3">
          각 운세를 터치하면 상세 해설을 볼 수 있어요
        </p>
        <div className="grid grid-cols-4 gap-2">
          {fortuneCategories.map((cat) => {
            const score = result.scores[cat.id];
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`rounded-xl p-2 border-2 ${cat.color} hover:opacity-80 active:scale-95 transition-all overflow-hidden`}
              >
                <p className="text-xs font-medium mb-1">{cat.label}</p>
                <p className="text-sm leading-tight tracking-tight">
                  {renderScoreEmoji(score, cat.emoji)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 구체적 메뉴 추천 카드 */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            🍽️
          </div>
          <div className="flex-1">
            <p className="text-xs text-orange-600 font-medium">오늘의 추천 메뉴</p>
            <p className="font-bold text-xl text-gray-900">{result.specificMenu.name}</p>
            <p className="text-sm text-gray-600 mt-1">{result.specificMenu.reason}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {result.specificMenu.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 메뉴 조언 (페르소나 기반) */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-sm text-blue-800">
          💡 {result.wittyMessage.menuAdvice}
        </p>
      </div>

      {/* 길방 + 추천 카테고리 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <p className="text-xs text-purple-600 mb-1">오늘의 길방</p>
          <p className="font-bold text-purple-900">{result.luckyDirection}쪽</p>
          <p className="text-sm text-purple-700">{result.luckyRegion}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs text-green-600 mb-1">추천 카테고리</p>
          <p className="font-bold text-green-900">{result.luckyFood.category}</p>
          <p className="text-sm text-green-700">{result.luckyFood.foods[0]}</p>
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

      {/* 운세 상세 모달 */}
      <FortuneDetailModal
        open={selectedCategory !== null}
        onOpenChange={(open) => !open && setSelectedCategory(null)}
        explanation={modalExplanation}
        score={modalScore}
      />
    </div>
  );
}
