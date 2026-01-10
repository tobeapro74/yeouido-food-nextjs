import { NextRequest, NextResponse } from "next/server";

// Places API (New) 전용 키 - 테스트용
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_NEW_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

// Places API (New) - Text Search 테스트
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") || "딘타이펑 여의도";

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: "API key not configured" });
  }

  try {
    // Places API (New) - Text Search
    const searchUrl = "https://places.googleapis.com/v1/places:searchText";

    const response = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        // containingPlaces 필드를 포함한 fieldMask
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.containingPlaces,places.addressComponents"
      },
      body: JSON.stringify({
        textQuery: `${query} 여의도 Seoul Korea`,
        languageCode: "ko"
      })
    });

    const data = await response.json();

    return NextResponse.json({
      query,
      response: data,
      // 첫 번째 결과의 containingPlaces 확인
      firstResult: data.places?.[0] || null,
      containingPlaces: data.places?.[0]?.containingPlaces || null
    });
  } catch (error) {
    console.error("Places API (New) error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
