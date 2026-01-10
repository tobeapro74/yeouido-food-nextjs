"use client";

import { Home, Grid3X3, Building2, Dice5 } from "lucide-react";

type TabType = "home" | "recommend" | "category" | "region" | "building";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: typeof Home }[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "recommend", label: "한끼추천", icon: Dice5 },
  { id: "category", label: "카테고리", icon: Grid3X3 },
  { id: "building", label: "빌딩", icon: Building2 },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isRecommend = tab.id === "recommend";
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive
                  ? isRecommend ? "text-orange-500" : "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5px]" : ""}`} />
              <span className={`text-xs ${isActive ? "font-semibold" : ""}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
