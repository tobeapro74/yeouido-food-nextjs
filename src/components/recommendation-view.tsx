"use client";

import { useState, useEffect, useMemo } from "react";
import { Shuffle, MapPin, Star, ChevronRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Restaurant, getAllRestaurants } from "@/data/yeouido-food";
import { RouletteWheel } from "@/components/roulette-wheel";
import {
  PreferenceSettings,
  UserPreferences,
  loadPreferences,
  savePreferences,
  defaultPreferences,
} from "@/components/preference-settings";

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

// 가격 파싱 헬퍼
function parsePrice(priceStr?: string): number {
  if (!priceStr) return 15000;
  const match = priceStr.match(/[\d,]+/);
  if (match) {
    return parseInt(match[0].replace(/,/g, ""), 10);
  }
  return 15000;
}

type TabMode = "mood" | "roulette";

export function RecommendationView({ onSelectRestaurant }: RecommendationViewProps) {
  const [tabMode, setTabMode] = useState<TabMode>("mood");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [recommendedRestaurants, setRecommendedRestaurants] = useState<Restaurant[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  const allRestaurants = useMemo(() => getAllRestaurants(), []);
  const timeContext = useMemo(() => getTimeBasedTags(), []);

  // 취향 설정 로드는 아래 useEffect에서 통합 처리

  // 취향 설정 저장
  const handleSavePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    savePreferences(newPrefs);
    // 설정 변경 후 다시 추천
    handleRecommend(selectedMood || undefined, rouletteResult || undefined, newPrefs);
  };

  // 추천 로직 (취향 반영) - 3개 추천
  const getRecommendations = (mood?: string, category?: string, prefs?: UserPreferences): Restaurant[] => {
    const currentPrefs = prefs || preferences;
    let candidates = [...allRestaurants];

    // 평점 3.5 이상 필터
    candidates = candidates.filter(r => (r.평점 || 0) >= 3.5);

    // 룰렛 카테고리 필터 (최우선 적용 - 룰렛 결과는 반드시 지켜야 함)
    if (category && category !== "random") {
      candidates = candidates.filter(r => r.카테고리 === category);
    }

    // 취향 설정 반영: 카테고리 필터 (룰렛 모드가 아닐 때만 적용)
    if (!category && currentPrefs.categories.length < 5) {
      candidates = candidates.filter(r => currentPrefs.categories.includes(r.카테고리));
    }

    // 취향 설정 반영: 지역 필터
    if (currentPrefs.region !== "전체") {
      candidates = candidates.filter(r => r.지역 === currentPrefs.region);
    }

    // 취향 설정 반영: 가격대 필터
    if (currentPrefs.priceRange !== "all") {
      candidates = candidates.filter(r => {
        const price = parsePrice(r.가격대);
        if (currentPrefs.priceRange === "low") return price <= 10000;
        if (currentPrefs.priceRange === "mid") return price > 10000 && price <= 20000;
        if (currentPrefs.priceRange === "high") return price > 20000;
        return true;
      });
    }

    // 취향 설정 반영: 제외 태그
    if (currentPrefs.excludeTags.length > 0) {
      candidates = candidates.filter(r =>
        !currentPrefs.excludeTags.some(tag =>
          r.특징.includes(tag) || r.이름.includes(tag)
        )
      );
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

    // 랜덤으로 3개 선택
    const selectRandom = (arr: Restaurant[], count: number): Restaurant[] => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };

    if (candidates.length > 0) {
      return selectRandom(candidates, 3);
    }

    // 후보가 없으면 룰렛 카테고리만 적용하여 재시도
    if (category && category !== "random") {
      const categoryOnly = allRestaurants.filter(r => r.카테고리 === category);
      if (categoryOnly.length > 0) {
        return selectRandom(categoryOnly, 3);
      }
    }

    // 그래도 없으면 전체에서 랜덤 3개
    return selectRandom(allRestaurants, 3);
  };

  // 추천 실행
  const handleRecommend = (mood?: string, category?: string, prefs?: UserPreferences) => {
    setIsSpinning(true);
    setShowResult(false);

    setTimeout(() => {
      const restaurants = getRecommendations(mood, category, prefs);
      setRecommendedRestaurants(restaurants);
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

  // 초기 로드: preferences 로드 및 추천
  useEffect(() => {
    const prefs = loadPreferences();
    setPreferences(prefs);
    // 첫 추천 실행
    setTimeout(() => handleRecommend(undefined, undefined, prefs), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 취향 설정 여부 표시
  const hasCustomPrefs = preferences.categories.length < 5 ||
    preferences.region !== "전체" ||
    preferences.priceRange !== "all" ||
    preferences.excludeTags.length > 0;

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-orange-50 to-white">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-6 safe-area-top">
        <div className="flex items-center justify-between mb-1">
          <div className="w-8" />
          <h2 className="text-xl font-bold text-center">🎲 한끼 추천</h2>
          <button
            onClick={() => setSettingsOpen(true)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              hasCustomPrefs ? "bg-white/30" : "bg-white/20 hover:bg-white/30"
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-orange-100 text-sm">{timeContext.message}</p>
        {hasCustomPrefs && (
          <p className="text-center text-orange-200 text-xs mt-1">
            ⚙️ 내 취향이 반영되고 있어요
          </p>
        )}
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
          ) : showResult && recommendedRestaurants.length > 0 ? (
            <div>
              {/* 추천 이유 */}
              <div className="bg-orange-50 px-4 py-2 text-center">
                <span className="text-xs text-orange-600 font-medium">
                  {tabMode === "roulette" && rouletteResult
                    ? `🎡 ${rouletteResult === "random" ? "랜덤" : rouletteResult} 카테고리에서 추천!`
                    : selectedMood
                    ? `${moodOptions.find(m => m.id === selectedMood)?.emoji} ${moodOptions.find(m => m.id === selectedMood)?.label} 기분에 딱!`
                    : "🎯 오늘의 추천 3곳"}
                </span>
              </div>

              {/* 식당 정보 - 3개 */}
              <div className="divide-y divide-gray-100">
                {recommendedRestaurants.map((restaurant, index) => (
                  <div
                    key={restaurant.이름 + index}
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onSelectRestaurant(restaurant)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">
                            {restaurant.이름}
                          </h3>
                          <p className="text-xs text-gray-500">{restaurant.카테고리}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-semibold text-yellow-700">
                          {restaurant.평점 || "-"}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2 line-clamp-1 ml-8">
                      {restaurant.특징}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-gray-500 ml-8">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{restaurant.지역}</span>
                      </div>
                      {restaurant.가격대 && (
                        <span className="text-gray-400">• {restaurant.가격대}</span>
                      )}
                      <ChevronRight className="w-4 h-4 ml-auto text-orange-400" />
                    </div>
                  </div>
                ))}
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
          </div>
        )}

        {/* 팁 */}
        <div className="text-center text-xs text-gray-400 mt-4">
          💡 {tabMode === "roulette" ? "룰렛을 다시 돌려보세요!" : "기분을 선택하거나 다시 추천을 눌러보세요!"}
        </div>
      </div>

      {/* 취향 설정 모달 */}
      <PreferenceSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
        onSave={handleSavePreferences}
      />
    </div>
  );
}
