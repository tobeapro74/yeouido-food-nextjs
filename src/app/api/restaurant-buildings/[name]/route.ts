import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// GET: 특정 식당의 건물 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const restaurantName = decodeURIComponent(name);

    const db = await getDb();
    const collection = db.collection("restaurant_buildings");

    const building = await collection.findOne({ restaurantName });

    if (!building) {
      return NextResponse.json({ buildingName: null });
    }

    return NextResponse.json({
      restaurantName: building.restaurantName,
      buildingName: building.buildingName
    });
  } catch (error) {
    console.error("Error fetching building:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
