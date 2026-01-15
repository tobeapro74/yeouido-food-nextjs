import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/mongodb";
import { JWTPayload } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "yeouido-food-secret-key";

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const userId = decoded.userId;

    const db = await getDb();
    const usersCollection = db.collection("users");
    const reviewsCollection = db.collection("reviews");

    // 사용자 확인
    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자가 작성한 리뷰 삭제
    await reviewsCollection.deleteMany({ user_id: userId });

    // 사용자 계정 삭제
    await usersCollection.deleteOne({ id: userId });

    // 응답 생성 및 쿠키 삭제
    const response = NextResponse.json({
      success: true,
      message: "계정이 성공적으로 삭제되었습니다.",
    });

    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { success: false, error: "계정 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
