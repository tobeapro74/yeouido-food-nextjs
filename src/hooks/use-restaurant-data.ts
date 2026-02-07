"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { imageCache, ratingsCache, buildingCache, businessStatusCache, storageCache } from "@/lib/cache";

interface BulkInfoResult {
  restaurantName: string;
  image?: {
    photoUrl: string | null;
    cached: boolean;
  };
  rating?: {
    rating: number | null;
    reviewCount: number | null;
  };
  building?: {
    name: string | null;
  };
  isClosed?: boolean;
}

interface RestaurantData {
  imageUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  buildingName: string | null;
  isClosed: boolean;
  isLoading: boolean;
}

type RestaurantDataMap = Record<string, RestaurantData>;

const STORAGE_KEY = "bulk_restaurant_data";
const STORAGE_TTL = 30 * 60 * 1000; // 30분

// 데이터 프리페치 함수
export async function prefetchRestaurantData(names: string[]): Promise<void> {
  if (names.length === 0) return;

  // 이미 캐시된 항목 제외
  const uncachedNames = names.filter((name) => !imageCache.has(name));
  if (uncachedNames.length === 0) return;

  try {
    const res = await fetch("/api/restaurants/bulk-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names: uncachedNames }),
    });

    if (!res.ok) return;

    const data = await res.json();
    if (!data.success) return;

    // 캐시에 저장
    for (const result of data.results as BulkInfoResult[]) {
      if (result.isClosed) {
        businessStatusCache.set(result.restaurantName, true);
      }
      if (result.image?.photoUrl) {
        imageCache.set(result.restaurantName, result.image.photoUrl);
      }
      if (result.rating) {
        ratingsCache.set(result.restaurantName, {
          rating: result.rating.rating,
          reviewCount: result.rating.reviewCount,
        });
      }
      if (result.building?.name) {
        buildingCache.set(result.restaurantName, result.building.name);
      }
    }

    // 로컬 스토리지에도 저장 (앱 재시작 시 활용)
    const storageData: Record<string, Partial<RestaurantData>> = {};
    for (const result of data.results as BulkInfoResult[]) {
      storageData[result.restaurantName] = {
        imageUrl: result.image?.photoUrl || null,
        rating: result.rating?.rating ?? null,
        reviewCount: result.rating?.reviewCount ?? null,
        buildingName: result.building?.name || null,
        isClosed: result.isClosed || false,
      };
    }
    storageCache.set(STORAGE_KEY, storageData, STORAGE_TTL);
  } catch (error) {
    console.error("Prefetch error:", error);
  }
}

