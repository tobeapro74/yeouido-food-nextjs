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

    // 각 섹션의 각도
    const sectionAngle = 360 / items.length;

    // 먼저 결과를 랜덤으로 선택
    const resultIndex = Math.floor(Math.random() * items.length);
    resultRef.current = items[resultIndex].id;

    // 해당 섹션이 포인터(상단) 아래에 오도록 회전 각도 계산
    // 섹션은 origin-bottom-right로 배치되어 있음
    // 섹션 0은 0도에서 시작, 시계방향으로 진행
    // 포인터는 상단(270도 위치, 12시 방향)에 있음
    // 섹션 중앙이 포인터 아래에 오려면:
    // - 섹션 n의 중앙 각도 = n * sectionAngle + sectionAngle/2
    // - 이 중앙이 270도(상단)에 오도록 회전
    const sectionCenter = resultIndex * sectionAngle + sectionAngle / 2;
    // 섹션 중앙이 270도 위치에 오도록 하려면, (270 - sectionCenter) 만큼 회전된 상태여야 함
    // 하지만 CSS에서 rotate는 시계방향이 양수이므로,
    // 최종 위치 = 270 - sectionCenter (이 값이 양수가 되도록 360 더함)
    const targetPosition = (270 - sectionCenter + 360) % 360;

    // 최소 5바퀴 + 목표 위치로 회전
    const spins = 5;
    const currentNormalized = rotation % 360;
    // 현재 위치에서 목표 위치까지 추가로 회전해야 할 각도
    let additionalRotation = targetPosition - currentNormalized;
    if (additionalRotation < 0) additionalRotation += 360;

    const totalRotation = 360 * spins + additionalRotation;
    const newRotation = rotation + totalRotation;

    setRotation(newRotation);

    // 회전 완료 후 미리 선택한 결과 전달
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
