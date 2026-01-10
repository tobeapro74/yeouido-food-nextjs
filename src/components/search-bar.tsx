"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, MapPin, Building2, UtensilsCrossed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Restaurant, searchRestaurants } from "@/data/yeouido-food";

interface SearchBarProps {
  onSelect: (restaurant: Restaurant) => void;
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length >= 1) {
      const searchResults = searchRestaurants(query);
      setResults(searchResults.slice(0, 10)); // 최대 10개 결과
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

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
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">"{query}"에 대한 검색 결과가 없습니다</p>
          <p className="text-xs mt-1">다른 키워드로 검색해보세요</p>
        </div>
      )}
    </div>
  );
}
