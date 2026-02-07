"use client";

import { useState, useEffect, useRef, useCallback, useMemo, ReactNode } from "react";

/**
 * Virtual List 컴포넌트
 * - 대량의 아이템을 효율적으로 렌더링
 * - 화면에 보이는 아이템만 DOM에 렌더링
 * - 스크롤 성능 최적화
 */

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number; // 화면 밖에 미리 렌더링할 아이템 수
  className?: string;
  containerHeight?: number | string;
  onEndReached?: () => void;
  endReachedThreshold?: number; // px
  keyExtractor?: (item: T, index: number) => string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className = "",
  containerHeight = "100%",
  onEndReached,
  endReachedThreshold = 200,
  keyExtractor,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightPx, setContainerHeightPx] = useState(0);
  const endReachedRef = useRef(false);

  // 컨테이너 높이 측정
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeightPx(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeightPx(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // 스크롤 핸들러
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      setScrollTop(target.scrollTop);

      // 끝에 도달했는지 체크
      if (onEndReached) {
        const isNearEnd =
          target.scrollHeight - target.scrollTop - target.clientHeight < endReachedThreshold;

        if (isNearEnd && !endReachedRef.current) {
          endReachedRef.current = true;
          onEndReached();
        } else if (!isNearEnd) {
          endReachedRef.current = false;
        }
      }
    },
    [onEndReached, endReachedThreshold]
  );

  // 가상화 계산
  const { visibleItems, startIndex, totalHeight, offsetY } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeightPx) / itemHeight) + overscan
    );
    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;

    return { visibleItems, startIndex, totalHeight, offsetY };
  }, [items, itemHeight, scrollTop, containerHeightPx, overscan]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const key = keyExtractor ? keyExtractor(item, actualIndex) : actualIndex;

            return (
              <div key={key} style={{ height: itemHeight }}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 가변 높이 Virtual List
 * - 각 아이템의 높이가 다를 수 있는 경우
 */

interface VariableVirtualListProps<T> {
  items: T[];
  estimatedItemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  containerHeight?: number | string;
  keyExtractor?: (item: T, index: number) => string;
}

export function VariableVirtualList<T>({
  items,
  estimatedItemHeight,
  renderItem,
  overscan = 3,
  className = "",
  containerHeight = "100%",
  keyExtractor,
}: VariableVirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightPx, setContainerHeightPx] = useState(0);
  const itemHeightsRef = useRef<Map<number, number>>(new Map());

  // 컨테이너 높이 측정
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeightPx(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeightPx(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // 아이템 높이 측정 콜백
  const measureItem = useCallback((index: number, height: number) => {
    itemHeightsRef.current.set(index, height);
  }, []);

  // 스크롤 핸들러
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  }, []);

  // 가상화 계산
  const { visibleItems, startIndex, totalHeight, offsetY } = useMemo(() => {
    const heights = itemHeightsRef.current;
    let totalHeight = 0;
    let startIndex = 0;
    let offsetY = 0;
    let currentTop = 0;
    let foundStart = false;

    // 시작 인덱스 찾기
    for (let i = 0; i < items.length; i++) {
      const height = heights.get(i) || estimatedItemHeight;

      if (!foundStart && currentTop + height > scrollTop - overscan * estimatedItemHeight) {
        startIndex = i;
        offsetY = currentTop;
        foundStart = true;
      }

      currentTop += height;
    }

    totalHeight = currentTop;

    // 끝 인덱스 찾기
    let endIndex = startIndex;
    currentTop = offsetY;

    for (let i = startIndex; i < items.length; i++) {
      const height = heights.get(i) || estimatedItemHeight;
      currentTop += height;
      endIndex = i + 1;

      if (currentTop > scrollTop + containerHeightPx + overscan * estimatedItemHeight) {
        break;
      }
    }

    const visibleItems = items.slice(startIndex, endIndex);

    return { visibleItems, startIndex, totalHeight, offsetY };
  }, [items, estimatedItemHeight, scrollTop, containerHeightPx, overscan]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const key = keyExtractor ? keyExtractor(item, actualIndex) : actualIndex;

            return (
              <MeasuredItem
                key={key}
                index={actualIndex}
                onMeasure={measureItem}
              >
                {renderItem(item, actualIndex)}
              </MeasuredItem>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 높이 측정 래퍼
function MeasuredItem({
  index,
  onMeasure,
  children,
}: {
  index: number;
  onMeasure: (index: number, height: number) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const height = ref.current.getBoundingClientRect().height;
      onMeasure(index, height);
    }
  }, [index, onMeasure, children]);

  return <div ref={ref}>{children}</div>;
}

/**
 * 수평 Virtual List (가로 스크롤)
 */

interface HorizontalVirtualListProps<T> {
  items: T[];
  itemWidth: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  containerWidth?: number | string;
  keyExtractor?: (item: T, index: number) => string;
}

export function HorizontalVirtualList<T>({
  items,
  itemWidth,
  renderItem,
  overscan = 2,
  className = "",
  containerWidth = "100%",
  keyExtractor,
}: HorizontalVirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidthPx, setContainerWidthPx] = useState(0);

  // 컨테이너 너비 측정
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidthPx(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    setContainerWidthPx(container.clientWidth);

    return () => resizeObserver.disconnect();
  }, []);

  // 스크롤 핸들러
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft((e.target as HTMLDivElement).scrollLeft);
  }, []);

  // 가상화 계산
  const { visibleItems, startIndex, totalWidth, offsetX } = useMemo(() => {
    const totalWidth = items.length * itemWidth;
    const startIndex = Math.max(0, Math.floor(scrollLeft / itemWidth) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollLeft + containerWidthPx) / itemWidth) + overscan
    );
    const visibleItems = items.slice(startIndex, endIndex);
    const offsetX = startIndex * itemWidth;

    return { visibleItems, startIndex, totalWidth, offsetX };
  }, [items, itemWidth, scrollLeft, containerWidthPx, overscan]);

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto overflow-y-hidden ${className}`}
      style={{ width: containerWidth }}
      onScroll={handleScroll}
    >
      <div style={{ width: totalWidth, position: "relative", height: "100%" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            display: "flex",
            transform: `translateX(${offsetX}px)`,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const key = keyExtractor ? keyExtractor(item, actualIndex) : actualIndex;

            return (
              <div key={key} style={{ width: itemWidth, flexShrink: 0 }}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
