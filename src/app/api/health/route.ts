import { NextResponse } from "next/server";
import { getAllRestaurants } from "@/data/yeouido-food";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = { server: "ok" };
  let lastCronRun: string | undefined;
  let restaurantCountDiff: number | undefined;
  let totalMembers: number | undefined;
  let dauYesterday: number | undefined;
  let newMembersYesterday: number | undefined;

  const restaurantCount = getAllRestaurants().length;

  try {
    const db = await getDb();
    checks["db"] = "ok";

    // KST 전일 범위 계산
    const kstOffset = 9 * 60 * 60 * 1000;
    const nowKst = new Date(Date.now() + kstOffset);
    const yStartKst = new Date(nowKst);
    yStartKst.setDate(yStartKst.getDate() - 1);
    yStartKst.setHours(0, 0, 0, 0);
    const yEndKst = new Date(yStartKst);
    yEndKst.setHours(23, 59, 59, 999);
    const yStart = new Date(yStartKst.getTime() - kstOffset);
    const yEnd = new Date(yEndKst.getTime() - kstOffset);

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
    const kstDate = new Date(Date.now() + kstOffset)
      .toISOString()
      .slice(0, 10);
    await db.collection("agent_snapshots").updateOne(
      { key: "restaurant_count", date: kstDate },
      { $set: { key: "restaurant_count", date: kstDate, count: restaurantCount } },
      { upsert: true }
    );

    // 회원 통계
    const users = db.collection("users");
    totalMembers = await users.countDocuments();
    dauYesterday = await users.countDocuments({
      last_login_at: { $gte: yStart, $lte: yEnd },
    });
    newMembersYesterday = await users.countDocuments({
      created_at: { $gte: yStart, $lte: yEnd },
    });
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
    ...(totalMembers !== undefined && { total_members: totalMembers }),
    ...(dauYesterday !== undefined && { dau_yesterday: dauYesterday }),
    ...(newMembersYesterday !== undefined && { new_members_yesterday: newMembersYesterday }),
  });
}
