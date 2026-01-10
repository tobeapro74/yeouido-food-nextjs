"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UserPreferences {
  categories: string[];
  region: "동여의도" | "서여의도" | "전체";
  priceRange: "low" | "mid" | "high" | "all";
  excludeTags: string[];
}

const defaultPreferences: UserPreferences = {
  categories: ["한식", "양식", "중식", "일식", "동남아식"],
  region: "전체",
  priceRange: "all",
  excludeTags: [],
};

const categoryOptions = [
  { id: "한식", label: "🍚 한식" },
  { id: "양식", label: "🍝 양식" },
  { id: "중식", label: "🥟 중식" },
  { id: "일식", label: "🍣 일식" },
  { id: "동남아식", label: "🍜 동남아" },
];

const regionOptions = [
  { id: "전체", label: "📍 상관없음" },
  { id: "동여의도", label: "🏙️ 동여의도" },
  { id: "서여의도", label: "🏛️ 서여의도" },
];

const priceOptions = [
  { id: "all", label: "💰 상관없음" },
  { id: "low", label: "💵 1만원 이하" },
  { id: "mid", label: "💵💵 1~2만원" },
  { id: "high", label: "💵💵💵 2만원 이상" },
];

const excludeOptions = [
  { id: "해산물", label: "🦐 해산물" },
  { id: "돼지고기", label: "🐷 돼지고기" },
  { id: "소고기", label: "🐄 소고기" },
  { id: "매운음식", label: "🌶️ 매운음식" },
  { id: "날것", label: "🍣 날것(회/육회)" },
];

interface PreferenceSettingsProps {
  open: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (preferences: UserPreferences) => void;
}

export function PreferenceSettings({
  open,
  onClose,
  preferences,
  onSave,
}: PreferenceSettingsProps) {
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences, open]);

  const toggleCategory = (categoryId: string) => {
    setLocalPrefs(prev => {
      const newCategories = prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId];
      // 최소 1개는 선택되어야 함
      if (newCategories.length === 0) return prev;
      return { ...prev, categories: newCategories };
    });
  };

  const toggleExclude = (tag: string) => {
    setLocalPrefs(prev => ({
      ...prev,
      excludeTags: prev.excludeTags.includes(tag)
        ? prev.excludeTags.filter(t => t !== tag)
        : [...prev.excludeTags, tag],
    }));
  };

  const handleSave = () => {
    onSave(localPrefs);
    onClose();
  };

  const handleReset = () => {
    setLocalPrefs(defaultPreferences);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">⚙️ 내 취향 설정</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 설정 내용 */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* 선호 카테고리 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">선호 카테고리</h3>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    localPrefs.categories.includes(cat.id)
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.label}
                  {localPrefs.categories.includes(cat.id) && (
                    <Check className="w-3 h-3 ml-1 inline" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 선호 지역 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">선호 지역</h3>
            <div className="flex flex-wrap gap-2">
              {regionOptions.map(region => (
                <button
                  key={region.id}
                  onClick={() => setLocalPrefs(prev => ({ ...prev, region: region.id as UserPreferences["region"] }))}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    localPrefs.region === region.id
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {region.label}
                </button>
              ))}
            </div>
          </div>

          {/* 가격대 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">가격대</h3>
            <div className="flex flex-wrap gap-2">
              {priceOptions.map(price => (
                <button
                  key={price.id}
                  onClick={() => setLocalPrefs(prev => ({ ...prev, priceRange: price.id as UserPreferences["priceRange"] }))}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    localPrefs.priceRange === price.id
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {price.label}
                </button>
              ))}
            </div>
          </div>

          {/* 제외할 음식 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">제외할 음식 (알러지/비선호)</h3>
            <div className="flex flex-wrap gap-2">
              {excludeOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => toggleExclude(opt.id)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    localPrefs.excludeTags.includes(opt.id)
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                  {localPrefs.excludeTags.includes(opt.id) && (
                    <X className="w-3 h-3 ml-1 inline" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            초기화
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            저장하기
          </Button>
        </div>
      </div>
    </div>
  );
}

// localStorage 유틸리티
const PREFERENCES_KEY = "yeouido-hanki-preferences";

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const saved = localStorage.getItem(PREFERENCES_KEY);
    if (saved) {
      return { ...defaultPreferences, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load preferences:", e);
  }
  return defaultPreferences;
}

export function savePreferences(preferences: UserPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (e) {
    console.error("Failed to save preferences:", e);
  }
}

export { defaultPreferences };
