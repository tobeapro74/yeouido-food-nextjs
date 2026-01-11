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

// 띠 이름 (한글)
export const 띠이름: Record<string, string> = {
  자: "쥐띠", 축: "소띠", 인: "호랑이띠", 묘: "토끼띠",
  진: "용띠", 사: "뱀띠", 오: "말띠", 미: "양띠",
  신: "원숭이띠", 유: "닭띠", 술: "개띠", 해: "돼지띠"
};

// 띠 이모지
export const 띠이모지: Record<string, string> = {
  자: "🐀", 축: "🐂", 인: "🐅", 묘: "🐇",
  진: "🐉", 사: "🐍", 오: "🐎", 미: "🐑",
  신: "🐵", 유: "🐓", 술: "🐕", 해: "🐷"
};

// 띠별 성향 및 음식 궁합
const 띠성향: Record<string, { personality: string; luckyElements: Element[]; unluckyElements: Element[] }> = {
  자: { personality: "영리하고 적응력이 뛰어남", luckyElements: ["수", "금"], unluckyElements: ["화"] },
  축: { personality: "성실하고 인내심이 강함", luckyElements: ["토", "금"], unluckyElements: ["목"] },
  인: { personality: "용감하고 리더십이 있음", luckyElements: ["목", "화"], unluckyElements: ["금"] },
  묘: { personality: "온화하고 예술적 감각이 뛰어남", luckyElements: ["목", "수"], unluckyElements: ["금"] },
  진: { personality: "야망이 크고 카리스마가 있음", luckyElements: ["토", "화"], unluckyElements: ["목"] },
  사: { personality: "지혜롭고 직관력이 뛰어남", luckyElements: ["화", "토"], unluckyElements: ["수"] },
  오: { personality: "활발하고 자유로운 영혼", luckyElements: ["화", "목"], unluckyElements: ["수"] },
  미: { personality: "창의적이고 예술적임", luckyElements: ["토", "화"], unluckyElements: ["목"] },
  신: { personality: "재치있고 호기심이 많음", luckyElements: ["금", "토"], unluckyElements: ["화"] },
  유: { personality: "꼼꼼하고 완벽주의적", luckyElements: ["금", "토"], unluckyElements: ["화"] },
  술: { personality: "충직하고 정의로움", luckyElements: ["토", "화"], unluckyElements: ["목"] },
  해: { personality: "너그럽고 낙천적임", luckyElements: ["수", "목"], unluckyElements: ["토"] }
};

// 육합 (六合) - 서로 잘 맞는 관계
const 육합: Record<string, string> = {
  자: "축", 축: "자",
  인: "해", 해: "인",
  묘: "술", 술: "묘",
  진: "유", 유: "진",
  사: "신", 신: "사",
  오: "미", 미: "오"
};

// 충 (冲) - 서로 상충하는 관계
const 충: Record<string, string> = {
  자: "오", 오: "자",
  축: "미", 미: "축",
  인: "신", 신: "인",
  묘: "유", 유: "묘",
  진: "술", 술: "진",
  사: "해", 해: "사"
};

