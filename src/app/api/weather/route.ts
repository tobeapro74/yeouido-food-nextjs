import { NextResponse } from "next/server";

// 여의도 좌표
const YEOUIDO_LAT = 37.5219;
const YEOUIDO_LON = 126.9245;

// WMO 날씨 코드 매핑
const weatherCodeMap: Record<number, { weather: string; icon: string; type: WeatherType }> = {
  0: { weather: "맑음", icon: "☀️", type: "sunny" },
  1: { weather: "대체로 맑음", icon: "🌤️", type: "sunny" },
  2: { weather: "구름조금", icon: "⛅", type: "cloudy" },
  3: { weather: "흐림", icon: "☁️", type: "cloudy" },
  45: { weather: "안개", icon: "🌫️", type: "foggy" },
  48: { weather: "짙은 안개", icon: "🌫️", type: "foggy" },
  51: { weather: "이슬비", icon: "🌦️", type: "rainy" },
  53: { weather: "이슬비", icon: "🌦️", type: "rainy" },
  55: { weather: "이슬비", icon: "🌦️", type: "rainy" },
  56: { weather: "진눈깨비", icon: "🌨️", type: "rainy" },
  57: { weather: "진눈깨비", icon: "🌨️", type: "rainy" },
  61: { weather: "약한 비", icon: "🌧️", type: "rainy" },
  63: { weather: "비", icon: "🌧️", type: "rainy" },
  65: { weather: "강한 비", icon: "🌧️", type: "rainy" },
  66: { weather: "차가운 비", icon: "🌧️", type: "rainy" },
  67: { weather: "차가운 비", icon: "🌧️", type: "rainy" },
  71: { weather: "약한 눈", icon: "🌨️", type: "snowy" },
  73: { weather: "눈", icon: "❄️", type: "snowy" },
  75: { weather: "강한 눈", icon: "❄️", type: "snowy" },
  77: { weather: "눈 알갱이", icon: "🌨️", type: "snowy" },
  80: { weather: "소나기", icon: "🌦️", type: "rainy" },
  81: { weather: "소나기", icon: "🌧️", type: "rainy" },
  82: { weather: "강한 소나기", icon: "🌧️", type: "rainy" },
  85: { weather: "눈 소나기", icon: "🌨️", type: "snowy" },
  86: { weather: "강한 눈 소나기", icon: "❄️", type: "snowy" },
  95: { weather: "뇌우", icon: "⛈️", type: "rainy" },
  96: { weather: "우박 뇌우", icon: "⛈️", type: "rainy" },
  99: { weather: "강한 우박 뇌우", icon: "⛈️", type: "rainy" },
};

type WeatherType = "sunny" | "cloudy" | "rainy" | "snowy" | "foggy";

interface WeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    weatherCode: number;
    weather: string;
    icon: string;
    type: WeatherType;
    humidity: number;
    windSpeed: number;
  };
  yesterday: {
    temperature: number;
    weatherCode: number;
    weather: string;
    type: WeatherType;
  };
  comparison: {
    tempDiff: number;
    tempTrend: "hotter" | "colder" | "same";
    weatherChanged: boolean;
  };
  recommendation: {
    message: string;
    tags: string[];
  };
}

function parseWeatherCode(code: number) {
  return weatherCodeMap[code] || { weather: "알 수 없음", icon: "❓", type: "cloudy" as WeatherType };
}

function getTemperatureType(temp: number): "hot" | "warm" | "cool" | "cold" {
  if (temp >= 28) return "hot";
  if (temp >= 20) return "warm";
  if (temp >= 10) return "cool";
  return "cold";
}

