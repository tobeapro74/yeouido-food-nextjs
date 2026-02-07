import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { createCacheHeaders, CACHE_PRESETS } from "@/lib/cache";

// 실시간 평점 캐시 타입
interface RatingCache {
  restaurantName: string;
  rating: number | null;
  userRatingsTotal: number | null;
  updatedAt: Date;
}

// GET: 모든 식당의 실시간 평점 조회
export async function GET() {
  try {
    const db = await getDb();
    const collection = db.collection<RatingCache>("google_reviews_cache");

    // 모든 캐시된 평점 조회
    const ratings = await collection
      .find({}, { projection: { restaurantName: 1, rating: 1, userRatingsTotal: 1, updatedAt: 1 } })
      .toArray();

    // 맵 형태로 변환
    const ratingsMap: Record<string, { rating: number | null; reviewCount: number | null }> = {};
    for (const r of ratings) {
      ratingsMap[r.restaurantName] = {
        rating: r.rating,
        reviewCount: r.userRatingsTotal,
      };
    }

    // 캐시 헤더 추가 (1분 캐시, 5분 stale-while-revalidate)
    const headers = createCacheHeaders(CACHE_PRESETS.dynamic);

    return NextResponse.json({
      success: true,
      count: ratings.length,
      ratings: ratingsMap,
    }, { headers });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json({
      success: false,
      error: String(error),
      ratings: {}
    }, { status: 500 });
  }
}
