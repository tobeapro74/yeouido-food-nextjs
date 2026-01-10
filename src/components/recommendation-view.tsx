"use client";

import { useState, useEffect, useMemo } from "react";
import { Shuffle, MapPin, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Restaurant, getAllRestaurants } from "@/data/yeouido-food";
import { RouletteWheel } from "@/components/roulette-wheel";

interface RecommendationViewProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

// 시간대별 추천 태그
function getTimeBasedTags(): { tags: string[]; message: string } {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 11) {
    return {
      tags: ["해장", "국물", "든든한"],
      message: "☀️ 좋은 아침! 든든하게 시작해요"
    };
  } else if (hour >= 11 && hour < 14) {
    return {
      tags: ["점심", "가성비", "빠른"],
      message: "🍽️ 점심시간! 뭐 먹을까요?"
    };
  } else if (hour >= 14 && hour < 17) {
    return {
      tags: ["카페", "가벼운", "디저트"],
      message: "☕ 오후 티타임 어때요?"
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      tags: ["저녁", "회식", "술안주"],
      message: "🌙 저녁 메뉴 추천해드릴게요"
    };
  } else {
    return {
      tags: ["야식", "국물", "든든한"],
      message: "🌃 야식 타임!"
    };
  }
}

// 기분 옵션
const moodOptions = [
  { id: "tired", emoji: "😫", label: "피곤해", tags: ["국밥", "설렁탕", "삼계탕", "곰탕"], categories: ["한식"] },
  { id: "light", emoji: "🍃", label: "가볍게", tags: ["샐러드", "우동", "덮밥", "쌀국수"], categories: ["일식", "동남아식"] },
  { id: "special", emoji: "🎉", label: "특별하게", tags: ["스테이크", "오마카세", "코스"], categories: ["양식", "일식"] },
  { id: "spicy", emoji: "🔥", label: "매콤하게", tags: ["짬뽕", "마라탕", "낙볶", "제육"], categories: ["중식", "한식"] },
  { id: "soup", emoji: "🍜", label: "국물땡김", tags: ["칼국수", "감자탕", "매운탕", "찌개"], categories: ["한식"] },
  { id: "meat", emoji: "🥩", label: "고기고기", tags: ["삼겹살", "갈비", "한우", "불고기"], categories: ["한식"] },
];

// 룰렛 아이템 (카테고리 기반)
const rouletteItems = [
  { id: "한식", label: "🍚 한식", color: "#ef4444" },
  { id: "양식", label: "🍝 양식", color: "#f97316" },
  { id: "중식", label: "🥟 중식", color: "#eab308" },
  { id: "일식", label: "🍣 일식", color: "#22c55e" },
  { id: "동남아식", label: "🍜 동남아", color: "#3b82f6" },
  { id: "random", label: "🎲 랜덤", color: "#8b5cf6" },
];

type TabMode = "mood" | "roulette";

