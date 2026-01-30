"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, Star, ChefHat, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getBuildingRankings, Restaurant } from "@/data/yeouido-food";

interface BuildingRankingListProps {
  onBack: () => void;
  onSelectBuilding: (buildingId: string) => void;
  customRestaurants?: Restaurant[];
}

type RegionFilter = "전체" | "동여의도" | "서여의도";

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

export function BuildingRankingList({ onBack, onSelectBuilding, customRestaurants = [] }: BuildingRankingListProps) {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("전체");

  const allBuildings = useMemo(() => getBuildingRankings(customRestaurants), [customRestaurants]);

  // 지역 필터링
  const filteredBuildings = useMemo(() => {
    if (regionFilter === "전체") return allBuildings;
    return allBuildings.filter((b) => b.지역 === regionFilter);
  }, [allBuildings, regionFilter]);

  return (
    <div className="min-h-screen pb-20">
      {/* 헤더 */}
      <header className="bg-card border-b border-border sticky top-0 z-10 safe-area-top">
        <div className="flex items-center px-2 py-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="h-11 w-11 min-w-[44px] min-h-[44px] rounded-full mr-2"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Trophy className="h-5 w-5 text-amber-500 mr-2" />
          <h1 className="text-lg font-semibold">오늘의 맛빌딩</h1>
          <span className="ml-2 text-sm text-muted-foreground">
            ({filteredBuildings.length})
          </span>
        </div>

        {/* 지역 필터 탭 */}
        <div className="flex border-t border-border">
          {(["전체", "동여의도", "서여의도"] as RegionFilter[]).map((region) => (
            <button
              key={region}
              onClick={() => setRegionFilter(region)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                regionFilter === region
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </header>

      {/* 목록 */}
      <div className="p-4 space-y-3">
        {filteredBuildings.length > 0 ? (
          filteredBuildings.map((building, index) => (
            <Card
              key={building.buildingId}
              className="cursor-pointer transition-all hover:shadow-md active:scale-[0.99]"
              onClick={() => onSelectBuilding(building.buildingId)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* 순위 (전체 탭에서만 표시) */}
                  <div className="flex-shrink-0 w-12 text-center">
                    {regionFilter === "전체" && index < 3 ? (
                      <span className="text-3xl">{rankEmojis[index]}</span>
                    ) : regionFilter === "전체" ? (
                      <span className="text-xl font-bold text-muted-foreground">{index + 1}위</span>
                    ) : (
                      <span className="text-3xl">{getIconForBuilding(building.buildingName)}</span>
                    )}
                  </div>

                  {/* 빌딩 아이콘 (전체 탭에서만 표시) */}
                  {regionFilter === "전체" && (
                    <div className="flex-shrink-0 text-3xl">
                      {getIconForBuilding(building.buildingName)}
                    </div>
                  )}

                  {/* 빌딩 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{building.buildingName}</h3>
                      {regionFilter === "전체" && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {building.지역}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{building.avgRating.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ChefHat className="h-3 w-3" />
                        <span>{building.restaurantCount}개 맛집</span>
                      </div>
                    </div>
                    {building.topRestaurant && (
                      <p className="text-xs text-primary mt-1 truncate">
                        👑 대표: {building.topRestaurant.이름}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {regionFilter === "전체"
              ? "등록된 빌딩이 없습니다."
              : `${regionFilter}에 등록된 맛빌딩이 없습니다.`}
          </div>
        )}
      </div>
    </div>
  );
}
