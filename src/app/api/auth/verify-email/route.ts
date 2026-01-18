import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "이메일과 인증 코드를 입력해주세요." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const verificationCollection = db.collection("email_verifications");

    // 인증 코드 확인
    const verification = await verificationCollection.findOne({
      email,
      code,
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, error: "인증 코드가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 만료 시간 확인
    if (new Date() > new Date(verification.expiresAt)) {
      return NextResponse.json(
        { success: false, error: "인증 코드가 만료되었습니다. 다시 요청해주세요." },
        { status: 400 }
      );
    }

    // 인증 완료 처리
    await verificationCollection.updateOne(
      { email, code },
      {
        $set: {
          verified: true,
          verifiedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "이메일 인증이 완료되었습니다.",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { success: false, error: "인증 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
