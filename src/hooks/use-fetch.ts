"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * SWR과 유사한 데이터 페칭 훅
 * - 자동 캐싱
 * - 자동 재검증
 * - 에러 재시도
 * - 중복 요청 제거
 */

interface FetchOptions<T> {
  // 초기 데이터
  fallbackData?: T;
  // 포커스 시 재검증
  revalidateOnFocus?: boolean;
  // 마운트 시 재검증
  revalidateOnMount?: boolean;
  // 중복 제거 간격 (ms)
  dedupingInterval?: number;
  // 에러 재시도 횟수
  errorRetryCount?: number;
  // 재시도 간격 (ms)
  errorRetryInterval?: number;
  // 자동 새로고침 간격 (ms, 0이면 비활성화)
  refreshInterval?: number;
  // 조건부 페칭
  shouldFetch?: boolean;
}

interface FetchState<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
}

// 전역 캐시
const cache = new Map<string, { data: unknown; timestamp: number }>();
const ongoingRequests = new Map<string, Promise<unknown>>();

const DEFAULT_DEDUPING_INTERVAL = 2000; // 2초
const DEFAULT_ERROR_RETRY_COUNT = 3;
const DEFAULT_ERROR_RETRY_INTERVAL = 5000; // 5초

export function useFetch<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: FetchOptions<T> = {}
): FetchState<T> & { mutate: (data?: T) => void; revalidate: () => Promise<void> } {
  const {
    fallbackData,
    revalidateOnFocus = false,
    revalidateOnMount = true,
    dedupingInterval = DEFAULT_DEDUPING_INTERVAL,
    errorRetryCount = DEFAULT_ERROR_RETRY_COUNT,
    errorRetryInterval = DEFAULT_ERROR_RETRY_INTERVAL,
    refreshInterval = 0,
    shouldFetch = true,
  } = options;

  const [state, setState] = useState<FetchState<T>>(() => {
    // 캐시에서 초기값 로드
    if (key) {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < dedupingInterval) {
        return {
          data: cached.data as T,
          error: undefined,
          isLoading: false,
          isValidating: false,
        };
      }
    }
    return {
      data: fallbackData,
      error: undefined,
      isLoading: revalidateOnMount && shouldFetch,
      isValidating: false,
    };
  });

  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const fetchData = useCallback(
    async (isRevalidation = false) => {
      if (!key || !shouldFetch) return;

      // 중복 요청 제거
      const existing = ongoingRequests.get(key);
      if (existing) {
        try {
          const data = (await existing) as T;
          if (mountedRef.current) {
            setState((prev) => ({
              ...prev,
              data,
              isLoading: false,
              isValidating: false,
            }));
          }
        } catch {
          // 기존 요청 에러는 무시
        }
        return;
      }

      if (!isRevalidation) {
        setState((prev) => ({ ...prev, isLoading: true }));
      } else {
        setState((prev) => ({ ...prev, isValidating: true }));
      }

      const request = fetcher();
      ongoingRequests.set(key, request);

      try {
        const data = await request;

        // 캐시 업데이트
        cache.set(key, { data, timestamp: Date.now() });
        retryCountRef.current = 0;

        if (mountedRef.current) {
          setState({
            data,
            error: undefined,
            isLoading: false,
            isValidating: false,
          });
        }
      } catch (error) {
        if (mountedRef.current) {
          // 재시도 로직
          if (retryCountRef.current < errorRetryCount) {
            retryCountRef.current++;
            setTimeout(() => {
              fetchData(isRevalidation);
            }, errorRetryInterval);
          } else {
            setState((prev) => ({
              ...prev,
              error: error as Error,
              isLoading: false,
              isValidating: false,
            }));
          }
        }
      } finally {
        ongoingRequests.delete(key);
      }
    },
    [key, shouldFetch, fetcher, dedupingInterval, errorRetryCount, errorRetryInterval]
  );

  // 수동 데이터 업데이트
  const mutate = useCallback(
    (newData?: T) => {
      if (newData !== undefined) {
        setState((prev) => ({ ...prev, data: newData }));
        if (key) {
          cache.set(key, { data: newData, timestamp: Date.now() });
        }
      } else {
        // 재검증
        fetchData(true);
      }
    },
    [key, fetchData]
  );

  // 재검증
  const revalidate = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // 마운트 시 페치
  useEffect(() => {
    mountedRef.current = true;

    if (revalidateOnMount && shouldFetch) {
      fetchData();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData, revalidateOnMount, shouldFetch]);

  // 포커스 시 재검증
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      fetchData(true);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchData, revalidateOnFocus]);

  // 자동 새로고침
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { ...state, mutate, revalidate };
}

// 평점 데이터 전용 훅
export function useRatings() {
  return useFetch(
    "ratings",
    async () => {
      const res = await fetch("/api/restaurants/ratings");
      if (!res.ok) throw new Error("Failed to fetch ratings");
      const data = await res.json();
      return data.ratings as Record<string, { rating: number | null; reviewCount: number | null }>;
    },
    {
      dedupingInterval: 60000, // 1분
      revalidateOnFocus: false,
      errorRetryCount: 2,
    }
  );
}

// 날씨 데이터 전용 훅
export function useWeather() {
  return useFetch(
    "weather",
    async () => {
      const res = await fetch("/api/weather");
      if (!res.ok) throw new Error("Failed to fetch weather");
      return res.json();
    },
    {
      dedupingInterval: 30 * 60 * 1000, // 30분
      refreshInterval: 30 * 60 * 1000, // 30분마다 갱신
      revalidateOnFocus: false,
    }
  );
}
