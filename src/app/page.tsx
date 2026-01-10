"use client";

import { useState, useMemo, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BottomNav } from "@/components/bottom-nav";
import { RestaurantCard } from "@/components/restaurant-card";
import { RestaurantList } from "@/components/restaurant-list";
import { RestaurantDetail } from "@/components/restaurant-detail";
import { CategorySheet } from "@/components/category-sheet";
import { BuildingSheet } from "@/components/building-sheet";
import { AuthModal } from "@/components/auth-modal";
import { RecommendationView } from "@/components/recommendation-view";
import { SearchBar } from "@/components/search-bar";
import {
  Restaurant,
  categories,
  regions,
  buildings,
  getRestaurantsByCategory,
  getRestaurantsByRegion,
  getRestaurantsByBuilding,
  getPopularRestaurants,
} from "@/data/yeouido-food";

type View = "home" | "list" | "detail" | "recommend";
type TabType = "home" | "recommend" | "category" | "region" | "building";

interface UserInfo {
  id: number;
  name: string;
  is_admin: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [currentView, setCurrentView] = useState<View>("home");
  const [previousView, setPreviousView] = useState<View>("home");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [listTitle, setListTitle] = useState("");
  const [listItems, setListItems] = useState<Restaurant[]>([]);

  // 시트 상태
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  const [buildingSheetOpen, setBuildingSheetOpen] = useState(false);

  // 홈 화면 지역 필터
  const [selectedRegion, setSelectedRegion] = useState("전체");

