// Google Places API로 건물 정보 수집 스크립트 v2
// 식당 이름만으로 검색하여 건물 정보 확보
// 실행: node scripts/fetch-building-info-v2.mjs

import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb+srv://tobeapro:1023@cluster0.ppfoisv.mongodb.net/yeouido_food?retryWrites=true&w=majority";
const GOOGLE_API_KEY = "AIzaSyCIt74LXHiWsgscQvJICXMIYrXskEMKv9w";

// 건물 정보 없는 식당들의 정확한 정보 (수동 조사)
const restaurantInfo = [
  { name: "마초갈비 여의도점", searchQuery: "마초갈비 여의도 전경련회관" },
  { name: "은호식당", searchQuery: "은호식당 여의도 꼬리곰탕" },
  { name: "해동복국", searchQuery: "해동복국 여의도" },
  { name: "르뵈프 여의도점", searchQuery: "르뵈프 여의도 전경련회관" },
  { name: "테이스팅룸 여의도", searchQuery: "테이스팅룸 여의도 전경련회관" },
  { name: "올라 여의도 (OLA)", searchQuery: "올라 OLA 여의도 IFC" },
  { name: "백원 여의도점", searchQuery: "백원 중식당 여의도 전경련회관" },
  { name: "홀리차우 여의도점", searchQuery: "홀리차우 여의도" },
  { name: "아루히 여의도", searchQuery: "아루히 스시 여의도" },
  { name: "아루히 니와", searchQuery: "아루히 니와 여의도 전경련회관" },
  { name: "스시유 여의도점", searchQuery: "스시유 여의도" },
  { name: "타마 여의도", searchQuery: "타마 장어 여의도" },
  { name: "타이 익스프레스 여의도", searchQuery: "타이 익스프레스 여의도" },
  { name: "싱가포르 호커 여의도", searchQuery: "싱가포르 호커 여의도" }
];

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

// 식당 검색 - 여러 방법 시도
async function searchRestaurant(searchQuery) {
  try {
    const searchUrl = "https://places.googleapis.com/v1/places:searchText";
    const response = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.containingPlaces,places.addressComponents"
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        languageCode: "ko",
        locationBias: {
          circle: {
            center: { latitude: 37.5219, longitude: 126.9245 }, // 여의도 중심
            radius: 2000.0
          }
        }
      })
    });

    const data = await response.json();
    return data.places || [];
  } catch (error) {
    console.error(`검색 오류:`, error);
    return [];
  }
}

// 건물 정보 추출
async function extractBuildingInfo(places) {
  if (!places || places.length === 0) return null;

  const firstPlace = places[0];
  const containingPlaces = firstPlace?.containingPlaces || [];

  let buildingName = null;

  // containingPlaces에서 건물 정보 가져오기
  if (containingPlaces.length > 0) {
    buildingName = await getBuildingName(containingPlaces[0].name);
  }

  // 주소에서 건물명 추출 시도 (없는 경우)
  if (!buildingName && firstPlace.formattedAddress) {
    const address = firstPlace.formattedAddress;
    // 주소에서 빌딩명 패턴 찾기
    const buildingPatterns = [
      /(\S+빌딩)/,
      /(\S+타워)/,
      /(\S+센터)/,
      /(\S+몰)/,
      /(\S+회관)/,
      /(IFC\S*)/,
      /(\S+오피스텔)/
    ];

    for (const pattern of buildingPatterns) {
      const match = address.match(pattern);
      if (match) {
        buildingName = match[1];
        break;
      }
    }
  }

  return {
    buildingName,
    formattedAddress: firstPlace?.formattedAddress || null,
    displayName: firstPlace?.displayName?.text || null
  };
}

async function main() {
  console.log("Google Places API로 건물 정보 재수집 시작...\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("MongoDB 연결 성공!\n");

    const db = client.db("yeouido_food");
    const restaurantsCollection = db.collection("restaurants");
    const buildingsCollection = db.collection("restaurant_buildings");

    const results = [];

    for (let i = 0; i < restaurantInfo.length; i++) {
      const info = restaurantInfo[i];
      console.log(`[${i + 1}/${restaurantInfo.length}] ${info.name}`);
      console.log(`  검색어: "${info.searchQuery}"`);

      const places = await searchRestaurant(info.searchQuery);

      if (places.length > 0) {
        console.log(`  결과: ${places[0].displayName?.text || '(이름없음)'}`);
        console.log(`  주소: ${places[0].formattedAddress || '(주소없음)'}`);

        const buildingInfo = await extractBuildingInfo(places);

        if (buildingInfo?.buildingName) {
          console.log(`  건물: ${buildingInfo.buildingName} ✓`);

          // MongoDB 업데이트
          await restaurantsCollection.updateOne(
            { name: info.name },
            {
              $set: {
                building: buildingInfo.buildingName,
                googleBuildingName: buildingInfo.buildingName,
                updatedAt: new Date()
              }
            }
          );

          await buildingsCollection.updateOne(
            { restaurantName: info.name },
            {
              $set: {
                restaurantName: info.name,
                buildingName: buildingInfo.buildingName,
                address: buildingInfo.formattedAddress,
                updatedAt: new Date()
              }
            },
            { upsert: true }
          );

          results.push({ name: info.name, building: buildingInfo.buildingName, found: true });
        } else {
          console.log(`  건물: (없음) ✗`);
          results.push({ name: info.name, building: null, found: false });
        }
      } else {
        console.log(`  결과: 검색 결과 없음 ✗`);
        results.push({ name: info.name, building: null, found: false });
      }

      console.log("");

      // API 제한 방지
      if (i < restaurantInfo.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log("\n========== 수집 결과 ==========");
    const found = results.filter(r => r.found);
    const notFound = results.filter(r => !r.found);

    console.log(`건물 정보 찾음: ${found.length}개`);
    found.forEach(r => console.log(`  ✓ ${r.name} → ${r.building}`));

    if (notFound.length > 0) {
      console.log(`\n건물 정보 없음: ${notFound.length}개`);
      notFound.forEach(r => console.log(`  ✗ ${r.name}`));
    }

    // 최종 통계
    const totalWithBuilding = await restaurantsCollection.countDocuments({ building: { $ne: null } });
    const totalWithoutBuilding = await restaurantsCollection.countDocuments({ building: null });

    console.log("\n========== 최종 통계 ==========");
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
