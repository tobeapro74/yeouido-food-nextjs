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

    // 회전 완료 후 결과 계산
    setTimeout(() => {
      const normalizedRotation = finalRotationRef.current % 360;

      // 각 섹션을 순회하며 12시 포인터 위치에 있는 섹션 찾기
      // 섹션 n의 원래 시작각 = n * 60 - 90
      // 휠 회전 후 섹션 n의 시작각 = (n * 60 - 90 + normalizedRotation) % 360
      // 섹션 n의 범위 = 시작각 ~ 시작각 + 60
      //
      // CSS origin-bottom-right 특성상 12시 포인터가 가리키는 위치는
      // 섹션의 시작각이 약 270도(또는 -90도) 근처일 때
      // 실험 데이터: 동남아(index 4)가 12시일 때 normalizedRotation=219
      // 동남아 시작각 = (4*60 - 90 + 219) % 360 = 9도
      // 동남아 끝각 = 69도
      // 따라서 포인터는 약 30도 위치 (섹션 중앙)
      const pointerPosition = 30;

      let resultIndex = 0;
      for (let i = 0; i < items.length; i++) {
        const startAngle = (i * sectionAngle - 90 + normalizedRotation + 360) % 360;
        const endAngle = (startAngle + sectionAngle) % 360;

        // 포인터가 이 섹션 범위 안에 있는지 확인
        if (startAngle < endAngle) {
          if (pointerPosition >= startAngle && pointerPosition < endAngle) {
            resultIndex = i;
            break;
          }
        } else {
          // 360도를 넘어가는 경우 (예: 330~30)
          if (pointerPosition >= startAngle || pointerPosition < endAngle) {
            resultIndex = i;
            break;
          }
        }
      }

      console.log("=== 룰렛 디버그 ===");
      console.log("normalizedRotation:", normalizedRotation);
      console.log("resultIndex:", resultIndex);
      console.log("result:", items[resultIndex].id);

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
            // 12시 방향(-90도)부터 시작하도록 오프셋 적용
            const angle = (360 / items.length) * index - 90;
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
