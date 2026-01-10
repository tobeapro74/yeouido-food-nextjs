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

      // 포인터는 12시 방향(상단)에 고정
      // 휠이 시계방향으로 normalizedRotation 만큼 회전했음
      //
      // 섹션 레이아웃 (origin-bottom-right, w-1/2 h-1/2):
      // - 초기(rotation=0)에서 섹션들의 위치:
      //   섹션 0: rotate(0deg) → 약 11시~1시 영역 (상단)
      //   섹션 1: rotate(60deg) → 약 1시~3시 영역
      //   섹션 2: rotate(120deg) → 약 3시~5시 영역
      //   섹션 3: rotate(180deg) → 약 5시~7시 영역
      //   섹션 4: rotate(240deg) → 약 7시~9시 영역
      //   섹션 5: rotate(300deg) → 약 9시~11시 영역
      //
      // 휠이 X도 회전하면, 원래 (360-X)도 위치에 있던 섹션이 상단(12시)으로 옴
      //
      // 예: 휠이 90도 회전 → 원래 270도(9시) 위치에 있던 섹션이 12시로 옴
      //     270도 위치의 섹션 = 섹션 4 (240~300도)의 중간쯤
      //
      // 포인터가 가리키는 각도 = (360 - normalizedRotation) % 360
      // 해당 각도가 어느 섹션에 속하는지 계산

      const pointerAngle = (360 - normalizedRotation + 360) % 360;

      // 섹션 n은 (n * sectionAngle) ~ ((n+1) * sectionAngle) 범위를 차지
      // pointerAngle이 어느 섹션 범위에 있는지 확인
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
