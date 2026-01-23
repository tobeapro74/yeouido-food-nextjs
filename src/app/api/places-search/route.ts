import { NextRequest, NextResponse } from "next/server";
import { isValidSessionToken, createSessionToken } from "@/lib/google-session-token";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_NEW_KEY;

// 여의도 중심 좌표
const YEOUIDO_CENTER = {
  lat: 37.5216,
  lng: 126.9245,
};

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// GET: 장소 자동완성 검색
// sessionToken을 사용하면 Autocomplete + Place Details가 한 세션으로 묶여 비용 70~80% 절감
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const clientToken = searchParams.get("sessionToken");

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        predictions: [],
      });
    }

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Google Places API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // sessionToken 처리: 클라이언트에서 받거나 새로 생성
    const sessionToken = isValidSessionToken(clientToken) ? clientToken : createSessionToken();

    // Google Places Autocomplete API 호출 (sessionToken 포함)
    const autocompleteUrl = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    autocompleteUrl.searchParams.set("input", query);
    autocompleteUrl.searchParams.set("key", GOOGLE_PLACES_API_KEY);
    autocompleteUrl.searchParams.set("language", "ko");
    autocompleteUrl.searchParams.set("types", "restaurant|food|cafe");
    autocompleteUrl.searchParams.set("location", `${YEOUIDO_CENTER.lat},${YEOUIDO_CENTER.lng}`);
    autocompleteUrl.searchParams.set("radius", "3000"); // 3km 반경
    autocompleteUrl.searchParams.set("strictbounds", "false");
    autocompleteUrl.searchParams.set("sessiontoken", sessionToken as string);

    const response = await fetch(autocompleteUrl.toString());
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Places Autocomplete error:", data.status, data.error_message);
      return NextResponse.json(
        { success: false, error: "검색 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const predictions = (data.predictions || []).map((p: PlacePrediction) => ({
      place_id: p.place_id,
      name: p.structured_formatting.main_text,
      description: p.description,
      secondary_text: p.structured_formatting.secondary_text,
    }));

    // sessionToken 포함하여 클라이언트가 Place Details 호출 시 재사용 가능
    return NextResponse.json({
      success: true,
      predictions,
      sessionToken,
    });
  } catch (error) {
    console.error("Places search error:", error);
    return NextResponse.json(
      { success: false, error: "검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
