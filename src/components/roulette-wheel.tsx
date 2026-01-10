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

    // 실제 테스트 결과, 포인터가 가리키는 섹션과 계산된 인덱스가 1칸 차이남
    // 중식(index 2, 120도)이 포인터에 있을 때 양식(index 1)이 출력됨
    // 따라서 실제 회전 시 +1 오프셋 적용 (다음 섹션이 포인터에 오도록)
    const adjustedIndex = (resultIndex + 1) % items.length;

    const sectionCenter = adjustedIndex * sectionAngle + sectionAngle / 2;
    const targetRotation = sectionCenter;

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
