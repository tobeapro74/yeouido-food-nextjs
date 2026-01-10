"use client";

import { useState, useRef } from "react";

interface RouletteWheelProps {
  items: { id: string; label: string; color: string }[];
  onResult: (id: string) => void;
}

export function RouletteWheel({ items, onResult }: RouletteWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const finalRotationRef = useRef(0);

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);

    const sectionAngle = 360 / items.length; // 60도

    // 랜덤 회전: 5바퀴 + 랜덤 각도
    const spins = 5;
    const randomAngle = Math.random() * 360;
    const totalRotation = 360 * spins + randomAngle;
    const newRotation = rotation + totalRotation;

    finalRotationRef.current = newRotation;
    setRotation(newRotation);

    // 회전 완료 후, 실제 포인터가 가리키는 섹션 계산
    setTimeout(() => {
      // 최종 회전 각도를 0-360으로 정규화
      const normalizedRotation = finalRotationRef.current % 360;

      // 실제 섹션 레이아웃 (origin-bottom-right, w-1/2 h-1/2):
      // 섹션들이 좌상단 1/4 영역에서 시작하여 시계방향으로 배치됨
      // - 섹션 0: 9시~11시 (좌측 상단)
      // - 섹션 1: 11시~1시 (상단 중앙) ← 초기 상태에서 포인터(12시)가 여기
      // - 섹션 2: 1시~3시
      // - 섹션 3: 3시~5시
      // - 섹션 4: 5시~7시
      // - 섹션 5: 7시~9시
      //
      // 즉, 섹션 레이아웃이 시계 기준으로 -60도(반시계 1칸) 밀려있음
      // 포인터(12시)가 초기에 섹션 1을 가리킴
      //
      // 휠이 X도 회전하면, 포인터가 가리키는 섹션 각도 = (360 - X + 60) % 360
      // +60은 초기 오프셋 보정 (섹션 1이 12시에 있으므로)

      const pointerAngle = (360 - normalizedRotation + 60 + 360) % 360;

      let resultIndex = Math.floor(pointerAngle / sectionAngle);
      if (resultIndex >= items.length) resultIndex = 0;

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
