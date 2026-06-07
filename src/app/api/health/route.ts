import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = { server: "ok" };
  let restaurantCount: number | undefined;
  let lastCronRun: string | undefined;

  try {
    const db = await getDb();
    checks["db"] = "ok";

    // 맛집 수 조회 (google_reviews_cache 기준)
    restaurantCount = await db.collection("google_reviews_cache").countDocuments();

    // 마지막 크론 실행 시각
    const latest = await db
      .collection("google_reviews_cache")
      .findOne({}, { sort: { updatedAt: -1 }, projection: { updatedAt: 1 } });
    if (latest?.updatedAt) {
      lastCronRun = new Date(latest.updatedAt).toISOString();
    }
  } catch {
    checks["db"] = "error";
  }

  const overall = Object.values(checks).every((v) => v === "ok") ? "ok" : "degraded";

  return NextResponse.json({
    status: overall,
    app: "yeouido-food",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    checks,
    ...(restaurantCount !== undefined && { restaurant_count: restaurantCount }),
    ...(lastCronRun && { last_cron_run: lastCronRun }),
  });
}
