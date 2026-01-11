// 오행 기반 운세 계산 로직

export type Gender = "male" | "female";
export type MaritalStatus = "single" | "married";
export type Element = "목" | "화" | "토" | "금" | "수";
export type Direction = "동" | "서";

// 천간 (10개)
const 천간 = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
// 지지 (12개)
const 지지 = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;

// 천간의 오행
const 천간오행: Record<string, Element> = {
  갑: "목", 을: "목",
  병: "화", 정: "화",
  무: "토", 기: "토",
  경: "금", 신: "금",
  임: "수", 계: "수"
};

// 지지의 오행
const 지지오행: Record<string, Element> = {
  인: "목", 묘: "목",
  사: "화", 오: "화",
  진: "토", 술: "토", 축: "토", 미: "토",
  신: "금", 유: "금",
  해: "수", 자: "수"
};

// 오행 상생 관계 (A가 B를 생함)
const 상생: Record<Element, Element> = {
  목: "화", // 목생화
  화: "토", // 화생토
  토: "금", // 토생금
  금: "수", // 금생수
  수: "목"  // 수생목
};

// 오행 상극 관계 (A가 B를 극함)
const 상극: Record<Element, Element> = {
  목: "토", // 목극토
  토: "수", // 토극수
  수: "화", // 수극화
  화: "금", // 화극금
  금: "목"  // 금극목
};

// 오행별 추천 음식 카테고리
export const 오행음식: Record<Element, { category: string; description: string; foods: string[] }> = {
  목: {
    category: "한식",
    description: "목(木)의 기운 - 새로운 시작과 성장",
    foods: ["비빔밥", "나물", "된장찌개", "삼계탕", "청국장"]
  },
  화: {
    category: "양식",
    description: "화(火)의 기운 - 열정과 활력",
    foods: ["스테이크", "파스타", "버거", "피자", "브런치"]
  },
  토: {
    category: "중식",
    description: "토(土)의 기운 - 안정과 조화",
    foods: ["탕수육", "짜장면", "딤섬", "마라탕", "훠궈"]
  },
  금: {
    category: "동남아식",
    description: "금(金)의 기운 - 결단과 변화",
    foods: ["쌀국수", "팟타이", "똠양꿍", "분짜", "커리"]
  },
  수: {
    category: "일식",
    description: "수(水)의 기운 - 지혜와 유연함",
    foods: ["초밥", "사시미", "라멘", "우동", "돈카츠"]
  }
};

// 오행별 색상
export const 오행색상: Record<Element, string> = {
  목: "#22c55e", // 초록
  화: "#ef4444", // 빨강
  토: "#eab308", // 노랑
  금: "#f5f5f5", // 흰색 (회색으로 대체)
  수: "#3b82f6"  // 파랑
};

// 날짜로 천간지지 계산 (간지)
function getGanZhi(year: number, month: number, day: number): { 천간: string; 지지: string } {
  // 간단한 계산법 (정확한 만세력은 아님)
  const baseYear = 1984; // 갑자년
  const yearDiff = year - baseYear;

  const 천간Index = ((yearDiff % 10) + 10) % 10;
  const 지지Index = ((yearDiff % 12) + 12) % 12;

  // 월과 일을 조합하여 변화 추가
  const monthDaySum = month + day;

  return {
    천간: 천간[(천간Index + Math.floor(monthDaySum / 10)) % 10],
    지지: 지지[(지지Index + (monthDaySum % 12)) % 12]
  };
}

// 오늘의 천간지지
function getTodayGanZhi(): { 천간: string; 지지: string } {
  const today = new Date();
  return getGanZhi(today.getFullYear(), today.getMonth() + 1, today.getDate());
}

// 본명 오행 계산
export function getPersonElement(birthYear: number, birthMonth: number, birthDay: number): Element {
  const { 천간: gan } = getGanZhi(birthYear, birthMonth, birthDay);
  return 천간오행[gan];
}

// 오늘의 오행 계산
export function getTodayElement(): Element {
  const { 천간: gan } = getTodayGanZhi();
  return 천간오행[gan];
}

