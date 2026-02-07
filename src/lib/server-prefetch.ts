/**
 * 서버 컴포넌트용 데이터 프리페칭 유틸리티
 * - ISR (Incremental Static Regeneration) 지원
 * - 서버 사이드에서 데이터 미리 로드
 * - 클라이언트 초기 로딩 시간 단축
 */

import { cache } from "react";
import { connectToDatabase } from "./mongodb";

// React cache로 중복 요청 방지
export const getWeatherData = cache(async () => {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/weather`, {
      next: { revalidate: 1800 }, // 30분 ISR
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Weather prefetch error:", error);
    return null;
  }
});

// 평점 데이터 프리페칭
export const getRatingsData = cache(async () => {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("google_reviews_cache");

    const ratings = await collection
      .find({}, { projection: { restaurantName: 1, rating: 1, userRatingsTotal: 1 } })
      .toArray();

    const ratingsMap: Record<string, { rating: number | null; reviewCount: number | null }> = {};
    for (const r of ratings) {
      ratingsMap[r.restaurantName] = {
        rating: r.rating,
        reviewCount: r.userRatingsTotal,
      };
    }

    return ratingsMap;
  } catch (error) {
    console.error("Ratings prefetch error:", error);
    return {};
  }
});

// 이미지 데이터 프리페칭
export const getImagesData = cache(async (restaurantNames: string[]) => {
  if (restaurantNames.length === 0) return {};

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("image_cache");

    const images = await collection
      .find({ restaurantName: { $in: restaurantNames } })
      .toArray();

    const imagesMap: Record<string, { photoUrl: string | null; buildingName: string | null; isClosed: boolean }> = {};
    for (const img of images) {
      imagesMap[img.restaurantName] = {
        photoUrl: img.photoUrl || null,
        buildingName: img.buildingName || null,
        isClosed: img.isClosed || false,
      };
    }

    return imagesMap;
  } catch (error) {
    console.error("Images prefetch error:", error);
    return {};
  }
});

// 통합 데이터 프리페칭
export const getBulkRestaurantData = cache(async (restaurantNames: string[]) => {
  if (restaurantNames.length === 0) {
    return { images: {}, ratings: {}, buildings: {} };
  }

  try {
    const { db } = await connectToDatabase();

    const [images, ratings, buildings] = await Promise.all([
      db
        .collection("image_cache")
        .find({ restaurantName: { $in: restaurantNames } })
        .toArray(),
      db
        .collection("google_reviews_cache")
        .find(
          { restaurantName: { $in: restaurantNames } },
          { projection: { restaurantName: 1, rating: 1, userRatingsTotal: 1 } }
        )
        .toArray(),
      db
        .collection("restaurant_buildings")
        .find({ restaurantName: { $in: restaurantNames } })
        .toArray(),
    ]);

    const imagesMap: Record<string, { photoUrl: string | null; isClosed: boolean }> = {};
    const ratingsMap: Record<string, { rating: number | null; reviewCount: number | null }> = {};
    const buildingsMap: Record<string, string | null> = {};

    for (const img of images) {
      imagesMap[img.restaurantName] = {
        photoUrl: img.photoUrl || null,
        isClosed: img.isClosed || false,
      };
    }

    for (const r of ratings) {
      ratingsMap[r.restaurantName] = {
        rating: r.rating,
        reviewCount: r.userRatingsTotal,
      };
    }

    for (const b of buildings) {
      buildingsMap[b.restaurantName] = b.buildingName || null;
    }

    return { images: imagesMap, ratings: ratingsMap, buildings: buildingsMap };
  } catch (error) {
    console.error("Bulk data prefetch error:", error);
    return { images: {}, ratings: {}, buildings: {} };
  }
});

// ISR 설정 헬퍼
export const revalidateConfig = {
  // 정적 페이지: 1시간
  static: { revalidate: 3600 },
  // 동적 페이지: 5분
  dynamic: { revalidate: 300 },
  // 실시간: 캐시 안함
  realtime: { revalidate: 0 },
} as const;

// generateStaticParams 헬퍼
export function generateCategoryParams() {
  const categories = ["한식", "중식", "일식", "양식", "동남아식"];
  return categories.map((category) => ({ category }));
}

export function generateAreaParams() {
  const areas = ["여의도역", "샛강역", "국회의사당역", "IFC", "파크원"];
  return areas.map((area) => ({ area }));
}
