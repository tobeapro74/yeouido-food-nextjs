import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { createCacheHeaders, CACHE_PRESETS } from "@/lib/cache";

// 이미지 캐시 타입
interface ImageCache {
  restaurantName: string;
  photoUrl: string;
  buildingName?: string | null;
  isClosed?: boolean;
  businessStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 응답 타입
interface ImageResult {
  restaurantName: string;
  photoUrl: string | null;
  buildingName?: string | null;
  isClosed?: boolean;
  businessStatus?: string;
  cached: boolean;
}

// MongoDB에서 여러 이미지 한 번에 조회
async function getCachedImages(restaurantNames: string[]): Promise<Map<string, ImageCache>> {
  const resultMap = new Map<string, ImageCache>();

  if (restaurantNames.length === 0) {
    return resultMap;
  }

  try {
    const db = await getDb();
    const collection = db.collection<ImageCache>("image_cache");

    // $in 연산자로 한 번에 여러 개 조회
    const cached = await collection.find({
      restaurantName: { $in: restaurantNames }
    }).toArray();

    for (const item of cached) {
      resultMap.set(item.restaurantName, item);
    }
  } catch (error) {
    console.error("Failed to fetch cached images:", error);
  }

  return resultMap;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { names } = body as { names: string[] };

    if (!names || !Array.isArray(names) || names.length === 0) {
      return NextResponse.json({ error: "names array required" }, { status: 400 });
    }

    // 최대 20개까지만 처리
    const limitedNames = names.slice(0, 20);

    // MongoDB에서 한 번에 조회
    const cachedMap = await getCachedImages(limitedNames);

    // 결과 매핑
    const results: ImageResult[] = limitedNames.map((name) => {
      const cached = cachedMap.get(name);

      if (cached) {
        if (cached.isClosed) {
          return {
            restaurantName: name,
            photoUrl: null,
            isClosed: true,
            businessStatus: cached.businessStatus,
            cached: true,
          };
        }
        return {
          restaurantName: name,
          photoUrl: cached.photoUrl,
          buildingName: cached.buildingName,
          cached: true,
        };
      }

      // 캐시에 없는 경우 null 반환 (클라이언트에서 개별 API 호출 필요)
      return {
        restaurantName: name,
        photoUrl: null,
        cached: false,
      };
    });

    // 캐시 헤더 추가 (5분 캐시, 10분 stale-while-revalidate)
    const headers = createCacheHeaders(CACHE_PRESETS.static);

    return NextResponse.json({ results }, { headers });
  } catch (error) {
    console.error("Batch image fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
