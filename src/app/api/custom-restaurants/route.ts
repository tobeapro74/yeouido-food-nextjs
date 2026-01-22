import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/mongodb";
import { JWTPayload, RestaurantHistory, CustomRestaurant } from "@/lib/types";
import { findStaticRestaurant } from "@/data/yeouido-food";

const JWT_SECRET = process.env.JWT_SECRET || "yeouido-food-secret-key";

// 주소에서 간단한 지역 정보 추출 (구/동)
function extractShortAddress(address: string): string {
  // "대한민국 서울특별시 영등포구 여의도동 ..." 에서 "영등포구 여의도동" 추출
  const match = address.match(/([가-힣]+구)\s*([가-힣]+동)?/);
  if (match) {
    return match[2] ? `${match[1]} ${match[2]}` : match[1];
  }
  return address.substring(0, 20);
}

// 히스토리 기록 함수
async function recordHistory(data: {
  place_id: string;
  name: string;
  address: string;
  category: string;
  registered_by: number;
  registered_by_name: string;
  action: "register" | "delete" | "update";
  memo?: string;
}): Promise<void> {
  try {
    const db = await getDb();
    const historyCollection = db.collection<RestaurantHistory>("restaurant_history");

    // 다음 순번 가져오기
    const lastRecord = await historyCollection
      .find()
      .sort({ seq: -1 })
      .limit(1)
      .toArray();
    const seq = lastRecord.length > 0 ? lastRecord[0].seq + 1 : 1;

    const historyRecord: RestaurantHistory = {
      seq,
      place_id: data.place_id,
      name: data.name,
      short_address: extractShortAddress(data.address),
      category: data.category,
      registered_by: data.registered_by,
      registered_by_name: data.registered_by_name,
      registered_at: new Date().toISOString(),
      action: data.action,
      memo: data.memo,
    };

    await historyCollection.insertOne(historyRecord);
  } catch (error) {
    console.error("히스토리 기록 오류:", error);
    // 히스토리 기록 실패해도 메인 작업에 영향 없도록 에러를 던지지 않음
  }
}

// 정적 데이터를 DB로 마이그레이션
async function migrateStaticToDb(
  placeId: string,
  decoded: JWTPayload
): Promise<CustomRestaurant | null> {
  const staticData = findStaticRestaurant(placeId);
  if (!staticData) return null;

  const { restaurant, category } = staticData;
  const db = await getDb();
  const collection = db.collection<CustomRestaurant>("custom_restaurants");

  const newRestaurant: Omit<CustomRestaurant, "_id"> = {
    place_id: placeId,
    name: restaurant.이름,
    address: restaurant.주소,
    category: category as CustomRestaurant["category"],
    feature: restaurant.특징 || "",
    region: restaurant.지역,
    coordinates: { lat: 37.5219, lng: 126.9245 }, // 여의도 기본 좌표
    google_rating: restaurant.평점,
    google_reviews_count: restaurant.리뷰수,
    price_level: undefined,
    phone_number: restaurant.전화번호,
    opening_hours: restaurant.영업시간 ? [restaurant.영업시간] : undefined,
    photos: undefined,
    website: undefined,
    google_map_url: undefined,
    registered_by: decoded.userId,
    registered_by_name: decoded.name,
    created_at: new Date().toISOString(),
    building: restaurant.빌딩,
  };

  await collection.insertOne(newRestaurant as CustomRestaurant);
  return newRestaurant as CustomRestaurant;
}

