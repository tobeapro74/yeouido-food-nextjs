import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/mongodb";
import { JWTPayload } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "yeouido-food-secret-key";

// GET: 맛집 목록 조회 (인증 불필요)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const region = searchParams.get("region");
    const registeredBy = searchParams.get("registeredBy");

    const db = await getDb();
    const collection = db.collection("custom_restaurants");

    // 필터 조건 구성
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (region) filter.region = region;
    if (registeredBy) filter.registered_by = parseInt(registeredBy);

    const restaurants = await collection
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      count: restaurants.length,
      data: restaurants,
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

// PATCH: 맛집 수정 (등록자 또는 관리자만)
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
    const collection = db.collection("custom_restaurants");

    // 맛집 조회
    const restaurant = await collection.findOne({ place_id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "맛집을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인 (등록자 또는 관리자)
    if (restaurant.registered_by !== decoded.userId && !decoded.is_admin) {
      return NextResponse.json(
        { success: false, error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 업데이트할 필드 구성
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (category) updateFields.category = category;
    if (feature !== undefined) updateFields.feature = feature;
    if (region) updateFields.region = region;

    await collection.updateOne(
      { place_id },
      { $set: updateFields }
    );

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
    const place_id = searchParams.get("place_id");

    if (!place_id) {
      return NextResponse.json(
        { success: false, error: "place_id가 필요합니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("custom_restaurants");

    // 맛집 조회
    const restaurant = await collection.findOne({ place_id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "맛집을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인 (등록자 또는 관리자)
    if (restaurant.registered_by !== decoded.userId && !decoded.is_admin) {
      return NextResponse.json(
        { success: false, error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    await collection.deleteOne({ place_id });

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
