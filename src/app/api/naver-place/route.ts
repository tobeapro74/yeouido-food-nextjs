import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

interface NaverPlaceCache {
  restaurantName: string;
  naverPlaceId: string;
  bookingUrl: string;
  updatedAt: Date;
}

// 네이버 지역검색 응답에서 place_id 추출
function extractPlaceId(link: string): string | null {
  // link 형식: https://map.naver.com/v5/search/...?placePath=place/1234567
  // 또는: https://m.place.naver.com/restaurant/1234567/home
  const placeMatch = link.match(/place\/(\d+)/);
  if (placeMatch) return placeMatch[1];

  const restaurantMatch = link.match(/restaurant\/(\d+)/);
  if (restaurantMatch) return restaurantMatch[1];

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { success: false, error: "name 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // 1. MongoDB 캐시 확인
    const { db } = await connectToDatabase();
    const cache = db.collection<NaverPlaceCache>("naver_place_cache");

    const cached = await cache.findOne({ restaurantName: name });
    if (cached) {
      // 캐시된 URL이 /booking이면 /reservation으로 보정
      const cachedUrl = cached.bookingUrl.replace(/\/booking$/, "/reservation");
      return NextResponse.json({
        success: true,
        placeId: cached.naverPlaceId,
        bookingUrl: cachedUrl,
        cached: true,
      });
    }

    // 2. 네이버 API 키 확인
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET ||
        NAVER_CLIENT_ID === "발급후_입력") {
      // API 키 미설정 시 네이버 지도 검색 fallback
      const fallbackUrl = `https://m.place.naver.com/restaurant/list?query=${encodeURIComponent(name + " 여의도")}`;
      return NextResponse.json({
        success: true,
        placeId: null,
        bookingUrl: fallbackUrl,
        fallback: true,
      });
    }

    // 3. 네이버 지역검색 API 호출
    const query = `${name} 여의도`;
    const apiUrl = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=1`;

    const response = await fetch(apiUrl, {
      headers: {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
      },
    });

    if (!response.ok) {
      console.error("네이버 API 오류:", response.status);
      return NextResponse.json(
        { success: false, error: "네이버 API 호출에 실패했습니다." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      // 검색 결과 없으면 네이버 지도 검색 fallback
      const fallbackUrl = `https://m.place.naver.com/restaurant/list?query=${encodeURIComponent(name + " 여의도")}`;
      return NextResponse.json({
        success: true,
        placeId: null,
        bookingUrl: fallbackUrl,
        fallback: true,
      });
    }

    const item = data.items[0];
    const placeId = extractPlaceId(item.link);

    if (!placeId) {
      // place_id 추출 실패 시 네이버 지도 검색 fallback
      const fallbackUrl = `https://m.place.naver.com/restaurant/list?query=${encodeURIComponent(name + " 여의도")}`;
      return NextResponse.json({
        success: true,
        placeId: null,
        bookingUrl: fallbackUrl,
        fallback: true,
      });
    }

    // 4. 예약 직행 URL 생성 (/reservation = 실시간예약 탭)
    const bookingUrl = `https://m.place.naver.com/restaurant/${placeId}/reservation`;

    // 5. MongoDB 캐시 저장
    await cache.updateOne(
      { restaurantName: name },
      {
        $set: {
          naverPlaceId: placeId,
          bookingUrl,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      placeId,
      bookingUrl,
      cached: false,
    });
  } catch (error) {
    console.error("네이버 place 조회 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
