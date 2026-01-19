// 기존 맛집들의 가격대/전화번호를 Google API에서 수집하여 MongoDB에 저장하는 스크립트
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://tobeapro:1023@cluster0.ppfoisv.mongodb.net/yeouido_food?retryWrites=true&w=majority';
const GOOGLE_API_KEY = 'AIzaSyAP4-MpGNRYObV4vbPMjXdWYSUCLoux1s4';

// 가격대 변환
function priceLevelToRange(level) {
  const ranges = {
    0: '무료',
    1: '₩ (저렴)',
    2: '₩₩ (보통)',
    3: '₩₩₩ (비쌈)',
    4: '₩₩₩₩ (매우 비쌈)',
  };
  return ranges[level] || null;
}

// 영업상태 변환 (Google business_status)
function businessStatusToKorean(status) {
  const statuses = {
    'OPERATIONAL': '영업중',
    'CLOSED_TEMPORARILY': '임시휴업',
    'CLOSED_PERMANENTLY': '폐업',
  };
  return statuses[status] || null;
}

// 딜레이 함수
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Google Places API로 식당 정보 조회
async function getRestaurantInfo(restaurantName) {
  try {
    // 1. Place ID 검색
    const searchQuery = `${restaurantName} 여의도 Seoul Korea`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${GOOGLE_API_KEY}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.candidates || searchData.candidates.length === 0) {
      console.log(`  → ${restaurantName}: 검색 결과 없음`);
      return null;
    }

    const placeId = searchData.candidates[0].place_id;

    // 2. Place Details에서 가격대, 전화번호, 영업상태 가져오기
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=price_level,formatted_phone_number,business_status&language=ko&key=${GOOGLE_API_KEY}`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    const priceLevel = detailData.result?.price_level;
    const phoneNumber = detailData.result?.formatted_phone_number || null;
    const businessStatus = detailData.result?.business_status || null;
    const priceRange = priceLevelToRange(priceLevel);
    const businessStatusKr = businessStatusToKorean(businessStatus);

    return {
      restaurantName,
      placeId,
      priceLevel: priceLevel ?? null,
      priceRange,
      phoneNumber,
      businessStatus,
      businessStatusKr,
      updatedAt: new Date()
    };
  } catch (error) {
    console.error(`  → ${restaurantName}: 에러 - ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('=== 맛집 가격대/전화번호 수집 시작 ===\n');

  // MongoDB 연결
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('yeouido_food');
  const collection = db.collection('restaurant_prices');

  // 맛집 목록 (yeouido-food.ts에서 자동 추출 - 2025년 1월)
  const restaurants = [
    "김삼보 여의도점", "하동관 여의도직영1호점", "홍수계 여의도삼계탕", "미스터초우", "해담온",
    "여의도 미나리삼겹살 직영점", "여의도 따로국밥", "구마산", "오락떡볶이", "조가네 닭한마리 닭갈비",
    "김가네 여의도점", "장독대김치찌개", "청하", "가양칼국수버섯매운탕", "홍정식당",
    "마초갈비 여의도점", "별미볶음점", "만나손칼국수", "깡장양곱창", "청식당 신송빌딩점",
    "신송한식", "완백부대찌개 등심 철판 여의도점", "수하동 여의도점", "성하", "여의돈",
    "향토", "쌍대포맷돌순두부", "케이브 여의도점", "제육의 법칙 여의도점", "토방",
    "동남집", "골뱅이스쿨", "계림닭도리탕", "특별한 오복수산", "무안회관",
    "중앙해장", "무월", "미미옥", "여의도 요정", "사위식당",
    "봉추찜닭 파이낸스타워점", "비가오면", "리김밥 파이낸스타워점", "모도우 여의도", "한암동 여의도점",
    "오복수산 여의도점", "고우가 여의도점", "진가와 여의도점", "렌위치", "브레드피트",
    "진주집", "용설왕족발", "부흥동태", "진진만두국", "이도 여의도",
    "여의도 셋째집", "가양 칼국수 버섯매운탕", "정인면옥 본점", "정우칼국수보쌈", "뒤푸리",
    "짜글이양곱창", "도시해장국", "구이구이", "마초갈비 여의도공원점", "풍년식당1979 서여의도점",
    "리셰", "장독대 김치찌개 여의도", "도약 서여의도점", "엔터리 해장국 여의도점", "8번대물집 여의도",
    "짝태&노가리 여의도", "은호식당", "소호66", "연안식당 국회의사당점", "창고43 VIP점",
    "창고43 서여의도점", "여의도 나주곰탕", "한방대가삼계탕", "불고기브라더스 서여의도점", "해동복국",
    "백암왕순대", "운산", "국민추어탕", "여의도뚝배기", "다복집",
    "상춘재 더현대서울", "나의가야 더현대서울", "고청담 여의도점", "최선도 브라이튼여의도점", "단정 브라이튼여의도점",
    "소이연남 브라이튼여의도점", "카츠아지 여의도점", "마마된장 IFC몰점", "송옥 여의도 IFC몰점", "제일제면소 IFC몰 여의도점",
    "호우섬 더현대서울점", "오르조 르브텀 여의도", "하얀과자점", "르뵈프 여의도점", "테이스팅룸 여의도",
    "퍼스트플러스에이드 여의도", "해밀파스타", "올라 여의도 (OLA)", "로와이드 여의도점", "미도인 파이낸스여의도점",
    "카레나이스", "터치더스카이", "워킹온더클라우드", "63 레스토랑 파빌리온", "더스테이크하우스 IFC몰점",
    "바스버거 율촌빌딩점", "브루클린 더 버거 조인트 BNK점", "온더보더 IFC몰점", "더플레이스 여의도IFC점", "테이스티룸 IFC몰점",
    "렌위치 여의도 IFC점", "리스토란테 에오 더현대서울", "번패티번 더현대서울점", "수티 더현대서울점", "이탈리 더현대서울점",
    "SMT라운지 더현대서울", "리스카페 브라이튼여의도점", "탭샵바 브라이튼여의도점", "FOUR B 브라이튼여의도점", "젤라떼리아 도도 브라이튼여의도점",
    "고수타코 여의도KBS점", "37.5 시그니처", "그리디몬 여의도", "로와이드 원센티널점", "테디스오븐 원센티널점",
    "브릭샌드 원센티널점", "백원 여의도점", "홍보석", "세양원", "신승반점",
    "무탄 여의도", "차알 IFC몰점", "판다익스프레스 IFC몰점", "이루 KBS서여의도점", "유방녕 더현대서울",
    "사천화가 더현대서울", "신홍러우 여의도", "63 백리향", "기소야 서여의도점", "아루히 여의도",
    "아루히 니와", "스시미소 여의도", "스시유 여의도점", "아라타 여의도", "타마 여의도",
    "함루", "후라토식당 여의도점", "스시야", "야키토리 묵", "키보 락앤롤",
    "삿뽀로블랙 IFC몰점", "시마스시 IFC몰점", "오미식당 IFC몰점", "히바린 여의도 IFC몰점", "하루 여의도점",
    "여의도소바우동", "핫담온 여의도", "띠새라면 여의도KBS본관점", "63 슈치쿠", "카덴 더현대서울",
    "로바 더현대서울", "송 더현대서울", "정돈 프리미엄 더현대서울", "마츠노하나 더현대서울점", "탐광 더현대서울점",
    "파파호 여의도점", "포베트남 여의도점", "타이 익스프레스 여의도", "콘타이 IFC몰점", "아그라 IFC몰점",
    "점보씨푸드 IFC몰점", "퍼틴 IFC몰점", "포포유 IFC몰점", "반타이 더현대서울", "효뜨 더현대서울"
  ];

  let processed = 0;
  let saved = 0;
  let skipped = 0;

  for (const name of restaurants) {
    processed++;

    // 이미 저장된 것은 스킵
    const existing = await collection.findOne({ restaurantName: name });
    if (existing) {
      console.log(`[${processed}/${restaurants.length}] ${name}: 이미 저장됨 (스킵)`);
      skipped++;
      continue;
    }

    console.log(`[${processed}/${restaurants.length}] ${name} 조회 중...`);
    const info = await getRestaurantInfo(name);

    if (info && (info.priceRange || info.phoneNumber || info.businessStatusKr)) {
      await collection.updateOne(
        { restaurantName: name },
        { $set: info },
        { upsert: true }
      );
      console.log(`  → 저장 완료: 가격대=${info.priceRange || 'N/A'}, 전화=${info.phoneNumber || 'N/A'}, 영업=${info.businessStatusKr || 'N/A'}`);
      saved++;
    } else {
      console.log(`  → 정보 없음`);
    }

    // API 레이트 제한 방지 (1초 딜레이)
    await delay(1000);
  }

  console.log('\n=== 수집 완료 ===');
  console.log(`총 처리: ${processed}개`);
  console.log(`저장: ${saved}개`);
  console.log(`스킵: ${skipped}개`);

  await client.close();
}

main().catch(console.error);
