// MongoDB 식당 데이터 동기화 스크립트 v2
// 실행: node scripts/sync-restaurants-v2.mjs

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";

const MONGODB_URI = "mongodb+srv://tobeapro:1023@cluster0.ppfoisv.mongodb.net/yeouido_food?retryWrites=true&w=majority";

async function syncRestaurants() {
  console.log("MongoDB 식당 데이터 동기화 시작...\n");

  // JSON 파일에서 식당 데이터 읽기
  const dataPath = new URL("./restaurant-data.json", import.meta.url);
  const yeouidoFoodMap = JSON.parse(readFileSync(dataPath, "utf-8"));

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("MongoDB 연결 성공!");

    const db = client.db("yeouido_food");
    const restaurantsCollection = db.collection("restaurants");
    const buildingsCollection = db.collection("restaurant_buildings");

    // 1. 정적 데이터에서 모든 식당 가져오기
    const categories = ["한식", "양식", "중식", "일식", "동남아식"];
    const staticRestaurants = [];
    for (const cat of categories) {
      staticRestaurants.push(...yeouidoFoodMap[cat]);
    }

    console.log(`\n정적 데이터 식당 수: ${staticRestaurants.length}개`);
    categories.forEach(cat => {
      console.log(`  ${cat}: ${yeouidoFoodMap[cat].length}개`);
    });

    // 2. Google Places API에서 가져온 건물 정보 조회
    const googleBuildings = await buildingsCollection.find({}).toArray();
    const googleBuildingMap = new Map(
      googleBuildings.map(b => [b.restaurantName, b.buildingName])
    );

    console.log(`\nGoogle Places API 건물 정보: ${googleBuildings.length}개`);

    // 3. 통계 정보
    const stats = {
      total: staticRestaurants.length,
      withStaticBuilding: 0,
      withGoogleBuilding: 0,
      noBuilding: 0,
      inserted: 0,
      updated: 0
    };

    // 4. 각 식당 데이터 병합 및 저장
    for (const restaurant of staticRestaurants) {
      const staticBuilding = restaurant.빌딩 || null;
      const googleBuilding = googleBuildingMap.get(restaurant.이름) || null;

      // 건물 정보: 정적 데이터 우선, 없으면 Google API 정보 사용
      const finalBuilding = staticBuilding || googleBuilding;

      if (staticBuilding) {
        stats.withStaticBuilding++;
      } else if (googleBuilding) {
        stats.withGoogleBuilding++;
      } else {
        stats.noBuilding++;
      }

      const document = {
        name: restaurant.이름,
        address: restaurant.주소,
        description: restaurant.특징,
        region: restaurant.지역,
        category: restaurant.카테고리,
        building: finalBuilding,
        rating: restaurant.평점 || null,
        reviewCount: restaurant.리뷰수 || null,
        businessHours: restaurant.영업시간 || null,
        phoneNumber: restaurant.전화번호 || null,
        priceRange: restaurant.가격대 || null,
        googleBuildingName: googleBuilding,
        updatedAt: new Date()
      };

      const result = await restaurantsCollection.updateOne(
        { name: restaurant.이름 },
        { $set: document },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        stats.inserted++;
      } else if (result.modifiedCount > 0) {
        stats.updated++;
      }
    }

    // 5. 건물 정보가 없는 식당 목록 조회
    const restaurantsWithoutBuilding = await restaurantsCollection
      .find({ building: null })
      .project({ name: 1 })
      .toArray();

    console.log("\n========== 동기화 결과 ==========");
    console.log(`총 식당 수: ${stats.total}개`);
    console.log(`정적 데이터 빌딩 정보: ${stats.withStaticBuilding}개`);
    console.log(`Google API 빌딩 정보: ${stats.withGoogleBuilding}개`);
    console.log(`빌딩 정보 없음: ${stats.noBuilding}개`);
    console.log(`신규 추가: ${stats.inserted}개`);
    console.log(`업데이트: ${stats.updated}개`);
    console.log("==================================\n");

    if (restaurantsWithoutBuilding.length > 0) {
      console.log(`건물 정보가 없는 식당 목록 (${restaurantsWithoutBuilding.length}개):`);
      restaurantsWithoutBuilding.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name}`);
      });
    }

    // 6. 카테고리별 식당 수 확인
    console.log("\nMongoDB 카테고리별 식당 수:");
    for (const cat of categories) {
      const count = await restaurantsCollection.countDocuments({ category: cat });
      console.log(`  ${cat}: ${count}개`);
    }

    const totalInDb = await restaurantsCollection.countDocuments({});
    console.log(`\nMongoDB 전체 식당 수: ${totalInDb}개`);

    console.log("\n동기화 완료!");

  } catch (error) {
    console.error("동기화 오류:", error);
  } finally {
    await client.close();
    console.log("\nMongoDB 연결 종료");
  }
}

syncRestaurants();
