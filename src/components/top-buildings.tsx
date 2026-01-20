"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Trophy, ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getBuildingRankings, Restaurant } from "@/data/yeouido-food";

interface TopBuildingsProps {
  onSelect: (buildingId: string) => void;
  onShowAll?: () => void;
  customRestaurants?: Restaurant[];
}

const rankEmojis = ["🥇", "🥈", "🥉"];

// 빌딩별 아이콘 매핑
const buildingIcons: Record<string, string> = {
  "IFC몰": "🏢",
  "더현대서울": "🛍️",
  "63빌딩": "🗼",
  "파이낸스타워": "🏦",
  "원센티널": "🏛️",
  "브라이튼여의도": "🌆",
  "더샵아일랜드파크": "🏠",
  "CCMM빌딩": "🏬",
  "홍우빌딩": "🏗️",
  "백상빌딩": "🏘️",
  "아일렉스빌딩": "🏙️",
  "국회대로상가": "🏪",
  "여의도백화점": "🎁",
  "오륜빌딩": "🏟️",
  "정우빌딩": "🏤",
  "BNK금융타워": "💰",
  "씨티플라자": "🌃",
  "유성빌딩": "⭐",
  "미원빌딩": "🍜",
  "신송빌딩": "📦",
  "경호빌딩": "🛡️",
  "익스콘벤처타워": "🚀",
  "율촌빌딩": "⚖️",
  "삼도오피스텔": "🏨",
};

const getIconForBuilding = (name: string): string => {
  return buildingIcons[name] || "🏢";
};

export function TopBuildings({ onSelect, onShowAll, customRestaurants = [] }: TopBuildingsProps) {
  // 빌딩 랭킹 계산 (상위 5개만)
  const topBuildings = useMemo(() => {
    return getBuildingRankings(customRestaurants).slice(0, 5);
  }, [customRestaurants]);

  if (topBuildings.length === 0) {
    return null;
  }

  return (
    <section className="bg-card rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h2 className="text-base font-semibold text-foreground">오늘의 맛빌딩</h2>
        </div>
        {onShowAll && (
          <button
            onClick={onShowAll}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>전체보기</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {topBuildings.map((building, index) => (
            <Card
              key={building.buildingId}
              className="flex-shrink-0 w-28 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] overflow-hidden border-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900"
              onClick={() => onSelect(building.buildingId)}
            >
              <CardContent className="p-2.5 flex flex-col items-center">
                {/* 순위 메달 */}
                <span className="text-2xl leading-none">
                  {index < 3 ? rankEmojis[index] : `${index + 1}위`}
                </span>

                {/* 빌딩 아이콘 */}
                <span className="text-3xl my-1.5 leading-none">{getIconForBuilding(building.buildingName)}</span>

                {/* 빌딩명 */}
                <h3 className="font-semibold text-xs text-center truncate w-full" title={building.buildingName}>
                  {building.buildingName}
                </h3>

                {/* 평점 + 맛집 수 */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold">{building.avgRating.toFixed(1)}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {building.restaurantCount}곳
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
