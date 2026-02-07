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

// 날씨 데이터 타입
interface WeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    weather: string;
    icon: string;
    type: "sunny" | "cloudy" | "rainy" | "snowy" | "foggy";
  };
  comparison: {
    tempDiff: number;
    tempTrend: "hotter" | "colder" | "same";
    weatherChanged: boolean;
  };
  recommendation: {
    message: string;
    tags: string[];
  };
}

// 추천 이력 타입
interface RecommendationHistory {
  date: string;
  restaurants: string[];
}

// 추천 이력 관리 (localStorage)
const HISTORY_KEY = "yeouido-recommendation-history";
const HISTORY_DAYS = 3; // 최근 3일간 이력 저장

function loadRecommendationHistory(): RecommendationHistory[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      const history = JSON.parse(saved) as RecommendationHistory[];
      // 최근 3일만 유지
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - HISTORY_DAYS);
      return history.filter(h => new Date(h.date) >= threeDaysAgo);
    }
  } catch (e) {
    console.error("추천 이력 로드 실패:", e);
  }
  return [];
}

function saveRecommendationHistory(restaurants: string[]) {
  if (typeof window === "undefined") return;
  try {
    const today = new Date().toISOString().split("T")[0];
    const history = loadRecommendationHistory();

    // 오늘 이력이 있으면 업데이트, 없으면 추가
    const todayIndex = history.findIndex(h => h.date === today);
    if (todayIndex >= 0) {
      // 기존 이력에 추가 (중복 제거)
      const existing = new Set(history[todayIndex].restaurants);
      restaurants.forEach(r => existing.add(r));
      history[todayIndex].restaurants = Array.from(existing);
    } else {
      history.push({ date: today, restaurants });
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("추천 이력 저장 실패:", e);
  }
}

function getRecentRecommendedNames(): Set<string> {
  const history = loadRecommendationHistory();
  const names = new Set<string>();
  history.forEach(h => h.restaurants.forEach(r => names.add(r)));
  return names;
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

// 룰렛 카테고리별 문구 및 연관 태그
interface RouletteMessage {
  message: string;
  tags: string[]; // 이 문구와 연관된 메뉴/특징 태그
}

const rouletteMessages: Record<string, RouletteMessage[]> = {
  random: [
    { message: "🎲 앗! 랜덤이네요... 내키지 않아도 무조건 먹기!", tags: [] },
    { message: "🎲 결정장애 치료제 투약 완료! 이제 운명에 맡겨봐~", tags: [] },
    { message: "🎲 '아무거나'의 최후! 이제 와서 무르기 없기입니다?", tags: [] },
  ],
  한식: [
    { message: "🍚 오늘은 K-푸드 먹는 날~~!", tags: [] },
    { message: "🍚 한국인은 역시 밥심! 든든하게 한 공기 뚝딱?", tags: ["정식", "백반", "국밥"] },
    { message: "🍚 구관이 명관, 결국은 밥으로 돌아오는 법! (안 질림)", tags: ["밥", "정식", "백반", "국밥", "덮밥"] },
  ],
  양식: [
    { message: "🍝 점심부터 칼질하러 가자~~", tags: ["스테이크", "파스타"] },
    { message: "🍝 오늘 점심은 갓생 뉴요커 스타일? 칼로리 가보자고!", tags: ["버거", "브런치", "샐러드"] },
    { message: "🍝 입안 가득 느끼함 충전 완료! 오후 업무 텐션 업~", tags: ["파스타", "리조또", "피자"] },
  ],
  중식: [
    { message: "🥡 짜장이냐 짬뽕이냐, 그것이 문제로다!", tags: ["짜장", "짬뽕"] },
    { message: "🥡 웍질 소리가 들리나요? 기름진 게 당길 때가 됐지!", tags: ["볶음밥", "마라"] },
    { message: "🥡 오늘의 회의 주제: 탕수육 '부먹'인가 '찍먹'인가?", tags: ["탕수육", "깐풍기"] },
  ],
  일식: [
    { message: "🍣 깔끔함의 정석! 내 속을 편안하게 해줄 미식 여행", tags: ["우동", "소바", "덮밥"] },
    { message: "🍣 스시? 라멘? 돈카츠? 오늘 점심은 재팬 바이브!", tags: ["스시", "라멘", "돈카츠"] },
    { message: "🍣 부담 없는 한 끼! 눈으로 먹고 입으로 즐기자구~", tags: ["오마카세", "회", "사시미"] },
  ],
  동남아식: [
    { message: "🍜 비행기 티켓 대신 쌀국수! 입안에서 방콕 여행 중~", tags: ["쌀국수", "팟타이", "분짜"] },
    { message: "🍜 고수 넣으실? 안 넣으실? 이국적인 향기에 취해봐!", tags: ["쌀국수", "반미"] },
    { message: "🍜 나시고랭? 똠양꿍? 뻔한 메뉴가 지겨운 당신을 위해!", tags: ["나시고랭", "똠양꿍", "팟타이"] },
  ],
};

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
  const [rouletteMessage, setRouletteMessage] = useState<RouletteMessage | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const allRestaurants = useMemo(() => getAllRestaurants(), []);
  const timeContext = useMemo(() => getTimeBasedTags(), []);

  // 날씨 정보 로드
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("/api/weather");
        if (res.ok) {
          const data = await res.json();
          setWeather(data);
        }
      } catch (e) {
        console.error("날씨 로드 실패:", e);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, []);

  // 취향 설정 로드는 아래 useEffect에서 통합 처리

  // 취향 설정 저장
  const handleSavePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    savePreferences(newPrefs);
    // 설정 변경 후 다시 추천
    handleRecommend(selectedMood || undefined, rouletteResult || undefined, newPrefs);
  };

  // 날씨+기분 조합 메시지 생성
  const getRecommendMessage = (): string => {
    if (!selectedMood) return "";

    const moodData = moodOptions.find(m => m.id === selectedMood);
    if (!moodData) return "";

    const moodLabel = moodData.label;

    if (!weather) {
      return `${moodData.emoji} '${moodLabel}' 기분에 딱!`;
    }

    const temp = weather.current.temperature;
    const tempDiff = weather.comparison.tempDiff;
    const icon = weather.current.icon;

    // 기온 변화가 큰 경우 (5도 이상)
    if (Math.abs(tempDiff) >= 5) {
      if (tempDiff > 0) {
        return `${icon} 어제보다 ${tempDiff}° 올랐어요! '${moodLabel}' 기분엔 시원한 ${moodLabel === "고기고기" ? "고기" : "음식"} 어때요?`;
      } else {
        return `${icon} 어제보다 ${Math.abs(tempDiff)}° 내려갔어요! '${moodLabel}' 기분엔 따뜻한 ${moodLabel === "고기고기" ? "고기 요리" : "음식"} 추천!`;
      }
    }

    // 날씨 타입별 메시지
    const weatherType = weather.current.type;
    if (weatherType === "rainy") {
      return `${icon} 비 오는 날, '${moodLabel}' 기분엔 이런 곳 어때요?`;
    }
    if (weatherType === "snowy") {
      return `${icon} 눈 오는 날, '${moodLabel}' 기분을 따뜻하게!`;
    }

    // 기본 메시지
    return `${icon} ${temp}° '${moodLabel}' 기분에 딱 맞는 추천!`;
  };

  // 추천 로직 (취향 + 날씨 + 중복방지 반영) - 3개 추천
  const getRecommendations = (mood?: string, category?: string, prefs?: UserPreferences, weatherData?: WeatherData | null, rouletteTags?: string[]): Restaurant[] => {
    const currentPrefs = prefs || preferences;
    const currentWeather = weatherData !== undefined ? weatherData : weather;
    let candidates = [...allRestaurants];

    // 평점 3.5 이상 필터
    candidates = candidates.filter(r => (r.평점 || 0) >= 3.5);

    // 룰렛 카테고리 필터 (최우선 적용 - 룰렛 결과는 반드시 지켜야 함)
    if (category && category !== "random") {
      candidates = candidates.filter(r => r.카테고리 === category);

      // 룰렛 문구 태그 필터링 (연관 메뉴 우선 추천)
      if (rouletteTags && rouletteTags.length > 0) {
        const tagFiltered = candidates.filter(r =>
          rouletteTags.some(tag =>
            r.특징.includes(tag) || r.이름.includes(tag)
          )
        );
        // 태그 매칭 식당이 3개 이상이면 그것만 사용
        if (tagFiltered.length >= 3) {
          candidates = tagFiltered;
        }
      }
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

    // 날씨 기반 필터링 (기분 선택 없을 때 적용)
    const weatherTags = currentWeather?.recommendation?.tags || [];
    if (!mood && weatherTags.length > 0) {
      const weatherFiltered = candidates.filter(r =>
        weatherTags.some(tag =>
          r.특징.includes(tag) || r.이름.includes(tag)
        )
      );
      if (weatherFiltered.length >= 3) {
        candidates = weatherFiltered;
      }
    }

    // 기분 기반 필터링
    if (mood) {
      const moodData = moodOptions.find(m => m.id === mood);
      if (moodData) {
        // 날씨와 기분 태그 결합
        const combinedTags = [...moodData.tags];
        // 날씨 태그 중 기분과 어울리는 것만 추가
        weatherTags.forEach(tag => {
          if (!combinedTags.includes(tag)) {
            combinedTags.push(tag);
          }
        });

        const categoryFiltered = candidates.filter(r =>
          moodData.categories.includes(r.카테고리)
        );
        if (categoryFiltered.length > 0) {
          candidates = categoryFiltered;
        }

        const tagFiltered = candidates.filter(r =>
          combinedTags.some(tag => r.특징.includes(tag) || r.이름.includes(tag))
        );
        if (tagFiltered.length > 0) {
          candidates = tagFiltered;
        }
      }
    }

    // 최근 추천된 식당 제외 (중복 방지)
    const recentNames = getRecentRecommendedNames();
    if (recentNames.size > 0) {
      const notRecentCandidates = candidates.filter(r => !recentNames.has(r.이름));
      // 최근 추천 제외 후에도 충분한 후보가 있으면 적용
      if (notRecentCandidates.length >= 3) {
        candidates = notRecentCandidates;
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
  const handleRecommend = (mood?: string, category?: string, prefs?: UserPreferences, weatherData?: WeatherData | null, rouletteTags?: string[]) => {
    setIsSpinning(true);
    setShowResult(false);

    setTimeout(() => {
      const restaurants = getRecommendations(mood, category, prefs, weatherData, rouletteTags);
      setRecommendedRestaurants(restaurants);
      // 추천 이력 저장
      saveRecommendationHistory(restaurants.map(r => r.이름));
      setIsSpinning(false);
      setShowResult(true);
    }, 800);
  };

  // 기분 선택
  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
    handleRecommend(moodId);
  };

  // 직전 문구와 다른 문구 선택
  const getRandomMessage = (categoryId: string, prevMessage?: RouletteMessage | null): RouletteMessage => {
    const messages = rouletteMessages[categoryId] || rouletteMessages["random"];
    if (messages.length <= 1) return messages[0];

    // 직전 문구 제외하고 선택
    const available = prevMessage
      ? messages.filter(m => m.message !== prevMessage.message)
      : messages;
    return available[Math.floor(Math.random() * available.length)];
  };

  // 다시 추천 (룰렛에서는 새로운 문구도 랜덤 선택)
  const handleReshuffle = () => {
    if (tabMode === "roulette" && rouletteResult) {
      // 직전 문구와 다른 문구 선택
      const randomMsg = getRandomMessage(rouletteResult, rouletteMessage);
      setRouletteMessage(randomMsg);
      handleRecommend(undefined, rouletteResult, undefined, undefined, randomMsg.tags);
    } else {
      handleRecommend(selectedMood || undefined);
    }
  };

  // 룰렛 결과 처리
  const handleRouletteResult = (categoryId: string) => {
    setRouletteResult(categoryId);
    // 직전 문구와 다른 문구 선택
    const randomMsg = getRandomMessage(categoryId, rouletteMessage);
    setRouletteMessage(randomMsg);
    handleRecommend(undefined, categoryId, undefined, undefined, randomMsg.tags);
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
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50 px-4 py-4 safe-area-top">
        <div className="flex items-center justify-between mb-1">
          <div className="w-8" />
          <h2 className="text-xl font-bold text-foreground text-center tracking-tight">🎲 <span className="text-orange-500">한끼</span> 추천</h2>
          <button
            onClick={() => setSettingsOpen(true)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              hasCustomPrefs ? "bg-orange-100 text-orange-600" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        {/* 날씨 정보 표시 */}
        {!weatherLoading && weather && (
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg">{weather.current.icon}</span>
            <span className="text-sm font-medium text-foreground">{weather.current.temperature}°</span>
            <span className="text-muted-foreground text-xs">{weather.current.weather}</span>
            {weather.comparison.tempDiff !== 0 && (
              <span className="text-muted-foreground text-xs">
                (어제보다 {weather.comparison.tempDiff > 0 ? "+" : ""}{weather.comparison.tempDiff}°)
              </span>
            )}
          </div>
        )}
        <p className="text-center text-muted-foreground text-sm">
          {weather?.recommendation?.message || timeContext.message}
        </p>
        {hasCustomPrefs && (
          <p className="text-center text-orange-500 text-xs mt-1">
            ⚙️ 내 취향이 반영되고 있어요
          </p>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 탭 선택 */}
        <div className="flex gap-2 p-1 bg-white rounded-xl shadow-sm">
          <button
            onClick={() => {
              setTabMode("mood");
              setRouletteResult(null);
              setRouletteMessage(null);
              setShowResult(false);
              setRecommendedRestaurants([]);
            }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              tabMode === "mood"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            😊 기분별 추천
          </button>
          <button
            onClick={() => {
              setTabMode("roulette");
              setSelectedMood(null);
              setRouletteResult(null);
              setRouletteMessage(null);
              setShowResult(false);
              setRecommendedRestaurants([]);
            }}
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
                  {tabMode === "roulette" && rouletteMessage
                    ? rouletteMessage.message
                    : selectedMood
                    ? getRecommendMessage()
                    : weather
                    ? `${weather.current.icon} ${weather.recommendation.message}`
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
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <p className="text-gray-500 text-sm">
                {tabMode === "roulette"
                  ? "🎡 음식 고르기가 어려우면 룰렛을 돌려보세요!"
                  : "😊 오늘 기분을 선택해주세요!"}
              </p>
            </div>
          )}
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
