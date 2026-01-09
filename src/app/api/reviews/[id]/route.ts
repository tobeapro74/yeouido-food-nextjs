import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { JWTPayload } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "yeouido-food-secret-key";

// 리뷰 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const db = await getDb();
    const reviewsCollection = db.collection("reviews");

    // 리뷰 조회
    const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
    if (!review) {
      return NextResponse.json(
        { success: false, error: "리뷰를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인 (본인 또는 관리자만 삭제 가능)
    if (review.user_id !== decoded.userId && !decoded.is_admin) {
      return NextResponse.json(
        { success: false, error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 삭제
    await reviewsCollection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      { success: false, error: "리뷰 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