// 단일 식당 데이터 훅
export function useRestaurantData(restaurantName: string): RestaurantData {
  const [data, setData] = useState<RestaurantData>(() => {
    // 캐시에서 초기값 로드
    const cached = {
      imageUrl: imageCache.get(restaurantName) || null,
      rating: ratingsCache.get(restaurantName)?.rating ?? null,
      reviewCount: ratingsCache.get(restaurantName)?.reviewCount ?? null,
      buildingName: buildingCache.get(restaurantName) || null,
      isClosed: businessStatusCache.get(restaurantName) || false,
      isLoading: !imageCache.has(restaurantName),
    };
    return cached;
  });

  useEffect(() => {
    // 이미 캐시되어 있으면 스킵
    if (imageCache.has(restaurantName)) {
      setData((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    // 로컬 스토리지 확인
    const storedData = storageCache.get<Record<string, Partial<RestaurantData>>>(STORAGE_KEY);
    if (storedData?.[restaurantName]) {
      const stored = storedData[restaurantName];
      setData({
        imageUrl: stored.imageUrl || null,
        rating: stored.rating ?? null,
        reviewCount: stored.reviewCount ?? null,
        buildingName: stored.buildingName || null,
        isClosed: stored.isClosed || false,
        isLoading: false,
      });

      // 메모리 캐시에도 저장
      if (stored.imageUrl) imageCache.set(restaurantName, stored.imageUrl);
      if (stored.rating != null) {
        ratingsCache.set(restaurantName, {
          rating: stored.rating,
          reviewCount: stored.reviewCount ?? null,
        });
      }
      if (stored.buildingName) buildingCache.set(restaurantName, stored.buildingName);
      if (stored.isClosed) businessStatusCache.set(restaurantName, true);

      return;
    }

    // API 호출
    const fetchData = async () => {
      try {
        const res = await fetch("/api/restaurants/bulk-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names: [restaurantName] }),
        });

        if (!res.ok) throw new Error("Failed to fetch");

        const json = await res.json();
        if (!json.success || !json.results?.[0]) return;

        const result = json.results[0] as BulkInfoResult;

        // 캐시 업데이트
        if (result.isClosed) {
          businessStatusCache.set(restaurantName, true);
        }
        if (result.image?.photoUrl) {
          imageCache.set(restaurantName, result.image.photoUrl);
        }
        if (result.rating) {
          ratingsCache.set(restaurantName, {
            rating: result.rating.rating,
            reviewCount: result.rating.reviewCount,
          });
        }
        if (result.building?.name) {
          buildingCache.set(restaurantName, result.building.name);
        }

        setData({
          imageUrl: result.image?.photoUrl || null,
          rating: result.rating?.rating ?? null,
          reviewCount: result.rating?.reviewCount ?? null,
          buildingName: result.building?.name || null,
          isClosed: result.isClosed || false,
          isLoading: false,
        });
      } catch (error) {
        console.error("Fetch error:", error);
        setData((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();
  }, [restaurantName]);

  return data;
}

// 여러 식당 데이터 훅 (배치)
export function useRestaurantsData(restaurantNames: string[]): {
  data: RestaurantDataMap;
  isLoading: boolean;
  refetch: () => void;
} {
  const [dataMap, setDataMap] = useState<RestaurantDataMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (restaurantNames.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 캐시된 데이터 먼저 로드
    const initialData: RestaurantDataMap = {};
    const uncachedNames: string[] = [];

    for (const name of restaurantNames) {
      if (imageCache.has(name)) {
        initialData[name] = {
          imageUrl: imageCache.get(name) || null,
          rating: ratingsCache.get(name)?.rating ?? null,
          reviewCount: ratingsCache.get(name)?.reviewCount ?? null,
          buildingName: buildingCache.get(name) || null,
          isClosed: businessStatusCache.get(name) || false,
          isLoading: false,
        };
      } else {
        uncachedNames.push(name);
        initialData[name] = {
          imageUrl: null,
          rating: null,
          reviewCount: null,
          buildingName: null,
          isClosed: false,
          isLoading: true,
        };
      }
    }

    setDataMap(initialData);

    if (uncachedNames.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/restaurants/bulk-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: uncachedNames }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const json = await res.json();
      if (!json.success) throw new Error("API error");

      const updates: RestaurantDataMap = { ...initialData };

      for (const result of json.results as BulkInfoResult[]) {
        // 캐시 업데이트
        if (result.isClosed) {
          businessStatusCache.set(result.restaurantName, true);
        }
        if (result.image?.photoUrl) {
          imageCache.set(result.restaurantName, result.image.photoUrl);
        }
        if (result.rating) {
          ratingsCache.set(result.restaurantName, {
            rating: result.rating.rating,
            reviewCount: result.rating.reviewCount,
          });
        }
        if (result.building?.name) {
          buildingCache.set(result.restaurantName, result.building.name);
        }

        updates[result.restaurantName] = {
          imageUrl: result.image?.photoUrl || null,
          rating: result.rating?.rating ?? null,
          reviewCount: result.rating?.reviewCount ?? null,
          buildingName: result.building?.name || null,
          isClosed: result.isClosed || false,
          isLoading: false,
        };
      }

      setDataMap(updates);
    } catch (error) {
      console.error("Bulk fetch error:", error);
      // 에러 시 로딩 상태만 해제
      setDataMap((prev) => {
        const updated = { ...prev };
        for (const name of uncachedNames) {
          if (updated[name]) {
            updated[name] = { ...updated[name], isLoading: false };
          }
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [restaurantNames]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchData();
    }
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchedRef.current = false;
    fetchData();
  }, [fetchData]);

  return { data: dataMap, isLoading, refetch };
}
