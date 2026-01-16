// 오행 기반 운세 계산 로직

export type Gender = "male" | "female";
export type MaritalStatus = "single" | "married";
export type Element = "목" | "화" | "토" | "금" | "수";
export type Direction = "동" | "서";

// 별자리 타입
export type ZodiacSign =
  | "양자리" | "황소자리" | "쌍둥이자리" | "게자리"
  | "사자자리" | "처녀자리" | "천칭자리" | "전갈자리"
  | "사수자리" | "염소자리" | "물병자리" | "물고기자리";

// 별자리 정보
interface ZodiacSignInfo {
  name: ZodiacSign;
  emoji: string;
  element: "불" | "흙" | "공기" | "물";
  ruling: string; // 지배 행성
  traits: string[];
}

// 별자리 데이터
const zodiacSigns: ZodiacSignInfo[] = [
  { name: "양자리", emoji: "♈", element: "불", ruling: "화성", traits: ["열정적", "도전적", "리더십"] },
  { name: "황소자리", emoji: "♉", element: "흙", ruling: "금성", traits: ["안정적", "미식가", "인내심"] },
  { name: "쌍둥이자리", emoji: "♊", element: "공기", ruling: "수성", traits: ["다재다능", "호기심", "소통"] },
  { name: "게자리", emoji: "♋", element: "물", ruling: "달", traits: ["가정적", "감수성", "배려심"] },
  { name: "사자자리", emoji: "♌", element: "불", ruling: "태양", traits: ["자신감", "카리스마", "관대함"] },
  { name: "처녀자리", emoji: "♍", element: "흙", ruling: "수성", traits: ["분석적", "완벽주의", "실용적"] },
  { name: "천칭자리", emoji: "♎", element: "공기", ruling: "금성", traits: ["조화", "미적감각", "공정함"] },
  { name: "전갈자리", emoji: "♏", element: "물", ruling: "명왕성", traits: ["직관적", "열정적", "집중력"] },
  { name: "사수자리", emoji: "♐", element: "불", ruling: "목성", traits: ["모험심", "낙관적", "자유로움"] },
  { name: "염소자리", emoji: "♑", element: "흙", ruling: "토성", traits: ["책임감", "성실함", "목표지향"] },
  { name: "물병자리", emoji: "♒", element: "공기", ruling: "천왕성", traits: ["독창적", "인도주의", "혁신적"] },
  { name: "물고기자리", emoji: "♓", element: "물", ruling: "해왕성", traits: ["감성적", "창의적", "공감능력"] }
];

// 별자리 계산 (생월일 기준)
export function getZodiacSignFromDate(month: number, day: number): ZodiacSignInfo {
  const dates: [number, number, ZodiacSign][] = [
    [1, 20, "염소자리"], [2, 19, "물병자리"], [3, 21, "물고기자리"],
    [4, 20, "양자리"], [5, 21, "황소자리"], [6, 21, "쌍둥이자리"],
    [7, 23, "게자리"], [8, 23, "사자자리"], [9, 23, "처녀자리"],
    [10, 23, "천칭자리"], [11, 22, "전갈자리"], [12, 22, "사수자리"],
    [12, 32, "염소자리"] // 12월 22일 이후
  ];

  for (const [m, d, sign] of dates) {
    if (month < m || (month === m && day < d)) {
      const info = zodiacSigns.find(z => z.name === sign);
      return info || zodiacSigns[0];
    }
  }
  return zodiacSigns[9]; // 염소자리 (기본값)
}

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

// 성별/결혼여부별 추가 음식 특성 (서로 다른 오행 강조)
const 성별음식특성: Record<Gender, { preferredElements: Element[]; foods: string[] }> = {
  male: {
    preferredElements: ["화", "토"],  // 든든하고 푸짐한 음식 (양식, 중식)
    foods: ["고기", "국밥", "찌개", "덮밥"]
  },
  female: {
    preferredElements: ["수", "금"],  // 건강하고 세련된 음식 (일식, 동남아)
    foods: ["샐러드", "브런치", "디저트", "차"]
  }
};

