import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

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

// MongoDB에서 캐시된 리뷰 조회
async function getCachedReviews(restaurantName: string): Promise<ReviewCache | null> {
  try {
    const db = await getDb();
    const collection = db.collection<ReviewCache>("google_reviews_cache");
    const cached = await collection.findOne({ restaurantName });

    // 캐시가 24시간 이상 오래된 경우 null 반환
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.updatedAt).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24시간
      if (cacheAge > maxAge) {
        return null;
      }
    }
    return cached;
  } catch {
    return null;
  }
}

// MongoDB에 리뷰 캐시 저장
async function saveReviewCache(data: Omit<ReviewCache, "createdAt" | "updatedAt">): Promise<void> {
  try {
    const db = await getDb();
    const collection = db.collection<ReviewCache>("google_reviews_cache");
    const now = new Date();
    await collection.updateOne(
      { restaurantName: data.restaurantName },
      {
        $set: { ...data, updatedAt: now },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("Failed to save review cache:", error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const restaurantName = decodeURIComponent(name);

    // 1. 캐시 확인
    const cached = await getCachedReviews(restaurantName);
    if (cached) {
      return NextResponse.json({
        reviews: cached.reviews,
        rating: cached.rating,
        userRatingsTotal: cached.userRatingsTotal,
        cached: true
      });
    }

    // 2. API 키 확인
    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // 3. Place ID 검색
    const searchQuery = `${restaurantName} 여의도 Seoul Korea`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      searchQuery
    )}&inputtype=textquery&fields=place_id&key=${GOOGLE_API_KEY}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.candidates || searchData.candidates.length === 0) {
      return NextResponse.json({ reviews: [], rating: null, userRatingsTotal: null });
    }

    const placeId = searchData.candidates[0].place_id;

    // 4. Place Details에서 리뷰 가져오기
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&language=ko&key=${GOOGLE_API_KEY}`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    const reviews: GoogleReview[] = detailData.result?.reviews || [];
    const rating = detailData.result?.rating || null;
    const userRatingsTotal = detailData.result?.user_ratings_total || null;

    // 5. 캐시 저장
    await saveReviewCache({
      restaurantName,
      placeId,
      reviews,
      rating,
      userRatingsTotal
    });

    return NextResponse.json({
      reviews,
      rating,
      userRatingsTotal,
      cached: false
    });
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
