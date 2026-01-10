import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAllRestaurants, Restaurant } from "@/data/yeouido-food";

// MongoDB에 저장될 식당 정보 인터페이스
interface RestaurantDocument {
  name: string;
  address: string;
  description: string;
  region: "서여의도" | "동여의도";
  category: "한식" | "양식" | "중식" | "일식" | "동남아식";
  building: string | null;
  rating: number | null;
  reviewCount: number | null;
  businessHours: string | null;
  phoneNumber: string | null;
  priceRange: string | null;
  googleBuildingName: string | null; // Google Places API에서 가져온 건물명
  updatedAt: Date;
}

// GET: 현재 MongoDB에 저장된 식당 수 확인
export async function GET() {
  try {
    const db = await getDb();
    const restaurantsCollection = db.collection<RestaurantDocument>("restaurants");
    const buildingsCollection = db.collection("restaurant_buildings");

    const restaurantCount = await restaurantsCollection.countDocuments();
    const buildingCount = await buildingsCollection.countDocuments();

    // 샘플 데이터 조회
    const sampleRestaurants = await restaurantsCollection.find({}).limit(5).toArray();

    return NextResponse.json({
      restaurantCount,
      buildingCount,
      staticDataCount: getAllRestaurants().length,
      sampleRestaurants: sampleRestaurants.map(r => ({
        name: r.name,
        building: r.building,
        googleBuildingName: r.googleBuildingName
      }))
    });
  } catch (error) {
    console.error("Error fetching restaurant count:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST: 정적 데이터 + Google 건물 정보를 병합하여 MongoDB에 동기화
export async function POST(request: NextRequest) {
  // 관리자 인증 확인
  const searchParams = request.nextUrl.searchParams;
  const adminKey = searchParams.get("key")?.trim();
  const expectedKey = process.env.ADMIN_SECRET_KEY?.trim();

  if (!expectedKey || adminKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const restaurantsCollection = db.collection<RestaurantDocument>("restaurants");
    const buildingsCollection = db.collection("restaurant_buildings");

    // 1. 정적 데이터에서 모든 식당 가져오기
    const staticRestaurants = getAllRestaurants();

    // 2. Google Places API에서 가져온 건물 정보 조회
    const googleBuildings = await buildingsCollection.find({}).toArray();
    const googleBuildingMap = new Map(
      googleBuildings.map(b => [b.restaurantName, b.buildingName])
    );

    // 3. 통계 정보
    const stats = {
      total: staticRestaurants.length,
      withStaticBuilding: 0,
      withGoogleBuilding: 0,
      noBuilding: 0,
      inserted: 0,
      updated: 0
    };

    // 4. 각 식당 데이터 병합 및 저장
    for (const restaurant of staticRestaurants) {
      const staticBuilding = restaurant.빌딩 || null;
      const googleBuilding = googleBuildingMap.get(restaurant.이름) || null;

      // 건물 정보: 정적 데이터 우선, 없으면 Google API 정보 사용
      const finalBuilding = staticBuilding || googleBuilding;

      if (staticBuilding) {
        stats.withStaticBuilding++;
      } else if (googleBuilding) {
        stats.withGoogleBuilding++;
      } else {
        stats.noBuilding++;
      }

      const document: RestaurantDocument = {
        name: restaurant.이름,
        address: restaurant.주소,
        description: restaurant.특징,
        region: restaurant.지역,
        category: restaurant.카테고리,
        building: finalBuilding,
        rating: restaurant.평점 || null,
        reviewCount: restaurant.리뷰수 || null,
        businessHours: restaurant.영업시간 || null,
        phoneNumber: restaurant.전화번호 || null,
        priceRange: restaurant.가격대 || null,
        googleBuildingName: googleBuilding,
        updatedAt: new Date()
      };

      const result = await restaurantsCollection.updateOne(
        { name: restaurant.이름 },
        { $set: document },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        stats.inserted++;
      } else if (result.modifiedCount > 0) {
        stats.updated++;
      }
    }

    // 5. 건물 정보가 없는 식당 목록 조회
    const restaurantsWithoutBuilding = await restaurantsCollection
      .find({ building: null })
      .project({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      message: "식당 데이터 동기화 완료",
      stats: {
        총_식당수: stats.total,
        정적_빌딩정보: stats.withStaticBuilding,
        Google_빌딩정보: stats.withGoogleBuilding,
        빌딩정보_없음: stats.noBuilding,
        신규_추가: stats.inserted,
        업데이트: stats.updated
      },
      restaurantsWithoutBuilding: restaurantsWithoutBuilding.map(r => r.name)
    });
  } catch (error) {
    console.error("Error syncing restaurants:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
