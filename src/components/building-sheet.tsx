"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BuildingOption {
  id: string;
  name: string;
  icon: string;
  지역?: string;
}

interface BuildingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: BuildingOption[];
  onSelect: (id: string) => void;
}

// 한글+영문 가나다순 정렬 함수
function sortKoreanFirst(a: string, b: string): number {
  const isKoreanA = /^[가-힣]/.test(a);
  const isKoreanB = /^[가-힣]/.test(b);

  if (isKoreanA && !isKoreanB) return -1;
  if (!isKoreanA && isKoreanB) return 1;

  return a.localeCompare(b, 'ko');
}

type RegionTab = "동여의도" | "서여의도";

export function BuildingSheet({
  open,
  onOpenChange,
  options,
  onSelect,
}: BuildingSheetProps) {
  const [activeRegion, setActiveRegion] = useState<RegionTab>("동여의도");

  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  // "전체" 옵션 분리
  const allOption = options.find(o => o.id === "전체");
  const buildingOptions = options.filter(o => o.id !== "전체");

  // 지역별로 분류
  const 동여의도Buildings = buildingOptions
    .filter(b => b.지역 === "동여의도")
    .sort((a, b) => sortKoreanFirst(a.name, b.name));

  const 서여의도Buildings = buildingOptions
    .filter(b => b.지역 === "서여의도")
    .sort((a, b) => sortKoreanFirst(a.name, b.name));

  const currentBuildings = activeRegion === "동여의도" ? 동여의도Buildings : 서여의도Buildings;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl h-[70vh]">
        <SheetHeader>
          <SheetTitle className="text-lg">빌딩 선택</SheetTitle>
        </SheetHeader>

        <div className="py-3 space-y-3">
          {/* 전체 옵션 */}
          {allOption && (
            <button
              onClick={() => handleSelect(allOption.id)}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
            >
              <span className="text-lg">{allOption.icon}</span>
              <span className="font-medium text-primary text-sm">전체 빌딩 보기</span>
            </button>
          )}

          {/* 지역 탭 버튼 */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveRegion("동여의도")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                activeRegion === "동여의도"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>🏙️</span>
              <span>동여의도</span>
              <span className="text-xs text-muted-foreground">({동여의도Buildings.length})</span>
            </button>
            <button
              onClick={() => setActiveRegion("서여의도")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                activeRegion === "서여의도"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>🏛️</span>
              <span>서여의도</span>
              <span className="text-xs text-muted-foreground">({서여의도Buildings.length})</span>
            </button>
          </div>

          {/* 지역 설명 */}
          <p className="text-xs text-muted-foreground text-center">
            {activeRegion === "동여의도"
              ? "IFC, 더현대, 국제금융로 주변"
              : "국회, 여의도공원, 국회대로 주변"}
          </p>
        </div>

        {/* 빌딩 리스트 */}
        <ScrollArea className="h-[calc(100%-12rem)] pr-4">
          <div className="grid grid-cols-2 gap-2 pb-4">
            {currentBuildings.map((building) => (
              <button
                key={building.id}
                onClick={() => handleSelect(building.id)}
                className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors text-left border border-border/50"
              >
                <span className="text-lg">{building.icon}</span>
                <span className="text-sm truncate">{building.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
