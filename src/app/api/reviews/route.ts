import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/mongodb";
import { JWTPayload } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "yeouido-food-secret-key";

// 리뷰 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantId = searchParams.get("restaurant_id");

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "restaurant_id가 필요합니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const reviewsCollection = db.collection("reviews");

    const reviews = await reviewsCollection
      .find({ restaurant_id: restaurantId })
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { success: false, error: "리뷰 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 리뷰 작성
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
      restaurant_id,
      rating,
      food_rating,
      service_rating,
      atmosphere_rating,
      content,
      photos,
      meal_type,
    } = body;

    if (!restaurant_id || !rating) {
      return NextResponse.json(
        { success: false, error: "맛집 ID와 평점은 필수입니다." },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "평점은 1~5 사이여야 합니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const reviewsCollection = db.collection("reviews");

    const newReview = {
      restaurant_id,
      user_id: decoded.userId,
      user_name: decoded.name,
      rating,
      food_rating: food_rating || null,
      service_rating: service_rating || null,
      atmosphere_rating: atmosphere_rating || null,
      content: content || "",
      photos: photos || [],
      meal_type: meal_type || null,
      created_at: new Date(),
    };

    const result = await reviewsCollection.insertOne(newReview);

    return NextResponse.json({
      success: true,
      data: { insertedId: result.insertedId },
    });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { success: false, error: "리뷰 작성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