export function RecommendationView({ onSelectRestaurant }: RecommendationViewProps) {
  const [tabMode, setTabMode] = useState<TabMode>("mood");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [recommendedRestaurant, setRecommendedRestaurant] = useState<Restaurant | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);

  const allRestaurants = useMemo(() => getAllRestaurants(), []);
  const timeContext = useMemo(() => getTimeBasedTags(), []);

  // 추천 로직
  const getRecommendation = (mood?: string, category?: string) => {
    let candidates = [...allRestaurants];

    // 평점 3.5 이상 필터
    candidates = candidates.filter(r => (r.평점 || 0) >= 3.5);

    // 카테고리 필터 (룰렛 결과)
    if (category && category !== "random") {
      candidates = candidates.filter(r => r.카테고리 === category);
    }

    // 기분 기반 필터링
    if (mood) {
      const moodData = moodOptions.find(m => m.id === mood);
      if (moodData) {
        const categoryFiltered = candidates.filter(r =>
          moodData.categories.includes(r.카테고리)
        );
        if (categoryFiltered.length > 0) {
          candidates = categoryFiltered;
        }

        const tagFiltered = candidates.filter(r =>
          moodData.tags.some(tag => r.특징.includes(tag) || r.이름.includes(tag))
        );
        if (tagFiltered.length > 0) {
          candidates = tagFiltered;
        }
      }
    }

    // 랜덤 선택
    if (candidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      return candidates[randomIndex];
    }

    const randomIndex = Math.floor(Math.random() * allRestaurants.length);
    return allRestaurants[randomIndex];
  };

  // 추천 실행
  const handleRecommend = (mood?: string, category?: string) => {
    setIsSpinning(true);
    setShowResult(false);

    setTimeout(() => {
      const restaurant = getRecommendation(mood, category);
      setRecommendedRestaurant(restaurant);
      setIsSpinning(false);
      setShowResult(true);
    }, 800);
  };

  // 기분 선택
  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
    handleRecommend(moodId);
  };

  // 다시 추천
  const handleReshuffle = () => {
    if (tabMode === "roulette" && rouletteResult) {
      handleRecommend(undefined, rouletteResult);
    } else {
      handleRecommend(selectedMood || undefined);
    }
  };

  // 룰렛 결과 처리
  const handleRouletteResult = (categoryId: string) => {
    setRouletteResult(categoryId);
    handleRecommend(undefined, categoryId);
  };

  // 초기 추천
  useEffect(() => {
    handleRecommend();
  }, []);

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-orange-50 to-white">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-6 safe-area-top">
        <h2 className="text-xl font-bold text-center mb-1">🎲 한끼 추천</h2>
        <p className="text-center text-orange-100 text-sm">{timeContext.message}</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 탭 선택 */}
        <div className="flex gap-2 p-1 bg-white rounded-xl shadow-sm">
          <button
            onClick={() => setTabMode("mood")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              tabMode === "mood"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            😊 기분별 추천
          </button>
          <button
            onClick={() => setTabMode("roulette")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              tabMode === "roulette"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🎡 룰렛 돌리기
          </button>
        </div>

        {/* 기분별 추천 */}
        {tabMode === "mood" && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">오늘 기분은?</h3>
            <div className="grid grid-cols-3 gap-2">
              {moodOptions.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood.id)}
                  className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                    selectedMood === mood.id
                      ? "bg-orange-100 border-2 border-orange-400 scale-105"
                      : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                  }`}
                >
                  <span className="text-2xl mb-1">{mood.emoji}</span>
                  <span className="text-xs font-medium text-gray-700">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 룰렛 */}
        {tabMode === "roulette" && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <RouletteWheel items={rouletteItems} onResult={handleRouletteResult} />
          </div>
        )}

        {/* 추천 결과 카드 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isSpinning ? (
            <div className="p-8 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-500 text-sm">맛집 찾는 중...</p>
            </div>
          ) : showResult && recommendedRestaurant ? (
            <div>
              {/* 추천 이유 */}
              <div className="bg-orange-50 px-4 py-2 text-center">
                <span className="text-xs text-orange-600 font-medium">
                  {tabMode === "roulette" && rouletteResult
                    ? `🎡 ${rouletteResult === "random" ? "랜덤" : rouletteResult} 카테고리에서 추천!`
                    : selectedMood
                    ? `${moodOptions.find(m => m.id === selectedMood)?.emoji} ${moodOptions.find(m => m.id === selectedMood)?.label} 기분에 딱!`
                    : "🎯 오늘의 추천"}
                </span>
              </div>

              {/* 식당 정보 */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onSelectRestaurant(recommendedRestaurant)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {recommendedRestaurant.이름}
                    </h3>
                    <p className="text-sm text-gray-500">{recommendedRestaurant.카테고리}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-700">
                      {recommendedRestaurant.평점 || "-"}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {recommendedRestaurant.특징}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{recommendedRestaurant.지역}</span>
                  </div>
                  {recommendedRestaurant.빌딩 && (
                    <span className="text-gray-400">• {recommendedRestaurant.빌딩}</span>
                  )}
                  {recommendedRestaurant.가격대 && (
                    <span className="text-gray-400">• {recommendedRestaurant.가격대}</span>
                  )}
                </div>

                <div className="flex items-center justify-end mt-3 text-orange-500 text-sm font-medium">
                  <span>자세히 보기</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 액션 버튼 */}
        {showResult && (
          <div className="flex gap-3">
            <Button
              onClick={handleReshuffle}
              variant="outline"
              className="flex-1 h-12 text-base border-orange-200 text-orange-600 hover:bg-orange-50"
              disabled={isSpinning}
            >
              <Shuffle className="w-5 h-5 mr-2" />
              다시 추천
            </Button>
            <Button
              onClick={() => recommendedRestaurant && onSelectRestaurant(recommendedRestaurant)}
              className="flex-1 h-12 text-base bg-orange-500 hover:bg-orange-600"
              disabled={!recommendedRestaurant || isSpinning}
            >
              여기로 갈래! 🍽️
            </Button>
          </div>
        )}

        {/* 팁 */}
        <div className="text-center text-xs text-gray-400 mt-4">
          💡 선택이 어려우면 {tabMode === "roulette" ? "룰렛을 다시 돌려보세요!" : "다시 추천을 눌러보세요!"}
        </div>
      </div>
    </div>
  );
}
