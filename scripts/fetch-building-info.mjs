// Google Places API로 건물 정보 수집 스크립트
// 실행: node scripts/fetch-building-info.mjs

import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb+srv://tobeapro:1023@cluster0.ppfoisv.mongodb.net/yeouido_food?retryWrites=true&w=majority";
const GOOGLE_API_KEY = "AIzaSyCIt74LXHiWsgscQvJICXMIYrXskEMKv9w";

// containingPlaces의 place ID로 건물 이름 조회
async function getBuildingName(placeResourceName) {
  try {
    const url = `https://places.googleapis.com/v1/${placeResourceName}`;
    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "displayName"
      }
    });
    const data = await response.json();
    return data.displayName?.text || null;
  } catch {
    return null;
  }
}

// 식당 이름으로 건물 정보 조회
async function fetchBuildingInfo(restaurantName, address) {
  try {
    const searchUrl = "https://places.googleapis.com/v1/places:searchText";
    const response = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.containingPlaces"
      },
      body: JSON.stringify({
        textQuery: `${restaurantName} ${address}`,
        languageCode: "ko"
      })
    });

    const data = await response.json();
    const firstPlace = data.places?.[0];
    const containingPlaces = firstPlace?.containingPlaces || [];

    let buildingName = null;
    let containingPlaceId = null;

    if (containingPlaces.length > 0) {
      containingPlaceId = containingPlaces[0].id;
      buildingName = await getBuildingName(containingPlaces[0].name);
    }

    return {
      buildingName,
      formattedAddress: firstPlace?.formattedAddress || null,
      containingPlaceId
    };
  } catch (error) {
    console.error(`Error fetching building info for ${restaurantName}:`, error);
    return { buildingName: null, formattedAddress: null, containingPlaceId: null };
  }
}

async function main() {
  console.log("Google Places API로 건물 정보 수집 시작...\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("MongoDB 연결 성공!");

    const db = client.db("yeouido_food");
    const restaurantsCollection = db.collection("restaurants");
    const buildingsCollection = db.collection("restaurant_buildings");

    // 건물 정보가 없는 식당 조회
    const restaurantsWithoutBuilding = await restaurantsCollection
      .find({ building: null })
      .toArray();

    console.log(`\n건물 정보가 없는 식당: ${restaurantsWithoutBuilding.length}개`);

    if (restaurantsWithoutBuilding.length === 0) {
      console.log("모든 식당에 건물 정보가 있습니다.");
      return;
    }

    const results = [];

    // 각 식당에 대해 건물 정보 수집
    for (let i = 0; i < restaurantsWithoutBuilding.length; i++) {
      const restaurant = restaurantsWithoutBuilding[i];
      console.log(`\n[${i + 1}/${restaurantsWithoutBuilding.length}] ${restaurant.name} 처리 중...`);

      const { buildingName, formattedAddress, containingPlaceId } = await fetchBuildingInfo(
        restaurant.name,
        restaurant.address
      );

      console.log(`  - 건물명: ${buildingName || "(없음)"}`);

      // restaurant_buildings 컬렉션에 저장
      await buildingsCollection.updateOne(
        { restaurantName: restaurant.name },
        {
          $set: {
            restaurantName: restaurant.name,
            buildingName,
            address: formattedAddress,
            containingPlaceId,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      // 건물 정보가 있으면 restaurants 컬렉션도 업데이트
      if (buildingName) {
        await restaurantsCollection.updateOne(
          { name: restaurant.name },
          {
            $set: {
              building: buildingName,
              googleBuildingName: buildingName,
              updatedAt: new Date()
            }
          }
        );
        results.push({ name: restaurant.name, building: buildingName, found: true });
      } else {
        results.push({ name: restaurant.name, building: null, found: false });
      }

      // API 제한 방지를 위한 딜레이 (1초)
      if (i < restaurantsWithoutBuilding.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log("\n\n========== 수집 결과 ==========");
    const found = results.filter(r => r.found);
    const notFound = results.filter(r => !r.found);

    console.log(`건물 정보 찾음: ${found.length}개`);
    found.forEach(r => console.log(`  ✓ ${r.name} → ${r.building}`));

    console.log(`\n건물 정보 없음: ${notFound.length}개`);
    notFound.forEach(r => console.log(`  ✗ ${r.name}`));

    // 최종 통계
    const totalWithBuilding = await restaurantsCollection.countDocuments({ building: { $ne: null } });
    const totalWithoutBuilding = await restaurantsCollection.countDocuments({ building: null });
    const totalRestaurants = await restaurantsCollection.countDocuments({});

    console.log("\n========== 최종 통계 ==========");
    console.log(`전체 식당: ${totalRestaurants}개`);
    console.log(`건물 정보 있음: ${totalWithBuilding}개`);
    console.log(`건물 정보 없음: ${totalWithoutBuilding}개`);
    console.log("================================\n");

  } catch (error) {
    console.error("오류 발생:", error);
  } finally {
    await client.close();
    console.log("MongoDB 연결 종료");
  }
}

main();