// 길방 계산 (동/서)
export function getLuckyDirection(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  gender: Gender,
  maritalStatus: MaritalStatus
): Direction {
  const personElement = getPersonElement(birthYear, birthMonth, birthDay);
  const todayElement = getTodayElement();

  // 기본 점수
  let eastScore = 0;
  let westScore = 0;

  // 오행 조합에 따른 길방
  // 목, 화는 동쪽 (양)
  // 금, 수는 서쪽 (음)
  // 토는 중앙 (성별에 따라)

  if (personElement === "목" || personElement === "화") {
    eastScore += 2;
  } else if (personElement === "금" || personElement === "수") {
    westScore += 2;
  } else {
    // 토
    if (gender === "male") eastScore += 1;
    else westScore += 1;
  }

  // 오늘의 오행과 상생 관계
  if (상생[todayElement] === personElement) {
    // 오늘 오행이 본명을 생해주면 동쪽 유리
    eastScore += 1;
  } else if (상생[personElement] === todayElement) {
    // 본명이 오늘을 생해주면 서쪽 유리 (에너지 소모)
    westScore += 1;
  }

  // 결혼 여부에 따른 조정
  if (maritalStatus === "married") {
    // 기혼자는 안정적인 방향
    if (personElement === "토" || personElement === "금") {
      westScore += 1;
    }
  } else {
    // 미혼자는 활동적인 방향
    if (personElement === "목" || personElement === "화") {
      eastScore += 1;
    }
  }

  // 날짜 기반 변동 (매일 다른 결과)
  const today = new Date();
  const dayFactor = today.getDate() % 2;
  if (dayFactor === 0) eastScore += 0.5;
  else westScore += 0.5;

  return eastScore >= westScore ? "동" : "서";
}

// 추천 음식 카테고리 계산
export function getLuckyFood(
  birthYear: number,
  birthMonth: number,
  birthDay: number
): { element: Element; category: string; description: string; foods: string[] } {
  const personElement = getPersonElement(birthYear, birthMonth, birthDay);
  const todayElement = getTodayElement();

  // 오늘 본인에게 필요한 오행 찾기
  let luckyElement: Element;

  // 상생 받는 오행이 좋음 (나를 생해주는 오행)
  const elements: Element[] = ["목", "화", "토", "금", "수"];
  const generatingElement = elements.find(e => 상생[e] === personElement);

  if (generatingElement) {
    // 나를 생해주는 오행의 음식
    luckyElement = generatingElement;
  } else {
    // 오늘의 오행과 조화로운 음식
    luckyElement = todayElement;
  }

  // 상극 피하기
  if (상극[luckyElement] === personElement) {
    // 나를 극하는 오행이면 다른 것으로
    luckyElement = 상생[personElement]; // 내가 생하는 오행
  }

  return {
    element: luckyElement,
    ...오행음식[luckyElement]
  };
}

// 운세 메시지 생성
export function getFortuneMessage(
  personElement: Element,
  todayElement: Element,
  direction: Direction
): string {
  const messages: string[] = [];

  // 오행 관계 메시지
  if (상생[todayElement] === personElement) {
    messages.push("오늘은 하늘이 당신을 도와주는 날입니다.");
  } else if (상생[personElement] === todayElement) {
    messages.push("오늘은 주변을 돕는 일에서 보람을 느낄 수 있습니다.");
  } else if (상극[todayElement] === personElement) {
    messages.push("오늘은 신중하게 행동하는 것이 좋겠습니다.");
  } else if (상극[personElement] === todayElement) {
    messages.push("오늘은 적극적으로 도전해볼 만한 날입니다.");
  } else {
    messages.push("오늘은 평온하고 안정적인 하루가 될 것입니다.");
  }

  // 길방 메시지
  if (direction === "동") {
    messages.push("동쪽(동여의도)에서 좋은 기운을 받을 수 있습니다.");
  } else {
    messages.push("서쪽(서여의도)에서 좋은 기운을 받을 수 있습니다.");
  }

  return messages.join(" ");
}

// 전체 운세 결과
export interface FortuneResult {
  personElement: Element;
  todayElement: Element;
  luckyDirection: Direction;
  luckyRegion: "동여의도" | "서여의도";
  luckyFood: {
    element: Element;
    category: string;
    description: string;
    foods: string[];
  };
  message: string;
  color: string;
}

export function calculateFortune(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  gender: Gender,
  maritalStatus: MaritalStatus
): FortuneResult {
  const personElement = getPersonElement(birthYear, birthMonth, birthDay);
  const todayElement = getTodayElement();
  const direction = getLuckyDirection(birthYear, birthMonth, birthDay, gender, maritalStatus);
  const luckyFood = getLuckyFood(birthYear, birthMonth, birthDay);
  const message = getFortuneMessage(personElement, todayElement, direction);

  return {
    personElement,
    todayElement,
    luckyDirection: direction,
    luckyRegion: direction === "동" ? "동여의도" : "서여의도",
    luckyFood,
    message,
    color: 오행색상[personElement]
  };
}
