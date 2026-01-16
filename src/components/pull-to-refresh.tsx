"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => void;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80; // 새로고침 트리거 거리

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // 스크롤이 최상단일 때만 pull-to-refresh 활성화
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === 0 || isRefreshing) return;
      if (window.scrollY > 0) {
        startY.current = 0;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // 저항감 적용 (당길수록 느려짐)
        const resistance = Math.min(diff * 0.4, 120);
        setPullDistance(resistance);

        if (diff > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(50);

        // 새로고침 실행
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }

        // 애니메이션 후 리셋 (새로고침이 되면 이 코드는 실행 안됨)
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 1000);
      } else {
        setPullDistance(0);
      }
      startY.current = 0;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  const showIndicator = pullDistance > 10 || isRefreshing;
  const isReady = pullDistance >= threshold;

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center items-center transition-all duration-200 overflow-hidden z-50"
        style={{
          height: showIndicator ? `${Math.max(pullDistance, isRefreshing ? 50 : 0)}px` : 0,
          top: 0,
        }}
      >
        <div
          className={`flex items-center gap-2 text-sm transition-all ${
            isReady || isRefreshing ? "text-orange-500" : "text-gray-400"
          }`}
        >
          <RefreshCw
            className={`w-5 h-5 transition-transform ${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
            }}
          />
          <span>
            {isRefreshing
              ? "새로고침 중..."
              : isReady
              ? "놓으면 새로고침"
              : "당겨서 새로고침"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
