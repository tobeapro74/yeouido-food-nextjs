import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// GET: 특정 식당의 가격대 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const restaurantName = decodeURIComponent(name);

    const db = await getDb();
    const collection = db.collection("restaurant_prices");

    const price = await collection.findOne({ restaurantName });

    if (!price) {
      return NextResponse.json({ priceRange: null, phoneNumber: null, businessStatus: null });
    }

    return NextResponse.json({
      restaurantName: price.restaurantName,
      priceLevel: price.priceLevel,
      priceRange: price.priceRange,
      phoneNumber: price.phoneNumber,
      businessStatus: price.businessStatus || null,
      businessStatusKr: price.businessStatusKr || null
    });
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
