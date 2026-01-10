"use client";

import { useState } from "react";

interface RouletteWheelProps {
  items: { id: string; label: string; color: string }[];
  onResult: (id: string) => void;
}

export function RouletteWheel({ items, onResult }: RouletteWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);

    // 각 섹션의 각도
    const sectionAngle = 360 / items.length;

    // 최소 5바퀴 + 랜덤 추가 각도
    const spins = 5;
    const randomAngle = Math.random() * 360;
    const totalRotation = 360 * spins + randomAngle;

    const newRotation = rotation + totalRotation;
    setRotation(newRotation);

    // 회전 완료 후 실제 포인터 위치 기반으로 결과 계산
    setTimeout(() => {
      // 최종 회전 각도를 0-360 범위로 정규화
      const normalizedRotation = newRotation % 360;

      // 포인터는 상단(12시 방향)에 있음
      // 휠이 시계방향으로 회전하므로, 포인터가 가리키는 섹션은 반대 방향으로 계산
      // 섹션 0은 0도에서 시작하므로, 포인터 위치에서 어떤 섹션인지 계산
      const pointerAngle = (360 - normalizedRotation + 360) % 360;

      // 어떤 섹션이 포인터 아래에 있는지 계산
      const resultIndex = Math.floor(pointerAngle / sectionAngle) % items.length;

      setIsSpinning(false);
      onResult(items[resultIndex].id);
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
