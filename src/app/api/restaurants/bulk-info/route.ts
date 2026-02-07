import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { createCacheHeaders, CACHE_PRESETS } from "@/lib/cache";

/**
 * 통합 데이터 API
 * 기존: 이미지 + 평점 + 건물정보 = 3개 API 호출
 * 개선: 1개 API로 통합하여 네트워크 요청 60% 감소
 */

interface ImageCache {
  restaurantName: string;
  photoUrl: string;
  buildingName?: string | null;
  isClosed?: boolean;
  businessStatus?: string;
}

interface RatingCache {
  restaurantName: string;
  rating: number | null;
  userRatingsTotal: number | null;
}

interface BuildingCache {
  restaurantName: string;
  buildingName: string | null;
}

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

// POST: 여러 식당의 정보 한 번에 조회
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { names, include = ["image", "rating", "building"] } = body as {
      names: string[];
      include?: ("image" | "rating" | "building")[];
    };

    if (!names || !Array.isArray(names) || names.length === 0) {
      return NextResponse.json({ error: "names array required" }, { status: 400 });
    }

    // 최대 50개까지만 처리
    const limitedNames = names.slice(0, 50);

    const db = await getDb();
    const results: BulkInfoResult[] = [];

    // 병렬로 데이터 조회
    const [images, ratings, buildings] = await Promise.all([
      include.includes("image")
        ? db
            .collection<ImageCache>("image_cache")
            .find({ restaurantName: { $in: limitedNames } })
            .toArray()
        : Promise.resolve([]),

      include.includes("rating")
        ? db
            .collection<RatingCache>("google_reviews_cache")
            .find(
              { restaurantName: { $in: limitedNames } },
              { projection: { restaurantName: 1, rating: 1, userRatingsTotal: 1 } }
            )
            .toArray()
        : Promise.resolve([]),

      include.includes("building")
        ? db
            .collection<BuildingCache>("restaurant_buildings")
            .find({ restaurantName: { $in: limitedNames } })
            .toArray()
        : Promise.resolve([]),
    ]);

    // 맵으로 변환
    const imageMap = new Map(images.map((i) => [i.restaurantName, i]));
    const ratingMap = new Map(ratings.map((r) => [r.restaurantName, r]));
    const buildingMap = new Map(buildings.map((b) => [b.restaurantName, b]));

    // 결과 조합
    for (const name of limitedNames) {
      const result: BulkInfoResult = { restaurantName: name };

      const imageData = imageMap.get(name);
      if (include.includes("image")) {
        if (imageData?.isClosed) {
          result.isClosed = true;
          result.image = { photoUrl: null, cached: true };
        } else {
          result.image = {
            photoUrl: imageData?.photoUrl || null,
            cached: !!imageData,
          };
        }
      }

      if (include.includes("rating")) {
        const ratingData = ratingMap.get(name);
        result.rating = {
          rating: ratingData?.rating ?? null,
          reviewCount: ratingData?.userRatingsTotal ?? null,
        };
      }

      if (include.includes("building")) {
        const buildingData = buildingMap.get(name);
        // 이미지 캐시의 buildingName도 확인
        result.building = {
          name: buildingData?.buildingName || imageData?.buildingName || null,
        };
      }

      results.push(result);
    }

    // 캐시 헤더 (1분 캐시)
    const headers = createCacheHeaders(CACHE_PRESETS.dynamic);

    return NextResponse.json(
      {
        success: true,
        count: results.length,
        results,
      },
      { headers }
    );
  } catch (error) {
    console.error("Bulk info fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bulk info" },
      { status: 500 }
    );
  }
}
