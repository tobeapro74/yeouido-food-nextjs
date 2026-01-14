import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAllRestaurants } from "@/data/yeouido-food";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

// Google 리뷰 타입
interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  language?: string;
}

// 리뷰 캐시 타입
interface ReviewCache {
  restaurantName: string;
  placeId: string;
  reviews: GoogleReview[];
  rating: number | null;
  userRatingsTotal: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Google Places API에서 리뷰 가져오기
async function fetchGoogleReviews(restaurantName: string): Promise<{
  placeId: string;
  reviews: GoogleReview[];
  rating: number | null;
  userRatingsTotal: number | null;
} | null> {
  if (!GOOGLE_API_KEY) {
    return null;
  }

  try {
    // Place ID 검색
    const searchQuery = `${restaurantName} 여의도 Seoul Korea`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      searchQuery
    )}&inputtype=textquery&fields=place_id&key=${GOOGLE_API_KEY}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.candidates || searchData.candidates.length === 0) {
      return null;
    }

    const placeId = searchData.candidates[0].place_id;

    // Place Details에서 리뷰 가져오기 (최신순 정렬)
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&language=ko&reviews_sort=newest&key=${GOOGLE_API_KEY}`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    const reviews: GoogleReview[] = (detailData.result?.reviews || [])
      .sort((a: GoogleReview, b: GoogleReview) => b.time - a.time);
    const rating = detailData.result?.rating || null;
    const userRatingsTotal = detailData.result?.user_ratings_total || null;

    return { placeId, reviews, rating, userRatingsTotal };
  } catch (error) {
    console.error(`Error fetching reviews for ${restaurantName}:`, error);
    return null;
  }
}

// Vercel Cron Job 보안 검증
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");

  // Vercel Cron은 CRON_SECRET 환경변수가 설정된 경우 Authorization 헤더를 보냄
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
  }

  // 개발 환경이거나 CRON_SECRET이 설정되지 않은 경우 통과
  return process.env.NODE_ENV === "development";
}

export async function GET(request: NextRequest) {
  // Cron 요청 검증
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const db = await getDb();
    const collection = db.collection<ReviewCache>("google_reviews_cache");

    // 모든 식당 목록 가져오기
    const allRestaurants = getAllRestaurants();

    const stats = {
      total: allRestaurants.length,
      updated: 0,
      failed: 0,
      skipped: 0,
    };

    // 배치 처리: 한 번에 5개씩 (API 레이트 제한 고려)
    const batchSize = 5;
    const delayBetweenBatches = 2000; // 2초

    for (let i = 0; i < allRestaurants.length; i += batchSize) {
      const batch = allRestaurants.slice(i, i + batchSize);

      const batchPromises = batch.map(async (restaurant) => {
        const restaurantName = restaurant.이름;

        try {
          const reviewData = await fetchGoogleReviews(restaurantName);

          if (reviewData) {
            const now = new Date();
            await collection.updateOne(
              { restaurantName },
              {
                $set: {
                  placeId: reviewData.placeId,
                  reviews: reviewData.reviews,
                  rating: reviewData.rating,
                  userRatingsTotal: reviewData.userRatingsTotal,
                  updatedAt: now,
                },
                $setOnInsert: { createdAt: now },
              },
              { upsert: true }
            );
            stats.updated++;
          } else {
            stats.skipped++;
          }
        } catch {
          stats.failed++;
        }
      });

      await Promise.all(batchPromises);

      // 마지막 배치가 아니면 딜레이
      if (i + batchSize < allRestaurants.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "구글 리뷰 업데이트 완료",
      stats,
      duration: `${Math.round(duration / 1000)}초`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: String(error), timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
