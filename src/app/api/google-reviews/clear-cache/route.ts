import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// POST: 구글 리뷰 캐시 삭제
export async function POST(request: NextRequest) {
  try {
    const { restaurantName, clearAll } = await request.json();

    const db = await getDb();
    const collection = db.collection("google_reviews_cache");

    if (clearAll) {
      const result = await collection.deleteMany({});
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount}개의 캐시가 삭제되었습니다.`
      });
    }

    if (restaurantName) {
      const result = await collection.deleteOne({ restaurantName });
      return NextResponse.json({
        success: true,
        deleted: result.deletedCount > 0,
        message: result.deletedCount > 0 ? "캐시가 삭제되었습니다." : "해당 캐시가 없습니다."
      });
    }

    return NextResponse.json({ error: "restaurantName 또는 clearAll 필요" }, { status: 400 });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
