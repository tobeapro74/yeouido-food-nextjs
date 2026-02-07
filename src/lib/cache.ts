/**
 * 캐시 유틸리티
 * - LRU 메모리 캐시
 * - 로컬 스토리지 캐시 (클라이언트)
 * - 캐시 키 생성 헬퍼
 */

// ============================================
// LRU 캐시 (메모리)
// ============================================

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(maxSize: number = 500, defaultTTLMs: number = 10 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTLMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) return undefined;

    // TTL 체크
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // LRU: 접근된 항목을 맨 뒤로 이동
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    // 이미 존재하면 삭제 (순서 갱신)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 캐시가 가득 찼으면 가장 오래된 항목 삭제
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      timestamp: now,
      expiresAt: now + (ttlMs ?? this.defaultTTL),
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // 만료된 항목 정리
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  // 통계
  stats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// ============================================
// 로컬 스토리지 캐시 (클라이언트 전용)
// ============================================

interface StorageCacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const STORAGE_PREFIX = "yeoido_cache_";

export const storageCache = {
  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key);
      if (!stored) return null;

      const entry: StorageCacheEntry<T> = JSON.parse(stored);

      // TTL 체크
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(STORAGE_PREFIX + key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  },

  set<T>(key: string, data: T, ttlMs: number = 24 * 60 * 60 * 1000): void {
    if (typeof window === "undefined") return;

    try {
      const now = Date.now();
      const entry: StorageCacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttlMs,
      };

      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
      // 스토리지 용량 초과 시 오래된 캐시 정리
      if ((error as Error).name === "QuotaExceededError") {
        storageCache.cleanup();
        try {
          const now = Date.now();
          localStorage.setItem(
            STORAGE_PREFIX + key,
            JSON.stringify({ data, timestamp: now, expiresAt: now + ttlMs })
          );
        } catch {
          // 그래도 실패하면 포기
        }
      }
    }
  },

  delete(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_PREFIX + key);
  },

  // 만료된 캐시 정리
  cleanup(): number {
    if (typeof window === "undefined") return 0;

    const now = Date.now();
    let removed = 0;

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;

      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const entry = JSON.parse(stored) as StorageCacheEntry<unknown>;
        if (now > entry.expiresAt) {
          localStorage.removeItem(key);
          removed++;
        }
      } catch {
        // 파싱 실패한 항목도 삭제
        localStorage.removeItem(key);
        removed++;
      }
    }

    return removed;
  },

  // 전체 삭제
  clear(): void {
    if (typeof window === "undefined") return;

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  },
};

// ============================================
// 싱글톤 캐시 인스턴스
// ============================================

// 이미지 캐시: 500개, 30분 TTL
export const imageCache = new LRUCache<string>(500, 30 * 60 * 1000);

// 평점 캐시: 300개, 10분 TTL
export const ratingsCache = new LRUCache<{ rating: number | null; reviewCount: number | null }>(
  300,
  10 * 60 * 1000
);

// 리뷰 캐시: 200개, 10분 TTL
export const reviewsCache = new LRUCache<{
  reviews: unknown[];
  rating: number | null;
  reviewCount: number | null;
}>(200, 10 * 60 * 1000);

// 건물 정보 캐시: 200개, 1시간 TTL
export const buildingCache = new LRUCache<string | null>(200, 60 * 60 * 1000);

// 영업 상태 캐시: 300개, 30분 TTL
export const businessStatusCache = new LRUCache<boolean>(300, 30 * 60 * 1000);

// ============================================
// 캐시 키 생성 헬퍼
// ============================================

export function createCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(":");
}

// ============================================
// HTTP 캐시 헤더 생성
// ============================================

export interface CacheHeaderOptions {
  maxAge?: number; // 초 단위
  sMaxAge?: number; // CDN 캐시 (초 단위)
  staleWhileRevalidate?: number; // 백그라운드 갱신 허용 시간 (초)
  isPrivate?: boolean;
  noStore?: boolean;
}

export function createCacheHeaders(options: CacheHeaderOptions): Headers {
  const headers = new Headers();

  if (options.noStore) {
    headers.set("Cache-Control", "no-store");
    return headers;
  }

  const directives: string[] = [];

  if (options.isPrivate) {
    directives.push("private");
  } else {
    directives.push("public");
  }

  if (options.maxAge !== undefined) {
    directives.push(`max-age=${options.maxAge}`);
  }

  if (options.sMaxAge !== undefined) {
    directives.push(`s-maxage=${options.sMaxAge}`);
  }

  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  if (directives.length > 0) {
    headers.set("Cache-Control", directives.join(", "));
  }

  return headers;
}

// 자주 사용되는 캐시 헤더 프리셋
export const CACHE_PRESETS = {
  // 정적 데이터: 5분 캐시, 10분 stale
  static: { maxAge: 300, sMaxAge: 300, staleWhileRevalidate: 600 },

  // 동적 데이터: 1분 캐시, 5분 stale
  dynamic: { maxAge: 60, sMaxAge: 60, staleWhileRevalidate: 300 },

  // 실시간 데이터: 캐시 안함
  realtime: { noStore: true },

  // 사용자별 데이터: private 캐시
  private: { isPrivate: true, maxAge: 300 },

  // 이미지: 1시간 캐시
  image: { maxAge: 3600, sMaxAge: 3600, staleWhileRevalidate: 86400 },
} as const;
