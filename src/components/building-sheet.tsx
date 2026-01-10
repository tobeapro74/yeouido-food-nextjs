"use client";

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

export function BuildingSheet({
  open,
  onOpenChange,
  options,
  onSelect,
}: BuildingSheetProps) {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl h-[70vh]">
        <SheetHeader>
          <SheetTitle className="text-lg">빌딩 선택</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-3rem)] pr-4">
          <div className="py-4 space-y-6">
            {/* 전체 옵션 */}
            {allOption && (
              <button
                onClick={() => handleSelect(allOption.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
              >
                <span className="text-xl">{allOption.icon}</span>
                <span className="font-medium text-primary">전체 빌딩 보기</span>
              </button>
            )}

            {/* 동여의도 */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <span>🏙️</span>
                <span>동여의도</span>
                <span className="text-xs font-normal">(IFC, 더현대, 국제금융로)</span>
              </h3>
              <div className="space-y-1">
                {동여의도Buildings.map((building) => (
                  <button
                    key={building.id}
                    onClick={() => handleSelect(building.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-lg w-6 text-center">{building.icon}</span>
                    <span className="text-sm">{building.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 서여의도 */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <span>🏛️</span>
                <span>서여의도</span>
                <span className="text-xs font-normal">(국회, 여의도공원)</span>
              </h3>
              <div className="space-y-1">
                {서여의도Buildings.map((building) => (
                  <button
                    key={building.id}
                    onClick={() => handleSelect(building.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-lg w-6 text-center">{building.icon}</span>
                    <span className="text-sm">{building.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
