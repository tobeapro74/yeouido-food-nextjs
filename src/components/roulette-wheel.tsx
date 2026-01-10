"use client";

import { useState, useRef } from "react";

interface RouletteWheelProps {
  items: { id: string; label: string; color: string }[];
  onResult: (id: string) => void;
}

export function RouletteWheel({ items, onResult }: RouletteWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const resultRef = useRef<string | null>(null);

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);

    const sectionAngle = 360 / items.length; // 60도

    // 먼저 결과를 랜덤으로 선택
    const resultIndex = Math.floor(Math.random() * items.length);
    resultRef.current = items[resultIndex].id;

    // 섹션 레이아웃 분석:
    // - 각 섹션은 w-1/2 h-1/2 (좌상단 1/4 영역)
    // - origin-bottom-right (휠 중심 기준 회전)
    // - rotate(0)일 때 섹션 0은 12시~2시 방향 차지 (좌상단 → 우상단으로)
    // - 섹션 중앙은 약 1시 방향 (30도 위치, 12시 기준으로 시계방향)
    //
    // rotation=0일 때:
    // - 섹션 0(한식): 12시~2시 (중앙: 1시 = 30도)
    // - 섹션 1(양식): 2시~4시 (중앙: 3시 = 90도)
    // - 섹션 2(중식): 4시~6시 (중앙: 5시 = 150도)
    // - 섹션 3(일식): 6시~8시 (중앙: 7시 = 210도)
    // - 섹션 4(동남아): 8시~10시 (중앙: 9시 = 270도)
    // - 섹션 5(랜덤): 10시~12시 (중앙: 11시 = 330도)
    //
    // 포인터는 12시(0도) 방향에 있음
    // 섹션 n의 중앙을 12시(0도)로 가져오려면:
    // - 섹션 n의 초기 중앙 위치 = n * 60 + 30
    // - 이를 0도로 이동시키려면 -(n * 60 + 30) 만큼 회전 필요
    // - CSS rotate는 시계방향이 양수이므로, 360 - (n * 60 + 30)

    const sectionCenterInitial = resultIndex * sectionAngle + sectionAngle / 2;
    const targetRotation = (360 - sectionCenterInitial + 360) % 360;

    // 최소 5바퀴 + 목표 위치
    const spins = 5;
    const currentNormalized = rotation % 360;

    let additionalRotation = targetRotation - currentNormalized;
    if (additionalRotation <= 0) additionalRotation += 360;

    const totalRotation = 360 * spins + additionalRotation;
    const newRotation = rotation + totalRotation;

    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      if (resultRef.current) {
        onResult(resultRef.current);
      }
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center">
      {/* 포인터 */}
      <div className="relative z-10 mb-[-20px]">
        <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-orange-600 drop-shadow-md" />
      </div>

      {/* 룰렛 휠 */}
      <div className="relative w-64 h-64">
        <div
          className="w-full h-full rounded-full shadow-xl border-4 border-orange-300 overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          {items.map((item, index) => {
            const angle = (360 / items.length) * index;
            const skewAngle = 90 - 360 / items.length;

            return (
              <div
                key={item.id}
                className="absolute w-1/2 h-1/2 origin-bottom-right"
                style={{
                  transform: `rotate(${angle}deg) skewY(${skewAngle}deg)`,
                  backgroundColor: item.color,
                }}
              >
                <span
                  className="absolute text-white font-bold text-xs drop-shadow-md"
                  style={{
                    transform: `skewY(${-skewAngle}deg) rotate(${360 / items.length / 2}deg)`,
                    left: "50%",
                    top: "30%",
                    transformOrigin: "0 0",
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 중앙 버튼 */}
        <button
          onClick={spin}
          disabled={isSpinning}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white shadow-lg border-4 border-orange-400 flex items-center justify-center font-bold text-orange-600 transition-all ${
            isSpinning ? "scale-95" : "hover:scale-105 active:scale-95"
          }`}
        >
          {isSpinning ? "🎲" : "SPIN"}
        </button>
      </div>

      {/* 안내 텍스트 */}
      <p className="mt-4 text-sm text-gray-500">
        {isSpinning ? "돌아가는 중..." : "중앙 버튼을 눌러 돌려보세요!"}
      </p>
    </div>
  );
}
