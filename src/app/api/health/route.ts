import { NextResponse } from "next/server";
import { getAllRestaurants } from "@/data/yeouido-food";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = { server: "ok" };
  let lastCronRun: string | undefined;

  try {
    const db = await getDb();
    checks["db"] = "ok";

    const latest = await db
      .collection("google_reviews_cache")
      .findOne({}, { sort: { updatedAt: -1 }, projection: { updatedAt: 1 } });
    if (latest?.updatedAt) {
      lastCronRun = new Date(latest.updatedAt).toISOString();
    }
  } catch {
    checks["db"] = "error";
  }

  // 맛집 수는 정적 데이터 파일 기준
  const restaurantCount = getAllRestaurants().length;

  const overall = Object.values(checks).every((v) => v === "ok") ? "ok" : "degraded";

  return NextResponse.json({
    status: overall,
    app: "yeouido-food",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    checks,
    restaurant_count: restaurantCount,
    ...(lastCronRun && { last_cron_run: lastCronRun }),
  });
}
