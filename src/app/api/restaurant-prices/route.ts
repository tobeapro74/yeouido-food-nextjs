import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAllRestaurants } from "@/data/yeouido-food";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_NEW_KEY;

// 가격대 정보 인터페이스
interface RestaurantPrice {
  restaurantName: string;
  placeId: string | null;
  priceLevel: string | null;
  priceRange: string | null;
  updatedAt: Date;
}

// priceLevel을 한글 가격대로 변환
function priceLevelToRange(priceLevel: string | null): string | null {
  switch (priceLevel) {
    case "PRICE_LEVEL_FREE":
      return "무료";
    case "PRICE_LEVEL_INEXPENSIVE":
      return "₩10,000 미만";
    case "PRICE_LEVEL_MODERATE":
      return "₩10,000~20,000";
    case "PRICE_LEVEL_EXPENSIVE":
      return "₩20,000~50,000";
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "₩50,000 이상";
    default:
      return null;
  }
}

// 식당 이름으로 Google Places에서 가격대 정보 조회
async function fetchPriceInfo(restaurantName: string, address: string): Promise<{
  placeId: string | null;
  priceLevel: string | null;
  priceRange: string | null;
}> {
  try {
    const searchUrl = "https://places.googleapis.com/v1/places:searchText";
    const response = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY!,
        "X-Goog-FieldMask": "places.id,places.displayName,places.priceLevel"
      },
      body: JSON.stringify({
        textQuery: `${restaurantName} ${address}`,
        languageCode: "ko"
      })
    });

    const data = await response.json();
    const firstPlace = data.places?.[0];

    if (!firstPlace) {
      return { placeId: null, priceLevel: null, priceRange: null };
    }

    const priceLevel = firstPlace.priceLevel || null;
    const priceRange = priceLevelToRange(priceLevel);

    return {
      placeId: firstPlace.id || null,
      priceLevel,
      priceRange
    };
  } catch (error) {
    console.error(`Error fetching price info for ${restaurantName}:`, error);
    return { placeId: null, priceLevel: null, priceRange: null };
  }
}

// GET: 모든 식당의 가격대 정보 조회
export async function GET() {
  try {
    const db = await getDb();
    const collection = db.collection<RestaurantPrice>("restaurant_prices");

    const prices = await collection.find({}).toArray();

    return NextResponse.json({
      count: prices.length,
      prices: prices.map(p => ({
        restaurantName: p.restaurantName,
        priceLevel: p.priceLevel,
        priceRange: p.priceRange
      }))
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST: 가격대 정보 일괄 수집 (관리자용)
export async function POST(request: NextRequest) {
  // 간단한 보안 체크
  const searchParams = request.nextUrl.searchParams;
  const adminKey = searchParams.get("key")?.trim();
  const expectedKey = process.env.ADMIN_SECRET_KEY?.trim();

  if (!expectedKey || adminKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: "Google API key not configured" }, { status: 500 });
  }

  try {
    const db = await getDb();
    const collection = db.collection<RestaurantPrice>("restaurant_prices");

    // 모든 식당 가져오기
    const restaurants = getAllRestaurants();

    // 이미 저장된 식당 확인
    const existing = await collection.find({}).toArray();
    const existingNames = new Set(existing.map(e => e.restaurantName));

    // 아직 저장되지 않은 식당만 필터링
    const toProcess = restaurants.filter(r => !existingNames.has(r.이름));

    const results: { name: string; priceRange: string | null; status: string }[] = [];
    let processed = 0;

    // 배치 처리 (API 제한 고려, 한 번에 5개씩)
    const batchSize = 5;
    for (let i = 0; i < toProcess.length; i += batchSize) {
      const batch = toProcess.slice(i, i + batchSize);

      await Promise.all(batch.map(async (restaurant) => {
        const { placeId, priceLevel, priceRange } = await fetchPriceInfo(
          restaurant.이름,
          restaurant.주소
        );

        await collection.updateOne(
          { restaurantName: restaurant.이름 },
          {
            $set: {
              restaurantName: restaurant.이름,
              placeId,
              priceLevel,
              priceRange,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );

        results.push({
          name: restaurant.이름,
          priceRange,
          status: "saved"
        });
        processed++;
      }));

      // API 제한 방지를 위한 딜레이
      if (i + batchSize < toProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      message: "Price info collection completed",
      total: restaurants.length,
      alreadyExisted: existingNames.size,
      processed,
      results
    });
  } catch (error) {
    console.error("Error collecting price info:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