  // 사용자 인증 상태
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };
    checkAuth();
  }, []);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 인기 맛집 (카테고리별 최고 평점)
  const popularRestaurants = useMemo(() => {
    return getPopularRestaurants();
  }, []);

  // 지역별 맛집
  const regionRestaurants = useMemo(() => {
    return getRestaurantsByRegion(selectedRegion).slice(0, 6);
  }, [selectedRegion]);

  // 탭 변경 처리
  const handleTabChange = (tab: TabType) => {
    if (tab === "home") {
      setCurrentView("home");
      setActiveTab("home");
    } else if (tab === "recommend") {
      setCurrentView("recommend");
      setActiveTab("recommend");
    } else if (tab === "category") {
      setCategorySheetOpen(true);
    } else if (tab === "region") {
      setRegionSheetOpen(true);
    } else if (tab === "building") {
      setBuildingSheetOpen(true);
    }
  };

  // 카테고리 선택
  const handleCategorySelect = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    setListTitle(categoryId === "전체" ? "전체 맛집" : `${category?.name || categoryId} 맛집`);
    setListItems(getRestaurantsByCategory(categoryId));
    setCurrentView("list");
    setActiveTab("category");
  };

  // 지역 선택
  const handleRegionSelect = (regionId: string) => {
    const region = regions.find((r) => r.id === regionId);
    setListTitle(regionId === "전체" ? "전체 지역" : `${region?.name || regionId} 맛집`);
    setListItems(getRestaurantsByRegion(regionId));
    setCurrentView("list");
    setActiveTab("region");
  };

  // 빌딩 선택
  const handleBuildingSelect = (buildingId: string) => {
    const building = buildings.find((b) => b.id === buildingId);
    setListTitle(buildingId === "전체" ? "전체 빌딩" : `${building?.name || buildingId} 맛집`);
    setListItems(getRestaurantsByBuilding(buildingId));
    setCurrentView("list");
    setActiveTab("building");
  };

  // 맛집 선택
  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setPreviousView(currentView);
    setSelectedRestaurant(restaurant);
    setCurrentView("detail");
  };

  // 뒤로가기
  const handleBack = () => {
    if (currentView === "detail") {
      if (previousView === "home") {
        setCurrentView("home");
        setActiveTab("home");
      } else if (previousView === "recommend") {
        setCurrentView("recommend");
        setActiveTab("recommend");
      } else {
        setCurrentView("list");
      }
      setSelectedRestaurant(null);
    } else {
      setCurrentView("home");
      setActiveTab("home");
    }
  };

  // 렌더링
  if (currentView === "detail" && selectedRestaurant) {
    return (
      <>
        <RestaurantDetail restaurant={selectedRestaurant} onBack={handleBack} />
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        <CategorySheet
          open={categorySheetOpen}
          onOpenChange={setCategorySheetOpen}
          title="카테고리 선택"
          options={categories}
          onSelect={handleCategorySelect}
        />
        <CategorySheet
          open={regionSheetOpen}
          onOpenChange={setRegionSheetOpen}
          title="지역 선택"
          options={regions}
          onSelect={handleRegionSelect}
        />
        <BuildingSheet
          open={buildingSheetOpen}
          onOpenChange={setBuildingSheetOpen}
          options={buildings}
          onSelect={handleBuildingSelect}
        />
      </>
    );
  }

  if (currentView === "recommend") {
    return (
      <>
        <RecommendationView onSelectRestaurant={handleRestaurantSelect} />
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        <CategorySheet
          open={categorySheetOpen}
          onOpenChange={setCategorySheetOpen}
          title="카테고리 선택"
          options={categories}
          onSelect={handleCategorySelect}
        />
        <CategorySheet
          open={regionSheetOpen}
          onOpenChange={setRegionSheetOpen}
          title="지역 선택"
          options={regions}
          onSelect={handleRegionSelect}
        />
        <BuildingSheet
          open={buildingSheetOpen}
          onOpenChange={setBuildingSheetOpen}
          options={buildings}
          onSelect={handleBuildingSelect}
        />
      </>
    );
  }

  if (currentView === "list") {
    return (
      <>
        <RestaurantList
          title={listTitle}
          restaurants={listItems}
          onBack={handleBack}
          onSelect={handleRestaurantSelect}
        />
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        <CategorySheet
          open={categorySheetOpen}
          onOpenChange={setCategorySheetOpen}
          title="카테고리 선택"
          options={categories}
          onSelect={handleCategorySelect}
        />
        <CategorySheet
          open={regionSheetOpen}
          onOpenChange={setRegionSheetOpen}
          title="지역 선택"
          options={regions}
          onSelect={handleRegionSelect}
        />
        <BuildingSheet
          open={buildingSheetOpen}
          onOpenChange={setBuildingSheetOpen}
          options={buildings}
          onSelect={handleBuildingSelect}
        />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen pb-20">
        {/* 헤더 */}
        <header className="bg-gradient-to-r from-red-600 to-red-500 safe-area-top">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="w-10" />
            <h1 className="text-xl font-bold text-white text-center">
              🏛️ 여의도 한끼
            </h1>
            {user ? (
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                title={`${user.name}님 (로그아웃)`}
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                title="로그인"
              >
                <User className="w-5 h-5" />
              </button>
            )}
          </div>
          {/* 검색 바 */}
          <div className="px-4 pb-3">
            <SearchBar onSelect={handleRestaurantSelect} />
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <div className="p-4 space-y-4">
          {/* 퀵 카테고리 */}
          <section className="bg-card rounded-xl p-4 shadow-sm">
            <h2 className="text-base font-semibold mb-3 text-foreground">카테고리</h2>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="secondary"
                    className="flex-col h-auto py-3 px-4 min-w-[70px] bg-muted hover:bg-muted/80 transition-all hover:scale-[1.05] active:scale-[0.98]"
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <span className="text-xl mb-1">{category.icon}</span>
                    <span className="text-xs">{category.name}</span>
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>

          {/* 인기 맛집 */}
          <section className="bg-card rounded-xl p-4 shadow-sm">
            <h2 className="text-base font-semibold mb-3 text-foreground">인기 맛집</h2>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {popularRestaurants.map((restaurant, index) => (
                  <RestaurantCard
                    key={`${restaurant.이름}-${index}`}
                    restaurant={restaurant}
                    variant="horizontal"
                    showCategory={true}
                    onClick={() => handleRestaurantSelect(restaurant)}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>

          {/* 지역별 맛집 */}
          <section className="bg-card rounded-xl p-4 shadow-sm">
            <h2 className="text-base font-semibold mb-3 text-foreground">지역별 맛집</h2>
            <ScrollArea className="w-full mb-3">
              <div className="flex gap-2 pb-2">
                {regions.map((region) => (
                  <Button
                    key={region.id}
                    variant={selectedRegion === region.id ? "default" : "secondary"}
                    size="sm"
                    className="rounded-full transition-all hover:scale-[1.05] active:scale-[0.95]"
                    onClick={() => setSelectedRegion(region.id)}
                  >
                    {region.icon} {region.name}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <div className="space-y-3">
              {regionRestaurants.length > 0 ? (
                regionRestaurants.map((restaurant, index) => (
                  <RestaurantCard
                    key={`${restaurant.이름}-${index}`}
                    restaurant={restaurant}
                    onClick={() => handleRestaurantSelect(restaurant)}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  등록된 맛집이 없습니다.
                </p>
              )}
            </div>
            {regionRestaurants.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => handleRegionSelect(selectedRegion)}
              >
                {selectedRegion === "전체" ? "전체" : regions.find(r => r.id === selectedRegion)?.name} 맛집 더보기
              </Button>
            )}
          </section>
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* 시트들 */}
      <CategorySheet
        open={categorySheetOpen}
        onOpenChange={setCategorySheetOpen}
        title="카테고리 선택"
        options={categories}
        onSelect={handleCategorySelect}
      />
      <CategorySheet
        open={regionSheetOpen}
        onOpenChange={setRegionSheetOpen}
        title="지역 선택"
        options={regions}
        onSelect={handleRegionSelect}
      />
      <BuildingSheet
        open={buildingSheetOpen}
        onOpenChange={setBuildingSheetOpen}
        options={buildings}
        onSelect={handleBuildingSelect}
      />

      {/* 로그인/회원가입 모달 */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(userData) => setUser(userData)}
      />
    </>
  );
}
