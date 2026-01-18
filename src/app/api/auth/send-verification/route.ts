import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getDb } from "@/lib/mongodb";

// Resend 인스턴스는 API 키가 있을 때만 생성
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// 6자리 인증 코드 생성
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "이메일을 입력해주세요." },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection("users");
    const verificationCollection = db.collection("email_verifications");

    // 이미 가입된 이메일인지 확인
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "이미 가입된 이메일입니다." },
        { status: 400 }
      );
    }

    // 인증 코드 생성
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

    // Resend API 키 확인
    if (!resend) {
      return NextResponse.json(
        { success: false, error: "이메일 서비스가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 기존 인증 코드 삭제 후 새 코드 저장
    await verificationCollection.deleteMany({ email });
    await verificationCollection.insertOne({
      email,
      code,
      expiresAt,
      verified: false,
      createdAt: new Date(),
    });

    // 이메일 발송
    const { error: sendError } = await resend.emails.send({
      from: "여의도한끼 <onboarding@resend.dev>",
      to: email,
      subject: "[여의도한끼] 이메일 인증 코드",
      html: `
        <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 30px; text-align: center;">
            🍚 여의도한끼 이메일 인증
          </h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            안녕하세요! 여의도한끼 회원가입을 위한 인증 코드입니다.
          </p>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 10px 0;">인증 코드</p>
            <p style="color: #fff; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0;">${code}</p>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">
            이 코드는 <strong>10분</strong> 동안 유효합니다.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            본인이 요청하지 않은 경우 이 이메일을 무시해주세요.
          </p>
        </div>
      `,
    });

    if (sendError) {
      console.error("Email send error:", sendError);
      return NextResponse.json(
        { success: false, error: "이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "인증 코드가 발송되었습니다.",
    });
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      { success: false, error: "인증 코드 발송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
