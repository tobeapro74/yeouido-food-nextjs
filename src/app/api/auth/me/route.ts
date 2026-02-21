import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/mongodb";
import { JWTPayload } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "yeouido-food-secret-key";

export async function GET(request: NextRequest) {
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

    // DB에서 추가 정보 조회
    const db = await getDb();
    const member = await db.collection("users").findOne(
      { id: decoded.userId },
      { projection: { password: 1, kakao_id: 1, profile_image: 1 } }
    );

    return NextResponse.json({
      success: true,
      data: {
        id: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        profile_image: member?.profile_image || decoded.profile_image || null,
        is_admin: decoded.is_admin,
        has_password: !!member?.password,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    );
  }
}
