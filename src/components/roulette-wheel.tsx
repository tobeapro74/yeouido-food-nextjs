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

    // 회전 완료 후, 포인터(12시)가 어느 섹션 안에 있는지 확인
    setTimeout(() => {
      const normalizedRotation = finalRotationRef.current % 360;

      // 포인터는 상단(12시)에 고정
      // 휠이 시계방향으로 회전하면, 포인터 관점에서는 반시계방향으로 섹션이 지나감
      //
      // 휠이 normalizedRotation 만큼 회전한 상태에서
      // 포인터(상단)가 가리키는 섹션을 찾으려면:
      // - 원래 상단에 있던 각도 0의 위치가 이제 normalizedRotation 위치로 이동
      // - 따라서 상단(0도 위치)에는 원래 (360 - normalizedRotation)도에 있던 부분이 옴
      //
      // 섹션 n은 n*60 ~ (n+1)*60 범위를 차지
      // (360 - normalizedRotation)이 어느 섹션 범위에 있는지 확인

      // 섹션 렌더링 분석:
      // - 섹션은 w-1/2 h-1/2 (왼쪽 상단 1/4)에 origin-bottom-right로 회전
      // - rotate(0deg) 섹션은 10시~12시 방향 (12시 기준 -30도 ~ +30도가 아님)
      // - 포인터는 12시 방향
      //
      // 휠이 시계방향으로 회전하면:
      // - normalizedRotation도 만큼 회전 후
      // - 원래 (360 - normalizedRotation)도 위치에 있던 섹션이 12시로 옴
      //
      // 하지만 섹션 0은 rotate(0)으로 10시~12시에 있고,
      // 섹션의 "중심"은 rotate값 + 30도 위치
      // 따라서 12시 포인터가 가리키는 섹션을 찾으려면:
      // - 12시 = CSS 좌표로 -60도 (또는 300도) 정도에 해당

      // 실험적으로 도출: 12시에 있는 섹션 찾기
      // 동남아(index 4)가 rotate(240)일 때 12시에 있음
      // 240 + 60 = 300, 300/60 = 5... 아니면
      // (360 - 240 + 330) % 360 = 90, 90/60 = 1.5 → 아님
      //
      // 단순하게: 화면에 보이는 섹션의 rotate 값을 직접 사용
      // 12시에 있는 섹션 = (360 - normalizedRotation + 300) % 360 / 60
      const pointerAngle = (360 - normalizedRotation + 300 + 360) % 360;
      const resultIndex = Math.floor(pointerAngle / sectionAngle) % items.length;

      console.log("=== 룰렛 디버그 ===");
      console.log("normalizedRotation:", normalizedRotation);
      console.log("pointerAngle:", pointerAngle);
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
