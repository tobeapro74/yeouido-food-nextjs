"use client";

import { useState, useEffect, useCallback } from "react";

interface RatingsMap {
  [restaurantName: string]: {
    rating: number | null;
    reviewCount: number | null;
  };
}

interface UseRealTimeRatingsResult {
  ratings: RatingsMap;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRealTimeRatings(): UseRealTimeRatingsResult {
  const [ratings, setRatings] = useState<RatingsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRatings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/restaurants/ratings");
      const data = await res.json();

      if (data.success) {
        setRatings(data.ratings || {});
      } else {
        setError(data.error || "Failed to fetch ratings");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  return { ratings, isLoading, error, refetch: fetchRatings };
}

// 실시간 평점을 적용하여 식당 목록을 정렬하는 유틸리티 함수
export function sortByRealTimeRating<T extends { 이름: string; 평점?: number | null }>(
  restaurants: T[],
  ratingsMap: RatingsMap
): T[] {
  return [...restaurants].sort((a, b) => {
    // 실시간 평점 우선, 없으면 정적 평점 사용
    const ratingA = ratingsMap[a.이름]?.rating ?? a.평점 ?? 0;
    const ratingB = ratingsMap[b.이름]?.rating ?? b.평점 ?? 0;
    return ratingB - ratingA;
  });
}
