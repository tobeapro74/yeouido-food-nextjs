import { NextRequest, NextResponse } from "next/server";

// Places API (New) 전용 키 - 테스트용
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_NEW_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

// containingPlaces의 place ID로 건물 이름 조회
async function getBuildingName(placeResourceName: string): Promise<string | null> {
  try {
    const url = `https://places.googleapis.com/v1/${placeResourceName}`;
    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_API_KEY!,
        "X-Goog-FieldMask": "displayName"
      }
    });
    const data = await response.json();
    return data.displayName?.text || null;
  } catch {
    return null;
  }
}

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
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.containingPlaces"
      },
      body: JSON.stringify({
        textQuery: `${query} 여의도 Seoul Korea`,
        languageCode: "ko"
      })
    });

    const data = await response.json();
    const firstPlace = data.places?.[0];
    const containingPlaces = firstPlace?.containingPlaces || [];

    // containingPlaces에서 건물 이름 가져오기
    let buildingName: string | null = null;
    if (containingPlaces.length > 0) {
      buildingName = await getBuildingName(containingPlaces[0].name);
    }

    return NextResponse.json({
      query,
      restaurant: firstPlace?.displayName?.text || null,
      address: firstPlace?.formattedAddress || null,
      buildingName,
      containingPlaces,
      // 전체 응답 (디버깅용)
      _debug: data
    });
  } catch (error) {
    console.error("Places API (New) error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