const 결혼음식특성: Record<MaritalStatus, { preferredElements: Element[]; style: string }> = {
  single: {
    preferredElements: ["금", "화"],  // 트렌디하고 새로운 (동남아, 양식)
    style: "새롭고 트렌디한"
  },
  married: {
    preferredElements: ["목", "수"],  // 안정적이고 건강한 (한식, 일식)
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

  // 1. 오행 조합에 따른 길방 (기본 - 가중치 낮춤)
  if (personElement === "목" || personElement === "화") {
    eastScore += 1;
  } else if (personElement === "금" || personElement === "수") {
    westScore += 1;
  }

  // 2. 성별에 따른 조정 (가중치 높임)
  if (gender === "male") {
    eastScore += 3;  // 남성: 양(동쪽)
  } else {
    westScore += 3;  // 여성: 음(서쪽)
  }

  // 3. 결혼 여부에 따른 조정 (가중치 높임)
  if (maritalStatus === "married") {
    westScore += 3;  // 기혼: 안정(서쪽)
  } else {
    eastScore += 3;  // 미혼: 활동(동쪽)
  }

  // 4. 오늘의 오행과 상생 관계
  if (상생[todayElement] === personElement) {
    eastScore += 1;
  } else if (상생[personElement] === todayElement) {
    westScore += 1;
  }

  // 5. 띠(지지) 관계에 따른 조정
  if (zodiacRelation.relation === "육합") {
    eastScore += 1;
  } else if (zodiacRelation.relation === "충") {
    westScore += 1;
  } else if (zodiacRelation.relation === "삼합") {
    const zodiacElement = 지지오행[todayZodiac];
    if (zodiacElement === "목" || zodiacElement === "화") {
      eastScore += 0.5;
    } else {
      westScore += 0.5;
    }
  }

  // 6. 띠의 지지 오행에 따른 조정
  const personZodiacElement = 지지오행[personZodiac];
  if (personZodiacElement === "목" || personZodiacElement === "화") {
    eastScore += 0.5;
  } else if (personZodiacElement === "금" || personZodiacElement === "수") {
    westScore += 0.5;
  }

  return eastScore > westScore ? "동" : "서";
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

  // 1. 나를 생해주는 오행 가점 (+2)
  const generatingElement = elements.find(e => 상생[e] === personElement);
  if (generatingElement) {
    scores[generatingElement] += 2;
  }

  // 2. 오늘 오행과 조화 (+1)
  scores[todayElement] += 1;

  // 3. 성별 선호 오행 가점 (+4 - 가중치 높임!)
  성별음식특성[gender].preferredElements.forEach(e => {
    scores[e] += 4;
  });

  // 4. 결혼여부 선호 오행 가점 (+4 - 가중치 높임!)
  결혼음식특성[maritalStatus].preferredElements.forEach(e => {
    scores[e] += 4;
  });

  // 5. 나를 극하는 오행 감점 (-2)
  const harmfulElement = elements.find(e => 상극[e] === personElement);
  if (harmfulElement) {
    scores[harmfulElement] -= 2;
  }

  // 6. 띠별 선호 오행 가점 (+1)
  const zodiacData = 띠성향[personZodiac];
  if (zodiacData) {
    zodiacData.luckyElements.forEach(e => {
      scores[e] += 1;
    });
    zodiacData.unluckyElements.forEach(e => {
      scores[e] -= 1;
    });
  }

  // 7. 오늘 일진과의 관계에 따른 조정
  if (zodiacRelation.relation === "육합" || zodiacRelation.relation === "삼합") {
    const todayZodiacElement = 지지오행[todayZodiac];
    scores[todayZodiacElement] += 1;
  } else if (zodiacRelation.relation === "충") {
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

// ========== 운세 지수 시스템 ==========

// 운세 지수 타입
export interface FortuneScores {
  overall: number;    // 종합운 (1-5)
  wealth: number;     // 재물운 (1-5)
  family: number;     // 가정운 (1-5, 기혼자용)
  social: number;     // 사회운 (1-5)
}

// 운세 지수 계산
export function calculateFortuneScores(
  personElement: Element,
  todayElement: Element,
  zodiacRelation: { relation: ZodiacRelation; luckScore: number },
  zodiacSign: ZodiacSignInfo,
  gender: Gender,
  maritalStatus: MaritalStatus
): FortuneScores {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0-6
  const dateSum = today.getDate() + today.getMonth();

  // 기본 점수 (2-4 사이)
  let overall = 3;
  let wealth = 3;
  let family = 3;
  let social = 3;

  // 1. 오행 상생/상극 영향
  if (상생[todayElement] === personElement) {
    overall += 1;
    wealth += 1;
  } else if (상극[todayElement] === personElement) {
    overall -= 1;
    social -= 1;
  }

  // 2. 띠 궁합 영향
  if (zodiacRelation.relation === "육합") {
    overall += 1;
    family += 1;
    social += 1;
  } else if (zodiacRelation.relation === "삼합") {
    wealth += 1;
    social += 0.5;
  } else if (zodiacRelation.relation === "충") {
    overall -= 0.5;
    family -= 1;
  }

  // 3. 별자리 요소 영향
  if (zodiacSign.element === "불") {
    social += 0.5; // 불: 사회적 활동에 유리
  } else if (zodiacSign.element === "흙") {
    wealth += 0.5; // 흙: 재물에 유리
    family += 0.5;
  } else if (zodiacSign.element === "물") {
    family += 0.5; // 물: 가정에 유리
  } else {
    social += 0.5; // 공기: 소통에 유리
  }

  // 4. 요일별 변동 (매일 다른 느낌)
  const dayModifiers = [
    { overall: 0, wealth: 0.5, family: 1, social: -0.5 },   // 일: 가정운 상승
    { overall: 0.5, wealth: 0, family: -0.5, social: 1 },   // 월: 사회운 상승
    { overall: 0, wealth: 0.5, family: 0, social: 0.5 },    // 화
    { overall: 0.5, wealth: 0.5, family: 0, social: 0 },    // 수
    { overall: 0.5, wealth: 1, family: 0, social: 0.5 },    // 목: 재물운 상승
    { overall: 1, wealth: 0.5, family: 0.5, social: 0.5 },  // 금: 전체 상승
    { overall: 0.5, wealth: 0, family: 1, social: 0.5 }     // 토: 가정운 상승
  ];
  const dayMod = dayModifiers[dayOfWeek];
  overall += dayMod.overall;
  wealth += dayMod.wealth;
  family += dayMod.family;
  social += dayMod.social;

  // 5. 날짜 기반 변동 (같은 사람도 매일 다르게)
  const dateSeed = (dateSum % 5) - 2; // -2 ~ +2
  overall += dateSeed * 0.2;

  // 6. 성별/결혼여부 가중치
  if (gender === "male") {
    social += 0.3; // 남성: 사회운 약간 상승
  } else {
    family += 0.3; // 여성: 가정운 약간 상승
  }

  if (maritalStatus === "married") {
    family += 0.5; // 기혼: 가정운 의미 있음
  }

  // 점수 범위 제한 (1-5)
  const clamp = (v: number) => Math.max(1, Math.min(5, Math.round(v)));

  return {
    overall: clamp(overall),
    wealth: clamp(wealth),
    family: clamp(family),
    social: clamp(social)
  };
}

// ========== 위트 있는 운세 메시지 ==========

interface WittyMessage {
  headline: string;      // 한 줄 요약 (위트 있는)
  detail: string;        // 상세 설명
  menuAdvice: string;    // 메뉴 조언
  luckyKeywords: string[]; // 행운의 키워드
}

// 종합운 기반 헤드라인 (위트 버전)
const overallHeadlines: Record<number, string[]> = {
  5: [
    "오늘 뭘 해도 되는 날! 점심값 아끼지 마세요 💫",
    "운세 그래프 최고점 찍었습니다. 오늘이에요, 오늘!",
    "오늘의 주인공은 당신! VIP 대우받을 준비되셨나요?"
  ],
  4: [
    "오늘 기분 좋은 일 생길 예감... 맛있는 거 먹어야 해요",
    "꽤 괜찮은 하루가 될 거예요. 욕심 부려도 되는 날!",
    "행운이 슬슬 다가오는 중... 점심에 터질 수도?"
  ],
  3: [
    "평범한 하루? 아니, 맛집 하나면 특별해집니다",
    "무난하게 흘러갈 오늘, 점심만큼은 확실하게!",
    "오늘은 조용히 맛있는 것으로 승부 보세요"
  ],
  2: [
    "오늘은 좀 쉬어가는 날... 편안한 음식 추천해요",
    "에너지 충전이 필요한 날이에요. 든든하게 드세요",
    "살짝 지치는 하루, 맛있는 한 끼로 버텨봐요"
  ],
  1: [
    "오늘은 맛있는 거라도 먹어야 버틸 수 있어요",
    "힘든 날엔 좋은 음식이 보약! 자신에게 투자하세요",
    "컨디션 회복 모드 ON! 영양가 있는 식사 필수"
  ]
};

// 성별×결혼여부별 메뉴 조언
const menuAdviceByPersona: Record<string, string[]> = {
  "male_single": [
    "든든하게 배 채우고 오후 업무 불태우세요! 🔥",
    "혼밥도 멋지게! 오늘은 좀 비싼 거 드셔도 됩니다",
    "점심 잘 먹어야 야근도 버팁니다 (농담 아님)"
  ],
  "male_married": [
    "점심은 맛있게, 저녁은 가족과 함께! 오늘의 공식입니다",
    "아버지도 가끔은 맛있는 게 필요해요 🍖",
    "퇴근 후 기분 좋게 귀가하려면 점심부터 챙기세요"
  ],
  "female_single": [
    "오늘은 나를 위한 선물! 예쁜 곳에서 맛있게 ✨",
    "다이어트는 내일부터... 오늘만큼은 맛있게!",
    "점심 맛있으면 오후가 행복해져요, 진짜로요"
  ],
  "female_married": [
    "엄마/아내도 쉬는 시간이 필요해요. 오늘 점심은 특별하게!",
    "가족 챙기느라 고생 많으셨어요. 맛있는 거 드세요 💕",
    "건강하고 맛있는 한 끼로 에너지 충전하세요"
  ]
};

// 재물운 기반 가격 조언
const wealthAdvice: Record<number, string> = {
  5: "오늘은 투자할 때! 비싼 메뉴도 OK 💰",
  4: "조금 여유 부려도 괜찮은 날이에요",
  3: "적당한 가격대로 알뜰하게!",
  2: "오늘은 가성비 메뉴 추천드려요",
  1: "지갑 사정 고려해서 현명하게~"
};

// ========== 운세 상세 해설 ==========

export interface FortuneDetailExplanation {
  title: string;
  emoji: string;
  summary: string;
  details: string[];
  advice: string;
  foodTip: string;
}

// 종합운 상세 해설
const overallExplanations: Record<number, FortuneDetailExplanation> = {
  5: {
    title: "종합운",
    emoji: "⭐",
    summary: "최고의 하루! 모든 일이 순조롭습니다",
    details: [
      "오늘은 하늘이 당신 편입니다",
      "새로운 시도가 좋은 결과로 이어질 수 있어요",
      "주변 사람들과의 관계도 원만해지는 날"
    ],
    advice: "평소 망설였던 일이 있다면 오늘 도전해보세요!",
    foodTip: "특별한 날엔 특별한 음식! 오늘은 좀 비싸도 괜찮아요"
  },
  4: {
    title: "종합운",
    emoji: "⭐",
    summary: "기분 좋은 일이 생길 예감",
    details: [
      "전반적으로 순탄한 하루가 될 거예요",
      "작은 행운들이 찾아올 수 있어요",
      "긍정적인 마인드가 더 좋은 결과를 만듭니다"
    ],
    advice: "욕심 부려도 되는 날! 적극적으로 행동하세요",
    foodTip: "맛있는 음식으로 기분을 더 업시켜보세요"
  },
  3: {
    title: "종합운",
    emoji: "⭐",
    summary: "평온한 하루, 무난하게 흘러갑니다",
    details: [
      "큰 변화 없이 안정적인 하루예요",
      "계획한 일들은 차근차근 진행됩니다",
      "급하게 서두르지 않아도 괜찮아요"
    ],
    advice: "오늘은 조용히 자신만의 시간을 가져보세요",
    foodTip: "익숙하고 편안한 음식이 오늘과 잘 어울려요"
  },
  2: {
    title: "종합운",
    emoji: "⭐",
    summary: "조금 쉬어가는 날",
    details: [
      "에너지가 조금 떨어지는 느낌이 들 수 있어요",
      "무리한 일정은 피하는 게 좋습니다",
      "충분한 휴식이 필요한 날이에요"
    ],
    advice: "컨디션 관리에 집중하세요. 내일은 더 좋아질 거예요",
    foodTip: "든든하고 영양가 있는 음식으로 에너지 충전!"
  },
  1: {
    title: "종합운",
    emoji: "⭐",
    summary: "잠시 충전이 필요한 시간",
    details: [
      "오늘은 몸과 마음이 지칠 수 있어요",
      "중요한 결정은 미루는 게 좋습니다",
      "자신을 위한 시간을 가져보세요"
    ],
    advice: "힘든 날일수록 자신에게 친절하게 대하세요",
    foodTip: "좋은 음식은 최고의 보약! 맛있는 거 드세요"
  }
};

// 재물운 상세 해설
const wealthExplanations: Record<number, FortuneDetailExplanation> = {
  5: {
    title: "재물운",
    emoji: "💰",
    summary: "금전적으로 최고의 날!",
    details: [
      "예상치 못한 수입이 생길 수 있어요",
      "투자나 재테크에 좋은 기운이 있습니다",
      "점심값 투자는 충분히 가치 있어요"
    ],
    advice: "오늘 쓰는 돈은 나중에 더 큰 가치로 돌아옵니다",
    foodTip: "비싼 메뉴도 OK! 오늘은 자신에게 투자하세요"
  },
  4: {
    title: "재물운",
    emoji: "💰",
    summary: "재물 기운이 살짝 상승",
    details: [
      "전반적으로 금전 흐름이 좋습니다",
      "계획했던 지출은 진행해도 무방해요",
      "작은 행운이 찾아올 수 있어요"
    ],
    advice: "합리적인 소비는 괜찮지만, 충동구매는 피하세요",
    foodTip: "조금 여유 부려도 괜찮은 날이에요"
  },
  3: {
    title: "재물운",
    emoji: "💰",
    summary: "평범한 재물 흐름",
    details: [
      "들어오는 것과 나가는 것이 균형을 이룹니다",
      "큰 지출은 신중하게 결정하세요",
      "저축을 시작하기 좋은 날이에요"
    ],
    advice: "수입과 지출의 균형을 맞추는 것이 중요해요",
    foodTip: "적당한 가격대로 만족스러운 한 끼를!"
  },
  2: {
    title: "재물운",
    emoji: "💰",
    summary: "지출에 주의가 필요해요",
    details: [
      "예상치 못한 지출이 생길 수 있어요",
      "큰 구매는 오늘 피하는 게 좋습니다",
      "알뜰하게 소비하는 지혜가 필요해요"
    ],
    advice: "꼭 필요한 지출만 하고, 나머지는 아껴두세요",
    foodTip: "가성비 좋은 맛집을 찾아보세요!"
  },
  1: {
    title: "재물운",
    emoji: "💰",
    summary: "절약 모드를 추천해요",
    details: [
      "오늘은 지갑을 단단히 닫아두세요",
      "불필요한 지출은 최대한 줄이는 게 좋아요",
      "내일을 위한 저축을 생각해보세요"
    ],
    advice: "힘들 때일수록 현명한 소비가 중요합니다",
    foodTip: "저렴하지만 든든한 음식이 정답이에요"
  }
};

// 가정운 상세 해설
const familyExplanations: Record<number, FortuneDetailExplanation> = {
  5: {
    title: "가정운",
    emoji: "🏠",
    summary: "가족과 함께하는 행복한 날",
    details: [
      "가족들과의 관계가 더욱 돈독해집니다",
      "집안에 기쁜 소식이 있을 수 있어요",
      "함께하는 시간이 소중하게 느껴지는 날"
    ],
    advice: "퇴근 후 가족과 특별한 시간을 보내보세요",
    foodTip: "가족이 좋아하는 음식을 떠올려보세요"
  },
  4: {
    title: "가정운",
    emoji: "🏠",
    summary: "따뜻한 가정의 기운",
    details: [
      "가족들과 좋은 대화를 나눌 수 있어요",
      "집안 분위기가 화목합니다",
      "서로를 이해하는 마음이 커지는 날"
    ],
    advice: "작은 선물이나 따뜻한 말 한마디가 큰 힘이 됩니다",
    foodTip: "집에서 먹는 밥 같은 편안한 음식이 좋아요"
  },
  3: {
    title: "가정운",
    emoji: "🏠",
    summary: "평온한 가정 생활",
    details: [
      "특별한 일 없이 조용한 하루예요",
      "가족들과의 관계가 안정적입니다",
      "일상의 소소한 행복을 느낄 수 있어요"
    ],
    advice: "바쁜 일상 속에서도 가족을 생각해주세요",
    foodTip: "건강한 음식으로 가족 건강도 챙기세요"
  },
  2: {
    title: "가정운",
    emoji: "🏠",
    summary: "가족과의 소통에 신경 쓰세요",
    details: [
      "작은 오해가 생길 수 있어요",
      "인내심을 가지고 대화하는 것이 중요합니다",
      "서로의 입장을 이해하려고 노력해보세요"
    ],
    advice: "오늘은 가족에게 먼저 다가가 보세요",
    foodTip: "마음이 따뜻해지는 음식이 필요해요"
  },
  1: {
    title: "가정운",
    emoji: "🏠",
    summary: "가정에 관심이 필요한 날",
    details: [
      "가족 간의 갈등이 생길 수 있어요",
      "감정적인 대화는 피하는 게 좋습니다",
      "혼자만의 시간이 필요할 수 있어요"
    ],
    advice: "힘든 일이 있어도 가족은 당신 편이에요",
    foodTip: "스트레스 해소에 도움 되는 음식을 드세요"
  }
};

// 사회운 상세 해설
const socialExplanations: Record<number, FortuneDetailExplanation> = {
  5: {
    title: "사회운",
    emoji: "👔",
    summary: "직장/사회에서 빛나는 날!",
    details: [
      "업무에서 좋은 성과를 낼 수 있어요",
      "동료들과의 관계가 원만합니다",
      "리더십을 발휘할 좋은 기회가 올 수 있어요"
    ],
    advice: "적극적으로 의견을 내고 주도적으로 행동하세요",
    foodTip: "점심 약속으로 관계를 다져보세요"
  },
  4: {
    title: "사회운",
    emoji: "👔",
    summary: "업무가 순조로운 하루",
    details: [
      "맡은 일이 잘 풀리는 느낌이에요",
      "동료들과 협력이 잘 됩니다",
      "새로운 기회가 찾아올 수 있어요"
    ],
    advice: "팀워크를 발휘하면 더 좋은 결과가 나올 거예요",
    foodTip: "동료와 함께 맛있는 점심 어때요?"
  },
  3: {
    title: "사회운",
    emoji: "👔",
    summary: "무난하게 흘러가는 업무",
    details: [
      "특별한 일 없이 평범한 하루예요",
      "주어진 일을 묵묵히 처리하는 날",
      "큰 변화보다는 안정을 추구하세요"
    ],
    advice: "오늘은 조용히 자기 일에 집중하는 게 좋아요",
    foodTip: "빠르고 간편하게 해결하고 업무에 집중!"
  },
  2: {
    title: "사회운",
    emoji: "👔",
    summary: "직장에서 주의가 필요해요",
    details: [
      "업무 중 작은 실수가 생길 수 있어요",
      "동료와의 갈등에 주의하세요",
      "중요한 결정은 미루는 게 좋습니다"
    ],
    advice: "신중하게 행동하고, 말 실수에 주의하세요",
    foodTip: "속 편한 음식으로 긴장을 풀어보세요"
  },
  1: {
    title: "사회운",
    emoji: "👔",
    summary: "조용히 지나가길 바라는 하루",
    details: [
      "업무 스트레스가 클 수 있어요",
      "인간관계에서 피로감을 느낄 수 있습니다",
      "무리한 업무는 피하는 게 좋아요"
    ],
    advice: "오늘은 버티는 것도 잘하는 거예요. 힘내세요!",
    foodTip: "스트레스 해소에 좋은 맛있는 음식이 필요해요"
  }
};

// 운세 상세 해설 가져오기
export function getFortuneExplanation(
  category: "overall" | "wealth" | "family" | "social",
  score: number
): FortuneDetailExplanation {
  const explanations = {
    overall: overallExplanations,
    wealth: wealthExplanations,
    family: familyExplanations,
    social: socialExplanations
  };
  return explanations[category][score] || explanations[category][3];
}

// 행운의 키워드 (오행별)
const luckyKeywordsByElement: Record<Element, string[]> = {
  목: ["신선한", "건강한", "자연의", "시작", "성장"],
  화: ["불맛", "열정", "에너지", "활력", "뜨거운"],
  토: ["든든한", "푸짐한", "안정", "조화", "균형"],
  금: ["깔끔한", "세련된", "프리미엄", "결단", "변화"],
  수: ["부드러운", "촉촉한", "시원한", "지혜", "유연함"]
};

// 위트 메시지 생성
export function generateWittyMessage(
  scores: FortuneScores,
  personElement: Element,
  gender: Gender,
  maritalStatus: MaritalStatus,
  luckyFood: { category: string; foods: string[] }
): WittyMessage {
  const today = new Date();
  const dateIndex = today.getDate() % 3;

  // 헤드라인 선택
  const headlines = overallHeadlines[scores.overall];
  const headline = headlines[dateIndex % headlines.length];

  // 페르소나 키
  const personaKey = `${gender}_${maritalStatus}`;
  const menuAdvices = menuAdviceByPersona[personaKey];
  const menuAdvice = menuAdvices[dateIndex % menuAdvices.length];

  // 상세 설명 조합
  const wealthNote = wealthAdvice[scores.wealth];
  const foodRec = luckyFood.foods.slice(0, 2).join(", ");
  const detail = `${wealthNote} 오늘의 추천 음식은 ${foodRec} 계열이에요.`;

  // 행운 키워드
  const keywords = luckyKeywordsByElement[personElement];

  return {
    headline,
    detail,
    menuAdvice,
    luckyKeywords: keywords.slice(0, 3)
  };
}

// ========== 구체적 메뉴 추천 ==========

interface SpecificMenuRecommendation {
  name: string;        // 메뉴명 (예: "장어구이")
  reason: string;      // 추천 이유
  keywords: string[];  // 연관 키워드
  targetAudience: string; // 대상 (예: "원기 회복이 필요한 분")
}

// 오행×성별×결혼여부별 구체적 메뉴 추천
const specificMenus: Record<string, SpecificMenuRecommendation[]> = {
  // 목(한식) - 성장과 건강
  "목_male_married": [
    { name: "삼계탕", reason: "원기 보충에 최고", keywords: ["보양", "건강", "든든"], targetAudience: "체력 회복이 필요한 가장" },
    { name: "갈비탕", reason: "깊은 맛으로 힐링", keywords: ["국물", "고기", "든든"], targetAudience: "든든한 한 끼가 필요한 분" },
    { name: "비빔밥", reason: "영양 균형 완벽", keywords: ["건강", "채소", "균형"], targetAudience: "건강 챙기는 직장인" }
  ],
  "목_male_single": [
    { name: "제육볶음", reason: "매콤하게 입맛 돋우기", keywords: ["매콤", "든든", "밥도둑"], targetAudience: "든든하게 배 채울 분" },
    { name: "순두부찌개", reason: "속 편하고 든든", keywords: ["국물", "매콤", "가성비"], targetAudience: "혼밥 맛집 찾는 분" },
    { name: "돼지국밥", reason: "가성비 최고의 한 끼", keywords: ["국밥", "든든", "가성비"], targetAudience: "실속 있는 점심 원하는 분" }
  ],
  "목_female_married": [
    { name: "된장찌개", reason: "건강하고 정갈한 한상", keywords: ["건강", "집밥", "정갈"], targetAudience: "건강한 식사 원하는 분" },
    { name: "나물정식", reason: "가볍고 영양 만점", keywords: ["채소", "건강", "다이어트"], targetAudience: "몸 관리 신경쓰는 분" },
    { name: "삼계탕", reason: "피로 회복에 딱", keywords: ["보양", "건강", "회복"], targetAudience: "에너지 충전이 필요한 분" }
  ],
  "목_female_single": [
    { name: "비빔밥", reason: "건강미를 담은 한 그릇", keywords: ["건강", "예쁜", "컬러풀"], targetAudience: "건강하게 먹고 싶은 분" },
    { name: "쌈밥", reason: "가볍게 채소 듬뿍", keywords: ["채소", "건강", "가벼운"], targetAudience: "가볍게 점심 해결할 분" },
    { name: "육회비빔밥", reason: "특별한 날의 한식", keywords: ["프리미엄", "특별한", "맛있는"], targetAudience: "오늘 좀 특별하게 먹을 분" }
  ],

  // 화(양식) - 열정과 활력
  "화_male_married": [
    { name: "스테이크", reason: "가끔은 제대로 된 고기!", keywords: ["고기", "프리미엄", "힐링"], targetAudience: "스트레스 해소가 필요한 분" },
    { name: "파스타", reason: "맛있고 든든하게", keywords: ["든든", "맛있는", "이탈리안"], targetAudience: "분위기 있는 점심 원하는 분" },
    { name: "리조또", reason: "크리미한 한 그릇", keywords: ["크리미", "부드러운", "만족"], targetAudience: "편안한 식사 원하는 분" }
  ],
  "화_male_single": [
    { name: "수제버거", reason: "묵직한 한 입의 행복", keywords: ["버거", "든든", "맛있는"], targetAudience: "확실하게 배 채울 분" },
    { name: "스테이크", reason: "혼자라도 제대로!", keywords: ["고기", "스테이크", "자기만족"], targetAudience: "나를 위한 투자할 분" },
    { name: "파스타", reason: "혼밥도 멋지게", keywords: ["파스타", "분위기", "맛있는"], targetAudience: "멋진 혼밥족" }
  ],
  "화_female_married": [
    { name: "파스타", reason: "기분 전환 이탈리안", keywords: ["파스타", "분위기", "힐링"], targetAudience: "기분 전환이 필요한 분" },
    { name: "브런치", reason: "여유로운 점심 시간", keywords: ["브런치", "예쁜", "여유"], targetAudience: "특별한 점심 원하는 분" },
    { name: "샐러드", reason: "가볍고 건강하게", keywords: ["건강", "다이어트", "신선"], targetAudience: "가볍게 먹고 싶은 분" }
  ],
  "화_female_single": [
    { name: "브런치", reason: "예쁘고 맛있고 완벽!", keywords: ["브런치", "인스타", "맛있는"], targetAudience: "분위기 좋은 곳 찾는 분" },
    { name: "파스타", reason: "감성 충전 이탈리안", keywords: ["파스타", "감성", "맛있는"], targetAudience: "맛과 분위기 둘 다 원하는 분" },
    { name: "샐러드볼", reason: "건강하고 트렌디하게", keywords: ["건강", "트렌디", "가벼운"], targetAudience: "건강 챙기는 트렌드세터" }
  ],

  // 토(중식) - 안정과 조화
  "토_male_married": [
    { name: "짬뽕", reason: "얼큰하게 속 풀기", keywords: ["얼큰", "속풀이", "시원"], targetAudience: "속이 답답한 분" },
    { name: "탕수육", reason: "바삭한 행복 한 접시", keywords: ["탕수육", "바삭", "맛있는"], targetAudience: "확실한 맛을 원하는 분" },
    { name: "마라탕", reason: "화끈하게 한 그릇", keywords: ["마라", "얼얼", "중독"], targetAudience: "얼얼한 자극 원하는 분" }
  ],
  "토_male_single": [
    { name: "짜장면", reason: "언제나 정답인 한 그릇", keywords: ["짜장", "든든", "가성비"], targetAudience: "빠르고 든든하게 먹을 분" },
    { name: "볶음밥", reason: "간단하지만 확실한 맛", keywords: ["볶음밥", "든든", "맛있는"], targetAudience: "간단하게 배 채울 분" },
    { name: "마라샹궈", reason: "매콤 얼얼한 한 접시", keywords: ["마라", "매콤", "푸짐"], targetAudience: "자극적인 맛 찾는 분" }
  ],
  "토_female_married": [
    { name: "딤섬", reason: "정갈한 점심 한상", keywords: ["딤섬", "정갈", "예쁜"], targetAudience: "분위기 있는 점심 원하는 분" },
    { name: "짬뽕", reason: "속 시원하게!", keywords: ["짬뽕", "얼큰", "시원"], targetAudience: "속이 개운해지고 싶은 분" },
    { name: "탕수육", reason: "새콤달콤 기분 전환", keywords: ["탕수육", "달콤", "바삭"], targetAudience: "맛있는 거 먹고 싶은 분" }
  ],
  "토_female_single": [
    { name: "딤섬", reason: "예쁘고 맛있는 조합", keywords: ["딤섬", "예쁜", "인스타"], targetAudience: "분위기 좋은 곳 찾는 분" },
    { name: "마라탕", reason: "얼얼하게 스트레스 해소", keywords: ["마라", "얼얼", "힐링"], targetAudience: "스트레스 해소할 분" },
    { name: "짜장면", reason: "가끔은 짜장 땡기잖아요", keywords: ["짜장", "든든", "comfort"], targetAudience: "편한 한 끼 원하는 분" }
  ],

  // 금(동남아식) - 결단과 변화
  "금_male_married": [
    { name: "쌀국수", reason: "깔끔하게 속 편안히", keywords: ["쌀국수", "깔끔", "편안"], targetAudience: "속이 편한 식사 원하는 분" },
    { name: "똠양꿍", reason: "이국적인 맛으로 기분 전환", keywords: ["똠양꿍", "새콤", "이국"], targetAudience: "새로운 맛 도전할 분" },
    { name: "팟타이", reason: "달콤짭짤한 한 접시", keywords: ["팟타이", "볶음면", "맛있는"], targetAudience: "든든하게 먹을 분" }
  ],
  "금_male_single": [
    { name: "쌀국수", reason: "가볍게 한 그릇", keywords: ["쌀국수", "가벼운", "국물"], targetAudience: "부담 없이 먹을 분" },
    { name: "분짜", reason: "새로운 맛 도전!", keywords: ["분짜", "베트남", "새로운"], targetAudience: "새로운 경험 원하는 분" },
    { name: "반미", reason: "간편하지만 맛있게", keywords: ["반미", "샌드위치", "간편"], targetAudience: "빠르게 먹을 분" }
  ],
  "금_female_married": [
    { name: "쌀국수", reason: "가볍고 건강하게", keywords: ["쌀국수", "건강", "가벼운"], targetAudience: "가볍게 점심 해결할 분" },
    { name: "파파야샐러드", reason: "상큼한 한 접시", keywords: ["샐러드", "상큼", "건강"], targetAudience: "건강 챙기는 분" },
    { name: "똠양꿍", reason: "기분 전환 이국 요리", keywords: ["똠양꿍", "이국", "특별"], targetAudience: "특별한 점심 원하는 분" }
  ],
  "금_female_single": [
    { name: "쌀국수", reason: "칼로리 걱정 No!", keywords: ["쌀국수", "가벼운", "다이어트"], targetAudience: "가볍게 먹을 분" },
    { name: "똠양꿍", reason: "새콤매콤 기분 UP", keywords: ["똠양꿍", "새콤", "매콤"], targetAudience: "기분 전환할 분" },
    { name: "분짜", reason: "트렌디한 베트남 요리", keywords: ["분짜", "트렌디", "맛있는"], targetAudience: "트렌디한 맛집 찾는 분" }
  ],

  // 수(일식) - 지혜와 유연함
  "수_male_married": [
    { name: "라멘", reason: "진한 국물로 힐링", keywords: ["라멘", "국물", "힐링"], targetAudience: "따뜻한 국물 원하는 분" },
    { name: "돈카츠", reason: "바삭하게 기분 전환", keywords: ["돈카츠", "바삭", "든든"], targetAudience: "든든하게 먹을 분" },
    { name: "덮밥", reason: "빠르고 맛있게", keywords: ["덮밥", "빠른", "맛있는"], targetAudience: "시간 없이 맛있게 먹을 분" }
  ],
  "수_male_single": [
    { name: "라멘", reason: "혼밥의 정석", keywords: ["라멘", "혼밥", "국물"], targetAudience: "혼밥족" },
    { name: "돈카츠", reason: "확실한 한 끼", keywords: ["돈카츠", "든든", "바삭"], targetAudience: "확실하게 배 채울 분" },
    { name: "규동", reason: "가성비 최고", keywords: ["규동", "가성비", "빠른"], targetAudience: "빠르게 해결할 분" }
  ],
  "수_female_married": [
    { name: "우동", reason: "따뜻하고 편안하게", keywords: ["우동", "따뜻", "편안"], targetAudience: "편안한 식사 원하는 분" },
    { name: "초밥", reason: "깔끔한 점심 한상", keywords: ["초밥", "깔끔", "신선"], targetAudience: "깔끔하게 먹을 분" },
    { name: "소바", reason: "가볍고 시원하게", keywords: ["소바", "가벼운", "시원"], targetAudience: "가벼운 식사 원하는 분" }
  ],
  "수_female_single": [
    { name: "초밥", reason: "예쁘고 맛있는 조합", keywords: ["초밥", "예쁜", "신선"], targetAudience: "예쁜 음식 좋아하는 분" },
    { name: "우동", reason: "따뜻한 한 그릇", keywords: ["우동", "따뜻", "편안"], targetAudience: "따뜻한 국물 원하는 분" },
    { name: "연어덮밥", reason: "건강하고 맛있게", keywords: ["연어", "건강", "맛있는"], targetAudience: "건강 챙기는 분" }
  ]
};

// 구체적 메뉴 추천 가져오기
export function getSpecificMenuRecommendation(
  element: Element,
  gender: Gender,
  maritalStatus: MaritalStatus
): SpecificMenuRecommendation {
  const key = `${element}_${gender}_${maritalStatus}`;
  const menus = specificMenus[key];

  if (!menus || menus.length === 0) {
    return {
      name: "오늘의 추천",
      reason: "맛있는 한 끼",
      keywords: ["맛있는", "추천"],
      targetAudience: "모든 분"
    };
  }

  // 날짜 기반으로 다른 메뉴 추천
  const today = new Date();
  const index = today.getDate() % menus.length;
  return menus[index];
}

// 운세 메시지 생성 (기존 함수 유지 - 호환성)
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
  // 띠 관련 정보
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
  // === 새로 추가된 필드 ===
  // 별자리 정보
  starSign: {
    name: ZodiacSign;
    emoji: string;
    element: "불" | "흙" | "공기" | "물";
    traits: string[];
  };
  // 운세 지수
  scores: FortuneScores;
  // 위트 메시지
  wittyMessage: {
    headline: string;
    detail: string;
    menuAdvice: string;
    luckyKeywords: string[];
  };
  // 구체적 메뉴 추천
  specificMenu: {
    name: string;
    reason: string;
    keywords: string[];
    targetAudience: string;
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

  // 별자리 정보
  const starSignInfo = getZodiacSignFromDate(birthMonth, birthDay);

  // 운세 지수 계산
  const scores = calculateFortuneScores(
    personElement,
    todayElement,
    zodiacRelation,
    starSignInfo,
    gender,
    maritalStatus
  );

  // 위트 메시지 생성
  const wittyMessage = generateWittyMessage(
    scores,
    personElement,
    gender,
    maritalStatus,
    luckyFood
  );

  // 구체적 메뉴 추천
  const specificMenu = getSpecificMenuRecommendation(
    luckyFood.element,
    gender,
    maritalStatus
  );

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
    zodiacRelation,
    // 새로 추가
    starSign: {
      name: starSignInfo.name,
      emoji: starSignInfo.emoji,
      element: starSignInfo.element,
      traits: starSignInfo.traits
    },
    scores,
    wittyMessage,
    specificMenu
  };
}