// 삼합 (三合) - 세 지지가 모여 강한 기운을 이룸
const 삼합: Record<string, { members: string[]; element: Element }> = {
  신자진: { members: ["신", "자", "진"], element: "수" },
  해묘미: { members: ["해", "묘", "미"], element: "목" },
  인오술: { members: ["인", "오", "술"], element: "화" },
  사유축: { members: ["사", "유", "축"], element: "금" }
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

// 성별/결혼여부별 추가 음식 특성
const 성별음식특성: Record<Gender, { preferredElements: Element[]; foods: string[] }> = {
  male: {
    preferredElements: ["화", "토"],  // 든든하고 푸짐한 음식
    foods: ["고기", "국밥", "찌개", "덮밥"]
  },
  female: {
    preferredElements: ["수", "목"],  // 건강하고 가벼운 음식
    foods: ["샐러드", "브런치", "디저트", "차"]
  }
};

const 결혼음식특성: Record<MaritalStatus, { preferredElements: Element[]; style: string }> = {
  single: {
    preferredElements: ["화", "금"],  // 트렌디하고 새로운
    style: "새롭고 트렌디한"
  },
  married: {
    preferredElements: ["목", "토"],  // 안정적이고 건강한
    style: "안정적이고 편안한"
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

// 태어난 해의 띠(지지) 계산
export function getPersonZodiac(birthYear: number): string {
  const baseYear = 1984; // 갑자년
  const yearDiff = birthYear - baseYear;
  const 지지Index = ((yearDiff % 12) + 12) % 12;
  return 지지[지지Index];
}

// 오늘의 일진 지지 계산
export function getTodayZodiac(): string {
  const { 지지: zhi } = getTodayGanZhi();
  return zhi;
}

// 지지 관계 분석 (육합/충/삼합)
export type ZodiacRelation = "육합" | "충" | "삼합" | "보통";
export function getZodiacRelation(personZodiac: string, todayZodiac: string): { relation: ZodiacRelation; description: string; luckScore: number } {
  // 육합 체크
  if (육합[personZodiac] === todayZodiac) {
    return {
      relation: "육합",
      description: "오늘은 당신의 띠와 육합(六合)을 이루는 길한 날입니다!",
      luckScore: 3
    };
  }

  // 충 체크
  if (충[personZodiac] === todayZodiac) {
    return {
      relation: "충",
      description: "오늘은 띠와 충(冲)이 있어 조심스럽게 행동하세요.",
      luckScore: -2
    };
  }

  // 삼합 체크
  for (const key of Object.keys(삼합)) {
    const group = 삼합[key];
    if (group.members.includes(personZodiac) && group.members.includes(todayZodiac)) {
      return {
        relation: "삼합",
        description: `오늘은 ${group.element}(${key}) 삼합의 기운이 함께합니다!`,
        luckScore: 2
      };
    }
  }

  return {
    relation: "보통",
    description: "평온한 기운이 흐르는 날입니다.",
    luckScore: 0
  };
}

// 띠별 성향 정보 가져오기
export function getZodiacPersonality(zodiac: string): string {
  return 띠성향[zodiac]?.personality || "";
}

// 길방 계산 (동/서) - 띠/성별/결혼여부 영향 반영
export function getLuckyDirection(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  gender: Gender,
  maritalStatus: MaritalStatus
): Direction {
  const personElement = getPersonElement(birthYear, birthMonth, birthDay);
  const todayElement = getTodayElement();
  const personZodiac = getPersonZodiac(birthYear);
  const todayZodiac = getTodayZodiac();
  const zodiacRelation = getZodiacRelation(personZodiac, todayZodiac);

  // 기본 점수
  let eastScore = 0;
  let westScore = 0;

  // 1. 오행 조합에 따른 길방 (기본)
  // 목, 화는 동쪽 (양)
  // 금, 수는 서쪽 (음)
  // 토는 중앙
  if (personElement === "목" || personElement === "화") {
    eastScore += 2;
  } else if (personElement === "금" || personElement === "수") {
    westScore += 2;
  } else {
    // 토는 중립
    eastScore += 1;
    westScore += 1;
  }

  // 2. 성별에 따른 조정 (모든 오행에 영향)
  if (gender === "male") {
    // 남성: 양(동쪽) 기운 가점
    eastScore += 1.5;
  } else {
    // 여성: 음(서쪽) 기운 가점
    westScore += 1.5;
  }

  // 3. 결혼 여부에 따른 조정 (모든 오행에 영향)
  if (maritalStatus === "married") {
    // 기혼: 안정(서쪽) 선호
    westScore += 1.5;
  } else {
    // 미혼: 활동(동쪽) 선호
    eastScore += 1.5;
  }

  // 4. 오늘의 오행과 상생 관계
  if (상생[todayElement] === personElement) {
    // 오늘 오행이 본명을 생해주면 동쪽 유리
    eastScore += 1;
  } else if (상생[personElement] === todayElement) {
    // 본명이 오늘을 생해주면 서쪽 유리 (에너지 소모)
    westScore += 1;
  }

  // 5. 띠(지지) 관계에 따른 조정 (NEW!)
  if (zodiacRelation.relation === "육합") {
    // 육합이면 활동적인 동쪽 추천
    eastScore += 2;
  } else if (zodiacRelation.relation === "충") {
    // 충이면 안정적인 서쪽 추천
    westScore += 2;
  } else if (zodiacRelation.relation === "삼합") {
    // 삼합이면 해당 오행에 따라
    const zodiacElement = 지지오행[todayZodiac];
    if (zodiacElement === "목" || zodiacElement === "화") {
      eastScore += 1.5;
    } else {
      westScore += 1.5;
    }
  }

  // 6. 띠의 지지 오행에 따른 조정
  const personZodiacElement = 지지오행[personZodiac];
  if (personZodiacElement === "목" || personZodiacElement === "화") {
    eastScore += 0.5;
  } else if (personZodiacElement === "금" || personZodiacElement === "수") {
    westScore += 0.5;
  }

  return eastScore >= westScore ? "동" : "서";
}

// 추천 음식 카테고리 계산 (띠/성별/결혼여부 반영)
export function getLuckyFood(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  gender: Gender,
  maritalStatus: MaritalStatus
): { element: Element; category: string; description: string; foods: string[] } {
  const personElement = getPersonElement(birthYear, birthMonth, birthDay);
  const todayElement = getTodayElement();
  const personZodiac = getPersonZodiac(birthYear);
  const todayZodiac = getTodayZodiac();
  const zodiacRelation = getZodiacRelation(personZodiac, todayZodiac);

  // 각 오행별 점수 계산
  const elements: Element[] = ["목", "화", "토", "금", "수"];
  const scores: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  // 1. 나를 생해주는 오행 가점 (+3)
  const generatingElement = elements.find(e => 상생[e] === personElement);
  if (generatingElement) {
    scores[generatingElement] += 3;
  }

  // 2. 오늘 오행과 조화 (+2)
  scores[todayElement] += 2;

  // 3. 성별 선호 오행 가점 (+2)
  성별음식특성[gender].preferredElements.forEach(e => {
    scores[e] += 2;
  });

  // 4. 결혼여부 선호 오행 가점 (+2)
  결혼음식특성[maritalStatus].preferredElements.forEach(e => {
    scores[e] += 2;
  });

  // 5. 나를 극하는 오행 감점 (-3)
  const harmfulElement = elements.find(e => 상극[e] === personElement);
  if (harmfulElement) {
    scores[harmfulElement] -= 3;
  }

  // 6. 띠별 선호 오행 가점 (+2) (NEW!)
  const zodiacData = 띠성향[personZodiac];
  if (zodiacData) {
    zodiacData.luckyElements.forEach(e => {
      scores[e] += 2;
    });
    zodiacData.unluckyElements.forEach(e => {
      scores[e] -= 1;
    });
  }

  // 7. 오늘 일진과의 관계에 따른 조정 (NEW!)
  if (zodiacRelation.relation === "육합" || zodiacRelation.relation === "삼합") {
    // 길한 날에는 오늘 일진의 오행 가점
    const todayZodiacElement = 지지오행[todayZodiac];
    scores[todayZodiacElement] += 2;
  } else if (zodiacRelation.relation === "충") {
    // 충인 날에는 본인 띠의 lucky 오행 강화
    if (zodiacData) {
      zodiacData.luckyElements.forEach(e => {
        scores[e] += 1;
      });
    }
  }

  // 8. 날짜 기반 변동 (매일 다른 결과)
  const today = new Date();
  const dayIndex = today.getDate() % 5;
  scores[elements[dayIndex]] += 1;

  // 가장 높은 점수의 오행 선택
  let luckyElement: Element = "목";
  let maxScore = -Infinity;
  elements.forEach(e => {
    if (scores[e] > maxScore) {
      maxScore = scores[e];
      luckyElement = e;
    }
  });

  return {
    element: luckyElement,
    ...오행음식[luckyElement]
  };
}

// 운세 메시지 생성 (성별/결혼여부 반영)
export function getFortuneMessage(
  personElement: Element,
  todayElement: Element,
  direction: Direction,
  gender: Gender,
  maritalStatus: MaritalStatus
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

  // 성별별 조언
  if (gender === "male") {
    if (personElement === "화" || personElement === "목") {
      messages.push("활력 넘치는 식사로 에너지를 충전하세요.");
    } else {
      messages.push("든든한 한 끼로 하루를 마무리하세요.");
    }
  } else {
    if (personElement === "수" || personElement === "금") {
      messages.push("가볍고 건강한 음식이 오늘의 컨디션을 높여줍니다.");
    } else {
      messages.push("맛있는 음식으로 자신에게 선물을 주세요.");
    }
  }

  // 결혼여부별 조언
  if (maritalStatus === "single") {
    messages.push("새로운 맛집 탐험이 좋은 인연으로 이어질 수 있어요.");
  } else {
    messages.push("소중한 사람과 함께하는 식사가 행복을 더해줍니다.");
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
  // 띠 관련 정보 추가
  zodiac: {
    sign: string;       // 지지 (자, 축, 인...)
    name: string;       // 띠 이름 (쥐띠, 소띠...)
    emoji: string;      // 이모지
    personality: string; // 성향
  };
  todayZodiac: {
    sign: string;
    name: string;
    emoji: string;
  };
  zodiacRelation: {
    relation: ZodiacRelation;
    description: string;
    luckScore: number;
  };
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
  const luckyFood = getLuckyFood(birthYear, birthMonth, birthDay, gender, maritalStatus);
  const message = getFortuneMessage(personElement, todayElement, direction, gender, maritalStatus);

  // 띠 정보
  const personZodiac = getPersonZodiac(birthYear);
  const todayZodiac = getTodayZodiac();
  const zodiacRelation = getZodiacRelation(personZodiac, todayZodiac);

  return {
    personElement,
    todayElement,
    luckyDirection: direction,
    luckyRegion: direction === "동" ? "동여의도" : "서여의도",
    luckyFood,
    message,
    color: 오행색상[personElement],
    zodiac: {
      sign: personZodiac,
      name: 띠이름[personZodiac],
      emoji: 띠이모지[personZodiac],
      personality: getZodiacPersonality(personZodiac)
    },
    todayZodiac: {
      sign: todayZodiac,
      name: 띠이름[todayZodiac],
      emoji: 띠이모지[todayZodiac]
    },
    zodiacRelation
  };
}
