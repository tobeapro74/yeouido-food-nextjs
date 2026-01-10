import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAllRestaurants } from "@/data/yeouido-food";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_NEW_KEY;

// 식당 건물 정보 인터페이스
interface RestaurantBuilding {
  restaurantName: string;
  buildingName: string | null;
  address: string | null;
  containingPlaceId: string | null;
  updatedAt: Date;
}

// containingPlaces의 place ID로 건물 이름 조회
async function getBuildingName(placeResourceName: string): Promise<string | null> {
  try {
    const url = `https://places.googleapis.com/v1/${placeResourceName}`;
    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_API_KEY!,
        "X-Goog-FieldMask": "displayName"
      }
    });
    const data = await response.json();
    return data.displayName?.text || null;
  } catch {
    return null;
  }
}

// 식당 이름으로 건물 정보 조회
async function fetchBuildingInfo(restaurantName: string, address: string): Promise<{
  buildingName: string | null;
  formattedAddress: string | null;
  containingPlaceId: string | null;
}> {
  try {
    const searchUrl = "https://places.googleapis.com/v1/places:searchText";
    const response = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY!,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.containingPlaces"
      },
      body: JSON.stringify({
        textQuery: `${restaurantName} ${address}`,
        languageCode: "ko"
      })
    });

    const data = await response.json();
    const firstPlace = data.places?.[0];
    const containingPlaces = firstPlace?.containingPlaces || [];

    let buildingName: string | null = null;
    let containingPlaceId: string | null = null;

    if (containingPlaces.length > 0) {
      containingPlaceId = containingPlaces[0].id;
      buildingName = await getBuildingName(containingPlaces[0].name);
    }

    return {
      buildingName,
      formattedAddress: firstPlace?.formattedAddress || null,
      containingPlaceId
    };
  } catch (error) {
    console.error(`Error fetching building info for ${restaurantName}:`, error);
    return { buildingName: null, formattedAddress: null, containingPlaceId: null };
  }
}

// GET: 모든 식당의 건물 정보 조회
export async function GET() {
  try {
    const db = await getDb();
    const collection = db.collection<RestaurantBuilding>("restaurant_buildings");

    const buildings = await collection.find({}).toArray();

    return NextResponse.json({
      count: buildings.length,
      buildings: buildings.map(b => ({
        restaurantName: b.restaurantName,
        buildingName: b.buildingName
      }))
    });
  } catch (error) {
    console.error("Error fetching buildings:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST: 건물 정보 일괄 수집 (관리자용)
export async function POST(request: NextRequest) {
  // 간단한 보안 체크 (쿼리 파라미터로 비밀 키 확인)
  const searchParams = request.nextUrl.searchParams;
  const adminKey = searchParams.get("key");

  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: "Google API key not configured" }, { status: 500 });
  }

  try {
    const db = await getDb();
    const collection = db.collection<RestaurantBuilding>("restaurant_buildings");

    // 모든 식당 가져오기
    const restaurants = getAllRestaurants();

    // 이미 저장된 식당 확인
    const existing = await collection.find({}).toArray();
    const existingNames = new Set(existing.map(e => e.restaurantName));

    // 아직 저장되지 않은 식당만 필터링
    const toProcess = restaurants.filter(r => !existingNames.has(r.이름));

    const results: { name: string; building: string | null; status: string }[] = [];
    let processed = 0;

    // 배치 처리 (API 제한 고려, 한 번에 10개씩)
    const batchSize = 10;
    for (let i = 0; i < toProcess.length; i += batchSize) {
      const batch = toProcess.slice(i, i + batchSize);

      await Promise.all(batch.map(async (restaurant) => {
        const { buildingName, formattedAddress, containingPlaceId } = await fetchBuildingInfo(
          restaurant.이름,
          restaurant.주소
        );

        await collection.updateOne(
          { restaurantName: restaurant.이름 },
          {
            $set: {
              restaurantName: restaurant.이름,
              buildingName,
              address: formattedAddress,
              containingPlaceId,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );

        results.push({
          name: restaurant.이름,
          building: buildingName,
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
      message: "Building info collection completed",
      total: restaurants.length,
      alreadyExisted: existingNames.size,
      processed,
      results
    });
  } catch (error) {
    console.error("Error collecting building info:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
