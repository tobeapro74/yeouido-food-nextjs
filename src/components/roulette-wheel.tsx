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

    // 목표: resultIndex 섹션의 중앙이 포인터(상단, 12시) 아래에 오도록 회전
    //
    // 휠의 현재 상태에서 섹션 n이 가리키는 CSS transform은 rotate(n * 60deg)
    // 예: 동남아(index 4) = rotate(240deg)
    //
    // 포인터는 상단(12시)에 고정되어 있고, 휠이 회전함
    // 휠이 X도 회전하면, 원래 0도에 있던 것이 X도 위치로 이동
    // 즉, 상단(0도)에는 원래 (360-X)도에 있던 섹션이 옴
    //
    // 섹션 n의 중앙 각도 = n * sectionAngle + sectionAngle/2
    // 이 섹션이 상단에 오려면, 휠을 (섹션 중앙 각도)만큼 회전시키면 됨
    // 왜냐하면 rotate(X)는 시계방향 회전이고,
    // X만큼 회전하면 원래 X 위치에 있던 것이 상단(0도)으로 옴

    const sectionCenter = resultIndex * sectionAngle + sectionAngle / 2;
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
