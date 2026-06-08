import { NextResponse } from "next/server";
import { getAllRestaurants } from "@/data/yeouido-food";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = { server: "ok" };
  let lastCronRun: string | undefined;
  let restaurantCountDiff: number | undefined;

  const restaurantCount = getAllRestaurants().length;

  try {
    const db = await getDb();
    checks["db"] = "ok";

    // 리뷰 크론 마지막 실행 시각
    const latest = await db
      .collection("google_reviews_cache")
      .findOne({}, { sort: { updatedAt: -1 }, projection: { updatedAt: 1 } });
    if (latest?.updatedAt) {
      lastCronRun = new Date(latest.updatedAt).toISOString();
    }

    // 전일 맛집 수와 비교 (agent_snapshots 컬렉션에 저장)
    const snapshot = await db
      .collection("agent_snapshots")
      .findOne({ key: "restaurant_count" }, { sort: { date: -1 } });

    if (snapshot?.count !== undefined) {
      restaurantCountDiff = restaurantCount - snapshot.count;
    }

    // 오늘 스냅샷 저장 (KST 날짜 기준)
    const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await db.collection("agent_snapshots").updateOne(
      { key: "restaurant_count", date: kstDate },
      { $set: { key: "restaurant_count", date: kstDate, count: restaurantCount } },
      { upsert: true }
    );
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
    restaurant_count: restaurantCount,
    ...(restaurantCountDiff !== undefined && { restaurant_count_diff: restaurantCountDiff }),
    ...(lastCronRun && { last_cron_run: lastCronRun }),
  });
}