// GET: 맛집 목록 조회 (인증 불필요)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const region = searchParams.get("region");
    const registeredBy = searchParams.get("registeredBy");
    const placeId = searchParams.get("place_id");

    const db = await getDb();
    const collection = db.collection<CustomRestaurant>("custom_restaurants");

    // 필터 조건 구성
    const filter: Record<string, unknown> = {};
    if (placeId) {
      // place_id로 검색 (중복 확인용)
      filter.place_id = placeId;
    }
    if (category) filter.category = category;
    if (region) filter.region = region;
    if (registeredBy) filter.registered_by = parseInt(registeredBy);

    // 삭제되지 않은 항목만 조회
    filter.deleted = { $ne: true };

    const restaurants = await collection
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();

    // 삭제된 정적 데이터의 place_id 목록 조회 (정적 데이터 필터링용)
    const deletedStaticIds = await collection
      .find({ deleted: true, place_id: { $regex: /^static_/ } })
      .project({ place_id: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      count: restaurants.length,
      data: restaurants,
      deletedStaticIds: deletedStaticIds.map((d) => d.place_id),
    });
  } catch (error) {
    console.error("Error fetching custom restaurants:", error);
    return NextResponse.json(
      { success: false, error: "맛집 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 새 맛집 등록 (인증 필요)
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: "인증이 만료되었습니다. 다시 로그인해주세요." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      place_id,
      name,
      address,
      category,
      feature,
      region,
      coordinates,
      google_rating,
      google_reviews_count,
      price_level,
      phone_number,
      opening_hours,
      photos,
      website,
      google_map_url,
    } = body;

    // 필수 필드 검증
    if (!place_id || !name || !address || !category || !region || !coordinates) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 카테고리 검증
    const validCategories = ["한식", "양식", "중식", "일식", "동남아식"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: "올바른 카테고리를 선택해주세요." },
        { status: 400 }
      );
    }

    // 지역 검증
    const validRegions = ["서여의도", "동여의도"];
    if (!validRegions.includes(region)) {
      return NextResponse.json(
        { success: false, error: "올바른 지역을 선택해주세요." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("custom_restaurants");

    // 중복 확인 (place_id 기준)
    const existing = await collection.findOne({ place_id });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "이미 등록된 맛집입니다." },
        { status: 409 }
      );
    }

    // 새 맛집 저장
    const newRestaurant = {
      place_id,
      name,
      address,
      category,
      feature: feature || "",
      region,
      coordinates,
      google_rating: google_rating || null,
      google_reviews_count: google_reviews_count || null,
      price_level: price_level || null,
      phone_number: phone_number || null,
      opening_hours: opening_hours || [],
      photos: photos || [],
      website: website || null,
      google_map_url: google_map_url || null,
      registered_by: decoded.userId,
      registered_by_name: decoded.name,
      created_at: new Date().toISOString(),
    };

    await collection.insertOne(newRestaurant);

    // 히스토리 기록
    await recordHistory({
      place_id,
      name,
      address,
      category,
      registered_by: decoded.userId,
      registered_by_name: decoded.name,
      action: "register",
    });

    return NextResponse.json({
      success: true,
      message: "맛집이 등록되었습니다.",
      data: newRestaurant,
    });
  } catch (error) {
    console.error("Error creating custom restaurant:", error);
    return NextResponse.json(
      { success: false, error: "맛집 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH: 맛집 카테고리 수정 (등록자 또는 관리자만)
export async function PATCH(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: "인증이 만료되었습니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { place_id, category, feature, region } = body;

    if (!place_id) {
      return NextResponse.json(
        { success: false, error: "place_id가 필요합니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection<CustomRestaurant>("custom_restaurants");

    // 맛집 조회
    let restaurant: CustomRestaurant | null = await collection.findOne({ place_id }) as CustomRestaurant | null;

    // DB에 없고 정적 데이터인 경우 자동 마이그레이션
    if (!restaurant && place_id.startsWith("static_")) {
      // 관리자 또는 박병철만 정적 데이터 수정 가능
      if (!decoded.is_admin && decoded.name !== "박병철") {
        return NextResponse.json(
          { success: false, error: "정적 데이터 수정 권한이 없습니다." },
          { status: 403 }
        );
      }

      const migrated = await migrateStaticToDb(place_id, decoded);
      if (!migrated) {
        return NextResponse.json(
          { success: false, error: "맛집을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      restaurant = migrated;
    }

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "맛집을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인 (등록자 또는 관리자 또는 박병철만 수정 가능)
    if (restaurant.registered_by !== decoded.userId && !decoded.is_admin && decoded.name !== "박병철") {
      return NextResponse.json(
        { success: false, error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 업데이트할 필드 구성
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    const changedFields: string[] = [];

    if (category && category !== restaurant.category) {
      updateFields.category = category;
      changedFields.push(`카테고리: ${restaurant.category} → ${category}`);
    }
    if (feature !== undefined) {
      updateFields.feature = feature;
      changedFields.push("특징");
    }
    if (region) {
      updateFields.region = region;
      changedFields.push("지역");
    }

    await collection.updateOne(
      { place_id },
      { $set: updateFields }
    );

    // 히스토리 기록 (변경된 필드가 있을 때만)
    if (changedFields.length > 0) {
      await recordHistory({
        place_id,
        name: restaurant.name,
        address: restaurant.address,
        category: category || restaurant.category,
        registered_by: decoded.userId,
        registered_by_name: decoded.name,
        action: "update",
        memo: changedFields.join(", "),
      });
    }

    return NextResponse.json({
      success: true,
      message: "맛집 정보가 수정되었습니다.",
    });
  } catch (error) {
    console.error("Error updating custom restaurant:", error);
    return NextResponse.json(
      { success: false, error: "맛집 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 맛집 장소 정보 수정 (등록자 또는 관리자)
export async function PUT(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: "인증이 만료되었습니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      old_place_id,  // 기존 place_id (수정 대상 식별용)
      address,
      feature,
      coordinates,
      phone_number,
      opening_hours,
      google_map_url,
    } = body;

    if (!old_place_id) {
      return NextResponse.json(
        { success: false, error: "수정할 맛집의 place_id가 필요합니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection<CustomRestaurant>("custom_restaurants");

    // 기존 맛집 찾기
    let restaurant: CustomRestaurant | null = await collection.findOne({ place_id: old_place_id }) as CustomRestaurant | null;

    // DB에 없고 정적 데이터인 경우 자동 마이그레이션
    if (!restaurant && old_place_id.startsWith("static_")) {
      // 관리자 또는 박병철만 정적 데이터 수정 가능
      if (!decoded.is_admin && decoded.name !== "박병철") {
        return NextResponse.json(
          { success: false, error: "정적 데이터 수정 권한이 없습니다." },
          { status: 403 }
        );
      }

      const migrated = await migrateStaticToDb(old_place_id, decoded);
      if (!migrated) {
        return NextResponse.json(
          { success: false, error: "맛집을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      restaurant = migrated;
    }

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "맛집을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인 (등록자 또는 관리자 또는 박병철만 수정 가능)
    if (restaurant.registered_by !== decoded.userId && !decoded.is_admin && decoded.name !== "박병철") {
      return NextResponse.json(
        { success: false, error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 업데이트할 필드 준비
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 변경된 필드 목록 (히스토리용)
    const changedFields: string[] = [];

    if (address !== undefined) {
      updateFields.address = address;
      changedFields.push("주소");
    }
    if (feature !== undefined) {
      updateFields.feature = feature;
      changedFields.push("특징");
    }
    if (coordinates !== undefined) {
      updateFields.coordinates = coordinates;
      changedFields.push("좌표");
    }
    if (phone_number !== undefined) {
      updateFields.phone_number = phone_number;
      changedFields.push("전화번호");
    }
    if (opening_hours !== undefined) {
      updateFields.opening_hours = opening_hours;
      changedFields.push("영업시간");
    }
    if (google_map_url !== undefined) {
      updateFields.google_map_url = google_map_url;
    }

    // 업데이트 실행
    await collection.updateOne(
      { place_id: old_place_id },
      { $set: updateFields }
    );

    // 히스토리 기록 (변경된 필드가 있을 때만)
    if (changedFields.length > 0) {
      await recordHistory({
        place_id: old_place_id,
        name: restaurant.name,
        address: address || restaurant.address,
        category: restaurant.category,
        registered_by: decoded.userId,
        registered_by_name: decoded.name,
        action: "update",
        memo: `정보 수정: ${changedFields.join(", ")}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "맛집 정보가 수정되었습니다.",
      data: { old_place_id, ...updateFields },
    });
  } catch (error) {
    console.error("Error updating custom restaurant info:", error);
    return NextResponse.json(
      { success: false, error: "정보 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 맛집 삭제 (등록자 또는 관리자만)
export async function DELETE(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: "인증이 만료되었습니다." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    // place_id 또는 placeId 둘 다 지원
    const place_id = searchParams.get("place_id") || searchParams.get("placeId");

    if (!place_id) {
      return NextResponse.json(
        { success: false, error: "place_id가 필요합니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection<CustomRestaurant>("custom_restaurants");

    // 맛집 조회
    let restaurant: CustomRestaurant | null = await collection.findOne({ place_id }) as CustomRestaurant | null;

    // DB에 없고 정적 데이터인 경우 자동 마이그레이션 후 삭제
    if (!restaurant && place_id.startsWith("static_")) {
      // 관리자 또는 박병철만 정적 데이터 삭제 가능
      if (!decoded.is_admin && decoded.name !== "박병철") {
        return NextResponse.json(
          { success: false, error: "정적 데이터 삭제 권한이 없습니다." },
          { status: 403 }
        );
      }

      const migrated = await migrateStaticToDb(place_id, decoded);
      if (!migrated) {
        return NextResponse.json(
          { success: false, error: "맛집을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      restaurant = migrated;
    }

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "맛집을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인 (등록자 또는 관리자 또는 박병철만 삭제 가능)
    if (restaurant.registered_by !== decoded.userId && !decoded.is_admin && decoded.name !== "박병철") {
      return NextResponse.json(
        { success: false, error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 정적 데이터인 경우 실제 삭제 대신 deleted 플래그 설정 (Soft Delete)
    if (place_id.startsWith("static_")) {
      await collection.updateOne(
        { place_id },
        { $set: { deleted: true, deleted_at: new Date().toISOString() } }
      );
    } else {
      // 일반 사용자 등록 맛집은 실제 삭제 (Hard Delete)
      await collection.deleteOne({ place_id });
    }

    // 히스토리 기록
    await recordHistory({
      place_id,
      name: restaurant.name,
      address: restaurant.address,
      category: restaurant.category,
      registered_by: decoded.userId,
      registered_by_name: decoded.name,
      action: "delete",
    });

    return NextResponse.json({
      success: true,
      message: "맛집이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error deleting custom restaurant:", error);
    return NextResponse.json(
      { success: false, error: "맛집 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
