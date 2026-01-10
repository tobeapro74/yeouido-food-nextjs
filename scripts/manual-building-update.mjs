// 수동으로 조사한 건물 정보 업데이트
// 실행: node scripts/manual-building-update.mjs

import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb+srv://tobeapro:1023@cluster0.ppfoisv.mongodb.net/yeouido_food?retryWrites=true&w=majority";

// 수동 조사 결과
// 여의대로 24 = 전경련회관
// 여의나루로 42 = 여의도종합상가
// 여의나루로 57 = 신송빌딩
// 국제금융로 10 = IFC몰
// 국제금융로 39 = 브라이튼여의도
// 의사당대로 83 = 오투타워
const manualBuildingInfo = [
  { name: "마초갈비 여의도점", building: "전경련회관", address: "서울 영등포구 여의대로 24" },
  { name: "르뵈프 여의도점", building: "여의도종합상가", address: "서울 영등포구 여의나루로 42" },
  { name: "테이스팅룸 여의도", building: "전경련회관", address: "서울 영등포구 여의대로 24" },
  { name: "올라 여의도 (OLA)", building: "IFC몰", address: "서울 영등포구 국제금융로 10" },
  { name: "백원 여의도점", building: "전경련회관", address: "서울 영등포구 여의대로 24" },
  { name: "홀리차우 여의도점", building: "IFC몰", address: "서울 영등포구 국제금융로 10" },
  { name: "아루히 여의도", building: "신송빌딩", address: "서울 영등포구 여의나루로 57" },
  { name: "아루히 니와", building: "여의도종합상가", address: "서울 영등포구 여의나루로 42" },
  { name: "스시유 여의도점", building: "브라이튼여의도", address: "서울 영등포구 국제금융로 39" },
  { name: "타이 익스프레스 여의도", building: "IFC몰", address: "서울 영등포구 국제금융로 10" },
  { name: "싱가포르 호커 여의도", building: "서울빌딩", address: "서울 영등포구 여의나루로 81" },
  // 독립 건물/작은 상가 (건물명 없음)
  // { name: "은호식당", building: null },  // 여의대방로65길 6 - 독립 건물
  // { name: "해동복국", building: null },  // 여의대방로67길 22 - 독립 건물
  // { name: "타마 여의도", building: null },  // 은행로 30 - 독립 건물
];

async function main() {
  console.log("수동 건물 정보 업데이트 시작...\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("MongoDB 연결 성공!\n");

    const db = client.db("yeouido_food");
    const restaurantsCollection = db.collection("restaurants");

    let updated = 0;

    for (const info of manualBuildingInfo) {
      console.log(`${info.name} → ${info.building}`);

      const result = await restaurantsCollection.updateOne(
        { name: info.name },
        {
          $set: {
            building: info.building,
            address: info.address,
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`  ✓ 업데이트 완료`);
        updated++;
      } else if (result.matchedCount === 0) {
        console.log(`  ✗ 식당을 찾을 수 없음`);
      } else {
        console.log(`  - 변경 없음`);
      }
    }

    // 잘못 업데이트된 싱가포르 호커 수정 (Kada → 제거)
    await restaurantsCollection.updateOne(
      { name: "싱가포르 호커 여의도", building: "Kada" },
      {
        $set: {
          building: "서울빌딩",
          updatedAt: new Date()
        }
      }
    );

    console.log(`\n업데이트 완료: ${updated}개`);

    // 최종 통계
    const totalWithBuilding = await restaurantsCollection.countDocuments({ building: { $ne: null } });
    const totalWithoutBuilding = await restaurantsCollection.countDocuments({ building: null });

    console.log("\n========== 최종 통계 ==========");
    console.log(`건물 정보 있음: ${totalWithBuilding}개`);
    console.log(`건물 정보 없음: ${totalWithoutBuilding}개`);

    // 건물 정보 없는 식당 목록
    const noBuilding = await restaurantsCollection.find({ building: null }).project({ name: 1, address: 1 }).toArray();
    if (noBuilding.length > 0) {
      console.log(`\n건물 정보 없는 식당:`);
      noBuilding.forEach((r, i) => console.log(`  ${i + 1}. ${r.name} (${r.address})`));
    }

    console.log("================================\n");

  } catch (error) {
    console.error("오류 발생:", error);
  } finally {
    await client.close();
    console.log("MongoDB 연결 종료");
  }
}

main();
