import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "이미지가 필요합니다." },
        { status: 400 }
      );
    }

    // Cloudinary에 업로드
    const result = await cloudinary.uploader.upload(image, {
      folder: "yeouido-food-reviews",
      resource_type: "image",
      transformation: [
        { width: 800, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: `이미지 업로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}` },
      { status: 500 }
    );
  }
}
