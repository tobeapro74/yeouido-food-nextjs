import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_NEW_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  formatted_phone_number?: string;
  opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  website?: string;
  url?: string; // Google Maps URL
  business_status?: string;
}

// POST: 장소 상세 정보 조회 (place_id로)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { placeId } = body;

    if (!placeId) {
      return NextResponse.json(
        { success: false, error: "place_id가 필요합니다." },
        { status: 400 }
      );
    }

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Google Places API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // Google Place Details API 호출
    const fields = [
      "place_id",
      "name",
      "formatted_address",
      "geometry",
      "rating",
      "user_ratings_total",
      "price_level",
      "formatted_phone_number",
      "opening_hours",
      "photos",
      "website",
      "url",
      "business_status",
    ].join(",");

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=ko&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Place Details error:", data.status, data.error_message);
      return NextResponse.json(
        { success: false, error: "장소 정보를 가져올 수 없습니다." },
        { status: 500 }
      );
    }

    const result: PlaceDetails = data.result;

    // 휴업/폐업 상태 확인
    if (result.business_status === "CLOSED_PERMANENTLY") {
      return NextResponse.json({
        success: false,
        error: "폐업한 장소입니다.",
        isClosed: true,
      });
    }

    // 사진 URL 변환 (처음 5개만)
    let photoUrls: string[] = [];
    if (result.photos && result.photos.length > 0) {
      const photoPromises = result.photos.slice(0, 5).map(async (photo, index) => {
        const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;

        // Cloudinary에 업로드 시도
        try {
          const publicId = `yeouido-food/place_${placeId.substring(0, 20)}_${index}`;
          await cloudinary.uploader.upload(googlePhotoUrl, {
            public_id: publicId,
            overwrite: true,
            resource_type: "image",
          });

          return cloudinary.url(publicId, {
            fetch_format: "auto",
            quality: "auto",
            width: 600,
            height: 400,
            crop: "fill",
          });
        } catch {
          // 업로드 실패시 Google URL 반환
          return googlePhotoUrl;
        }
      });

      photoUrls = await Promise.all(photoPromises);
    }

    // 지역 판단 (주소 기반)
    const address = result.formatted_address || "";
    let region: "서여의도" | "동여의도" = "동여의도"; // 기본값

    // 서여의도 키워드
    const westKeywords = ["국회", "의사당", "여의대로", "은행로"];
    // 동여의도 키워드
    const eastKeywords = ["여의도동", "국제금융로", "여의나루로", "여의공원로"];

    for (const keyword of westKeywords) {
      if (address.includes(keyword)) {
        region = "서여의도";
        break;
      }
    }
    for (const keyword of eastKeywords) {
      if (address.includes(keyword)) {
        region = "동여의도";
        break;
      }
    }

    // 좌표로 추가 판단 (경도 126.925 기준)
    if (result.geometry?.location) {
      const { lng } = result.geometry.location;
      if (lng < 126.925) {
        region = "서여의도";
      } else {
        region = "동여의도";
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        place_id: result.place_id,
        name: result.name,
        address: result.formatted_address,
        coordinates: result.geometry?.location || null,
        rating: result.rating || null,
        reviewCount: result.user_ratings_total || null,
        priceLevel: result.price_level || null,
        phoneNumber: result.formatted_phone_number || null,
        openingHours: result.opening_hours?.weekday_text || [],
        isOpen: result.opening_hours?.open_now,
        photos: photoUrls,
        website: result.website || null,
        googleMapUrl: result.url || null,
        businessStatus: result.business_status,
        region,
      },
    });
  } catch (error) {
    console.error("Place details error:", error);
    return NextResponse.json(
      { success: false, error: "장소 정보 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// GET: 텍스트 검색으로 장소 상세 정보 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { success: false, error: "검색어가 필요합니다." },
        { status: 400 }
      );
    }

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Google Places API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 먼저 텍스트로 장소 검색
    const searchQuery = `${query} 여의도`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&language=ko&key=${GOOGLE_PLACES_API_KEY}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== "OK" || !searchData.candidates?.length) {
      return NextResponse.json({
        success: false,
        error: "검색 결과가 없습니다.",
      });
    }

    const placeId = searchData.candidates[0].place_id;

    // place_id로 상세 정보 조회 (POST 핸들러 재사용)
    const detailsRequest = new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId }),
    });

    return POST(detailsRequest as NextRequest);
  } catch (error) {
    console.error("Place search error:", error);
    return NextResponse.json(
      { success: false, error: "검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
