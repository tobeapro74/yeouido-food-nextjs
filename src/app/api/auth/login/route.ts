import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "yeouido-food-secret-key";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection("users");

    // 사용자 조회
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "이메일 또는 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "이메일 또는 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        profile_image: user.profile_image || null,
        is_admin: user.is_admin,
      },
    });

    // 쿠키에 토큰 저장
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7일
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "로그인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