function generateRecommendation(
  weatherType: WeatherType,
  tempType: "hot" | "warm" | "cool" | "cold",
  comparison: { tempDiff: number; weatherChanged: boolean }
): { message: string; tags: string[] } {
  // 날씨 변화가 있는 경우 우선
  if (comparison.weatherChanged) {
    if (weatherType === "rainy") {
      return {
        message: "비가 오네요! 파전에 막걸리 어때요?",
        tags: ["파전", "막걸리", "칼국수", "수제비", "감자탕"],
      };
    }
    if (weatherType === "snowy") {
      return {
        message: "눈이 오는 날! 따끈한 국물 어때요?",
        tags: ["설렁탕", "곰탕", "칼국수", "어묵탕"],
      };
    }
  }

  // 기온 변화가 큰 경우 (5도 이상)
  if (Math.abs(comparison.tempDiff) >= 5) {
    if (comparison.tempDiff > 0) {
      return {
        message: `어제보다 ${comparison.tempDiff}도 올랐어요! 시원한 음식 추천`,
        tags: ["냉면", "콩국수", "샐러드", "회", "물회"],
      };
    } else {
      return {
        message: `어제보다 ${Math.abs(comparison.tempDiff)}도 내려갔어요! 따뜻한 음식 추천`,
        tags: ["국밥", "찌개", "샤브샤브", "곰탕", "설렁탕"],
      };
    }
  }

  // 현재 날씨 기반 추천
  if (weatherType === "rainy") {
    return {
      message: "비 오는 날엔 역시 파전!",
      tags: ["파전", "막걸리", "칼국수", "수제비", "감자탕"],
    };
  }

  if (weatherType === "snowy") {
    return {
      message: "눈 오는 날엔 따뜻한 국물!",
      tags: ["설렁탕", "곰탕", "칼국수", "어묵탕", "감자탕"],
    };
  }

  // 기온 기반 추천
  switch (tempType) {
    case "hot":
      return {
        message: "더운 날씨! 시원한 음식 어때요?",
        tags: ["냉면", "콩국수", "밀면", "샐러드", "회", "물회"],
      };
    case "warm":
      return {
        message: "따뜻한 날씨에요!",
        tags: ["비빔밥", "덮밥", "우동", "볶음밥"],
      };
    case "cool":
      return {
        message: "선선한 날씨네요!",
        tags: ["칼국수", "수제비", "라멘", "국수"],
      };
    case "cold":
      return {
        message: "추운 날씨! 따끈한 국물 어때요?",
        tags: ["국밥", "설렁탕", "곰탕", "찌개", "샤브샤브", "감자탕"],
      };
  }
}

export async function GET() {
  try {
    // Open-Meteo API 호출 (무료, API 키 불필요)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${YEOUIDO_LAT}&longitude=${YEOUIDO_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia/Seoul&past_days=1&forecast_days=1`;

    const response = await fetch(url, {
      next: { revalidate: 1800 }, // 30분 캐시
    });

    if (!response.ok) {
      throw new Error("날씨 API 호출 실패");
    }

    const data = await response.json();

    // 현재 날씨 파싱
    const currentWeather = parseWeatherCode(data.current.weather_code);
    const currentTemp = Math.round(data.current.temperature_2m);
    const feelsLike = Math.round(data.current.apparent_temperature);

    // 어제 날씨 (daily 배열의 첫 번째가 어제)
    const yesterdayCode = data.daily.weather_code[0];
    const yesterdayWeather = parseWeatherCode(yesterdayCode);
    const yesterdayTemp = Math.round(
      (data.daily.temperature_2m_max[0] + data.daily.temperature_2m_min[0]) / 2
    );

    // 비교 데이터
    const tempDiff = currentTemp - yesterdayTemp;
    const comparison = {
      tempDiff,
      tempTrend: tempDiff > 2 ? "hotter" : tempDiff < -2 ? "colder" : "same" as "hotter" | "colder" | "same",
      weatherChanged: currentWeather.type !== yesterdayWeather.type,
    };

    // 추천 생성
    const tempType = getTemperatureType(currentTemp);
    const recommendation = generateRecommendation(currentWeather.type, tempType, comparison);

    const weatherData: WeatherData = {
      current: {
        temperature: currentTemp,
        feelsLike,
        weatherCode: data.current.weather_code,
        weather: currentWeather.weather,
        icon: currentWeather.icon,
        type: currentWeather.type,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
      },
      yesterday: {
        temperature: yesterdayTemp,
        weatherCode: yesterdayCode,
        weather: yesterdayWeather.weather,
        type: yesterdayWeather.type,
      },
      comparison,
      recommendation,
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error("날씨 API 에러:", error);

    // 폴백 데이터
    const fallbackData: WeatherData = {
      current: {
        temperature: 10,
        feelsLike: 8,
        weatherCode: 0,
        weather: "맑음",
        icon: "☀️",
        type: "sunny",
        humidity: 50,
        windSpeed: 3,
      },
      yesterday: {
        temperature: 10,
        weatherCode: 0,
        weather: "맑음",
        type: "sunny",
      },
      comparison: {
        tempDiff: 0,
        tempTrend: "same",
        weatherChanged: false,
      },
      recommendation: {
        message: "오늘도 맛있는 한 끼!",
        tags: [],
      },
    };

    return NextResponse.json(fallbackData);
  }
}
