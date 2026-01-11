"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ImageResult {
  restaurantName: string;
  photoUrl: string | null;
  buildingName?: string | null;
  isClosed?: boolean;
  businessStatus?: string;
  cached: boolean;
}

interface BatchState {
  images: Map<string, ImageResult>;
  loading: boolean;
  error: string | null;
}

// 글로벌 캐시 (모든 컴포넌트에서 공유)
const globalImageCache = new Map<string, ImageResult>();

export function useImageBatch(restaurantNames: string[]) {
  const [state, setState] = useState<BatchState>({
    images: new Map(),
    loading: true,
    error: null,
  });

  // 이미 요청 중인지 추적
  const fetchingRef = useRef(false);

  const fetchBatchImages = useCallback(async (names: string[]) => {
    if (names.length === 0) {
      setState({ images: new Map(), loading: false, error: null });
      return;
    }

    // 글로벌 캐시에서 이미 있는 것들 분리
    const cachedResults = new Map<string, ImageResult>();
    const uncachedNames: string[] = [];

    for (const name of names) {
      const cached = globalImageCache.get(name);
      if (cached) {
        cachedResults.set(name, cached);
      } else {
        uncachedNames.push(name);
      }
    }

    // 모든 이미지가 캐시에 있으면 바로 반환
    if (uncachedNames.length === 0) {
      setState({ images: cachedResults, loading: false, error: null });
      return;
    }

    // 이미 요청 중이면 스킵
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const response = await fetch("/api/place-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: uncachedNames }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }

      const data = await response.json();
      const results = data.results as ImageResult[];

      // 결과를 글로벌 캐시에 저장
      for (const result of results) {
        globalImageCache.set(result.restaurantName, result);
        cachedResults.set(result.restaurantName, result);
      }

      setState({ images: cachedResults, loading: false, error: null });
    } catch (err) {
      setState({
        images: cachedResults,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchBatchImages(restaurantNames);
  }, [restaurantNames.join(","), fetchBatchImages]);

  return {
    images: state.images,
    loading: state.loading,
    error: state.error,
    getImage: (name: string) => state.images.get(name) || globalImageCache.get(name),
  };
}

// 개별 이미지 조회 (캐시에 없을 때 폴백용)
export async function fetchSingleImage(restaurantName: string, query: string): Promise<ImageResult> {
  // 먼저 글로벌 캐시 확인
  const cached = globalImageCache.get(restaurantName);
  if (cached && cached.photoUrl) {
    return cached;
  }

  try {
    const res = await fetch(
      `/api/place-photo?query=${encodeURIComponent(query)}&name=${encodeURIComponent(restaurantName)}`
    );
    const data = await res.json();

    const result: ImageResult = {
      restaurantName,
      photoUrl: data.photoUrl || null,
      buildingName: data.buildingName,
      isClosed: data.isClosed,
      businessStatus: data.businessStatus,
      cached: data.cached || false,
    };

    // 글로벌 캐시에 저장
    globalImageCache.set(restaurantName, result);

    return result;
  } catch {
    return {
      restaurantName,
      photoUrl: null,
      cached: false,
    };
  }
}
