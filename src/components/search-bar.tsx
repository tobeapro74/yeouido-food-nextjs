"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, MapPin, Building2, UtensilsCrossed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Restaurant, searchRestaurants } from "@/data/yeouido-food";

interface SearchBarProps {
  onSelect: (restaurant: Restaurant) => void;
}

// 커스텀 맛집을 Restaurant 형식으로 변환
interface CustomRestaurant {
  place_id: string;
  name: string;
  address: string;
  category: string;
  feature?: string;
  region: string;
  coordinates?: { lat: number; lng: number };
  google_rating?: number;
  photos?: string[];
}

function convertCustomToRestaurant(custom: CustomRestaurant): Restaurant {
  return {
    이름: custom.name,
    카테고리: custom.category as Restaurant["카테고리"],
    평점: custom.google_rating || 0,
    특징: custom.feature || "",
    지역: custom.region as Restaurant["지역"],
    주소: custom.address,
  };
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 커스텀 맛집 검색 함수
  const searchCustomRestaurants = useCallback(async (searchQuery: string): Promise<Restaurant[]> => {
    try {
      const res = await fetch("/api/custom-restaurants");
      const data = await res.json();
      if (data.success && data.data) {
        const customRestaurants = data.data as CustomRestaurant[];
        const filtered = customRestaurants.filter((r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.category.includes(searchQuery) ||
          (r.feature && r.feature.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        return filtered.map(convertCustomToRestaurant);
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (query.trim().length >= 1) {
      // 기존 데이터 검색
      const localResults = searchRestaurants(query);

      // 커스텀 맛집 검색 (비동기)
      searchCustomRestaurants(query).then((customResults) => {
        // 중복 제거 (이름 기준)
        const existingNames = new Set(localResults.map((r) => r.이름));
        const uniqueCustom = customResults.filter((r) => !existingNames.has(r.이름));

        // 합쳐서 결과 설정
        const combined = [...localResults, ...uniqueCustom];
        setResults(combined.slice(0, 10));
        setIsOpen(true);
      });
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, searchCustomRestaurants]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (restaurant: Restaurant) => {
    onSelect(restaurant);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const categoryIcons: Record<string, string> = {
    한식: "🍚",
    양식: "🥩",
    중식: "🥟",
    일식: "🍣",
    동남아식: "🍜",
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="식당, 빌딩, 음식, 도로명 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (query.trim().length >= 1) setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          className="pl-9 pr-9 h-10 bg-background/80 backdrop-blur-sm border-border/50"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-[60vh] overflow-y-auto">
          {results.map((restaurant, index) => (
            <button
              key={`${restaurant.이름}-${index}`}
              onClick={() => handleSelect(restaurant)}
              className="w-full p-3 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">
                  {categoryIcons[restaurant.카테고리]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{restaurant.이름}</span>
                    {restaurant.평점 && (
                      <span className="text-xs text-amber-500 flex-shrink-0">
                        ★ {restaurant.평점}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{restaurant.주소}</span>
                  </div>
                  {restaurant.빌딩 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      <span>{restaurant.빌딩}</span>
                    </div>
                  )}
                  {restaurant.특징 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <UtensilsCrossed className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{restaurant.특징}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {isOpen && query.trim().length >= 1 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50">
          <EmptyState
            icon={Search}
            title={`"${query}"에 대한 검색 결과가 없습니다`}
            description="다른 키워드로 검색해보세요"
          />
        </div>
      )}
    </div>
  );
}
