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

    // 2. Place Details에서 가격대, 전화번호 가져오기
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=price_level,formatted_phone_number&language=ko&key=${GOOGLE_API_KEY}`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    const priceLevel = detailData.result?.price_level;
    const phoneNumber = detailData.result?.formatted_phone_number || null;
    const priceRange = priceLevelToRange(priceLevel);

    return {
      restaurantName,
      placeId,
      priceLevel: priceLevel ?? null,
      priceRange,
      phoneNumber,
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

  // 맛집 목록 (yeouido-food.ts에서 추출)
  const restaurants = [
    "김삼보 여의도점", "하동관 여의도직영1호점", "홍수계 여의도삼계탕", "미스터초우", "해담온",
    "여의도 미나리삼겹살 직영점", "여의도 따로국밥", "국보집", "양미옥 본관", "여담",
    "담소사골순대 여의도점", "소문난 감자탕 여의도점", "모리 여의도역점", "유소반", "오리파",
    "원당감자탕 여의도점", "안주마을 여의도직영점", "교대이층집 여의도점", "남이네주꾸미 여의도점",
    "이연 복합문화공간 봄여름가을겨울", "양지삼계탕 여의도점", "국일곱창 여의도점", "더반 코리안 테이블",
    "한우촌 여의도점", "아루히 여의도", "황보석 여의도점", "왕산", "얌샘김밥 여의도역점",
    "뜰안에 여의도점", "황제 삼겹살", "스시코우지 여의도점", "스시야", "철원 더덕애", "낭푸드",
    "셀럽릿지", "판교장인칼국수 여의도역점", "수라공방 여의도점", "참치왕자 여의도점", "손맛칼국수",
    "오뎅바 여의도역점", "스시만월 여의도점", "마루", "연남서식당 여의도점", "화선 일식 여의도",
    "진미평양냉면 여의도점", "매일조개 여의도점", "옛날아구찜 여의도점", "대웅", "도토리식당 여의도역점",
    "여수밤바다 여의도점", "미수식당 여의도점", "명물닭꼬치", "스시랑 여의도점", "평양왕만두 여의도점",
    "모래내장터국수 본점", "형제칼국수", "다우랑 여의도점", "우가", "차이홍 여의도 IFC몰점",
    "도쿄라멘 여의도역점", "도쿄스테이크", "낙원갈비 여의도점", "장충족발 여의도점", "도원 여의도 IFC몰점",
    "담미온 여의도 IFC몰점", "육수당 여의도 IFC몰점", "일미리 여의도점", "죠죠", "고봉민김밥인 여의도점",
    "진주집 여의도점", "프랑스인 여의도점", "돈텐동 여의도점", "레디오가든", "베이징 여의도점",
    "본죽 여의도역점", "본죽&비빔밥cafe 여의도역점", "더베이커스테이블 여의도 IFC몰점", "서래갈매기 여의도점",
    "산청숯불가든 여의도점", "설빙 여의도역점", "도쿄덮밥 여의도역점", "신전떡볶이 여의도역점",
    "신포우리만두 여의도역점", "압구정 우대포 여의도점", "온더보더 IFC몰점", "오봉집 여의도점",
    "이디야커피 여의도역점", "본설렁탕 여의도점", "태릉숯불갈비 여의도점", "시드니볶음밥 연합점",
    "산촌 여의도역점", "춘천집닭갈비 여의도점", "남미루", "한샘 여의도점", "홍콩반점0410 여의도역점",
    "두레박 여의도점", "명동칼국수 여의도점", "백소정 여의도 IFC몰점", "미진 IFC몰점", "밀탑 IFC몰점",
    "우동카덴 여의도 IFC몰점", "스시도쿠 여의도점", "곱 강남점", "구내식당 여의도점", "수타왕손짜장 여의도역점",
    "형제스시 여의도점", "덕수궁수라간 여의도점", "행운닭갈비 여의도점", "오봉집 여의도역점", "디저트카페 러브솜",
    "죽이야기 여의도점", "에그슬럿 IFC점", "쟈니덤플링 IFC몰점", "호시노커피 IFC몰점", "서울숲브런치 여의도점",
    "제일제면소 여의도역점", "왕비집 여의도점", "뿌리깊은나무 본점", "장성진미떡갈비 여의도점", "산청숯불가든 제2여의도점",
    "금나래쭈꾸미 여의도점", "육회공간 여의도점", "파이어벨 여의도점", "교동짬뽕 여의도점", "참치공방 여의도점",
    "미림 여의도", "무탄 여의도", "딘타이펑 여의도 IFC몰점", "이문설렁탕 여의도점", "봉구비어 여의도점",
    "왕만두 여의도점", "산촌 여의도점", "서갈비 더현대서울점", "풀잎채 여의도점", "더밀 여의도점",
    "에스프레소바 여의도점", "왕돈까스 여의도점", "더플레이스 여의도점", "옛날손칼국수 여의도점", "담소 여의도점",
    "봉구스밥버거 여의도역점", "퐁낭 여의도 IFC몰점", "쿠차라 IFC몰점", "버거앤프라이즈 여의도역점",
    "청담소반 여의도 IFC몰점", "빕스 IFC몰점", "부어 IFC몰점", "라그릴리아 여의도 IFC몰점", "샤이샤이 여의도 IFC몰점",
    "유타 여의도 IFC몰점", "마레도 여의도 IFC몰점", "장어가 여의도 IFC몰점", "피자익스프레스 IFC몰점",
    "블랙탭 IFC몰점", "씨푸드킹 IFC몰점", "쉐이크쉑 여의도점", "반쎄오스토리 여의도점", "삼송빵집 여의도역점",
    "왕십리곱창 여의도점", "땀땀 여의도 IFC몰점", "하노이의아침 여의도역점", "포빌리지 여의도역점",
    "몬스터피자 여의도점", "피자헛 여의도역점", "멕시카나치킨 여의도역점", "네네치킨 여의도역점",
    "BBQ치킨 여의도역점", "맘스터치 여의도역점", "롯데리아 여의도역점", "버거킹 여의도점", "맥도날드 여의도역점",
    "서브웨이 여의도역점", "KFC 여의도역점", "파리바게뜨 여의도역점", "뚜레쥬르 여의도역점", "던킨 여의도역점",
    "스타벅스 여의도역점", "이디야커피 여의도점", "메가커피 여의도역점", "컴포즈커피 여의도역점",
    "투썸플레이스 여의도역점", "할리스커피 여의도역점", "공차 여의도역점"
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

    if (info && (info.priceRange || info.phoneNumber)) {
      await collection.updateOne(
        { restaurantName: name },
        { $set: info },
        { upsert: true }
      );
      console.log(`  → 저장 완료: 가격대=${info.priceRange || 'N/A'}, 전화=${info.phoneNumber || 'N/A'}`);
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
