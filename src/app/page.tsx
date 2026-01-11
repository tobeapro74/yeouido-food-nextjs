"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { User, LogOut, Key, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BottomNav } from "@/components/bottom-nav";
import { RestaurantCard } from "@/components/restaurant-card";
import { RestaurantList } from "@/components/restaurant-list";
import { PopularRestaurants } from "@/components/popular-restaurants";
import { RestaurantDetail } from "@/components/restaurant-detail";
import { CategorySheet } from "@/components/category-sheet";
import { BuildingSheet } from "@/components/building-sheet";
import { AuthModal } from "@/components/auth-modal";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { RecommendationView } from "@/components/recommendation-view";
import { SearchBar } from "@/components/search-bar";
import { FortuneModal } from "@/components/fortune-modal";
import { FortuneResultView } from "@/components/fortune-result";
import { calculateFortune, FortuneResult, Gender, MaritalStatus } from "@/lib/fortune";
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

type View = "home" | "list" | "detail" | "recommend" | "fortune";
type TabType = "home" | "recommend" | "category" | "region" | "building" | "fortune";

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
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 운세 상태
  const [fortuneModalOpen, setFortuneModalOpen] = useState(false);
  const [fortuneResult, setFortuneResult] = useState<FortuneResult | null>(null);

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

  // 사용자 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setUserMenuOpen(false);
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
    } else if (tab === "fortune") {
      // 운세 결과가 있으면 결과 화면, 없으면 입력 모달
      if (fortuneResult) {
        setCurrentView("fortune");
        setActiveTab("fortune");
      } else {
        setFortuneModalOpen(true);
        setActiveTab("fortune");
      }
    } else if (tab === "category") {
      setCategorySheetOpen(true);
    } else if (tab === "region") {
      setRegionSheetOpen(true);
    } else if (tab === "building") {
      setBuildingSheetOpen(true);
    }
  };

  // 운세 계산 처리
  const handleFortuneSubmit = (data: {
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    gender: Gender;
    maritalStatus: MaritalStatus;
  }) => {
    const result = calculateFortune(
      data.birthYear,
      data.birthMonth,
      data.birthDay,
      data.gender,
      data.maritalStatus
    );
    setFortuneResult(result);
    setFortuneModalOpen(false);
    setCurrentView("fortune");
  };

  // 운세 다시하기
  const handleFortuneReset = () => {
    setFortuneResult(null);
    setFortuneModalOpen(true);
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

  if (currentView === "fortune") {
    return (
      <>
        <div className="min-h-screen pb-20">
          <header className="bg-gradient-to-r from-purple-600 to-pink-500 safe-area-top">
            <div className="px-4 py-3 flex items-center justify-center">
              <h1 className="text-xl font-bold text-white">
                🔮 오늘의 맛집 운세
              </h1>
            </div>
          </header>
          <div className="p-4">
            {fortuneResult ? (
              <FortuneResultView
                result={fortuneResult}
                onReset={handleFortuneReset}
                onSelectRestaurant={handleRestaurantSelect}
              />
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">운세 정보를 입력해주세요</p>
                <button
                  onClick={() => setFortuneModalOpen(true)}
                  className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                  운세 보기
                </button>
              </div>
            )}
          </div>
        </div>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        <FortuneModal
          open={fortuneModalOpen}
          onOpenChange={setFortuneModalOpen}
          onSubmit={handleFortuneSubmit}
        />
        <CategorySheet
          open={categorySheetOpen}
          onOpenChange={setCategorySheetOpen}
          title="카테고리 선택"
          options={categories}
          onSelect={handleCategorySelect}
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
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  title={`${user.name}님`}
                >
                  <User className="w-5 h-5" />
                  <ChevronDown className="w-3 h-3 absolute bottom-0 right-0" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 bg-card rounded-lg shadow-lg border border-border min-w-[160px] py-1 z-50">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user.name}님</p>
                    </div>
                    <button
                      onClick={() => {
                        setChangePasswordModalOpen(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      비밀번호 변경
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
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
        </header>

        {/* 메인 콘텐츠 */}
        <div className="p-4 space-y-4">
          {/* 검색 바 */}
          <SearchBar onSelect={handleRestaurantSelect} />

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

          {/* 인기 맛집 - 배치 로딩 적용 */}
          <PopularRestaurants
            restaurants={popularRestaurants}
            onSelect={handleRestaurantSelect}
          />

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

      {/* 비밀번호 변경 모달 */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
      />

      {/* 운세 모달 */}
      <FortuneModal
        open={fortuneModalOpen}
        onOpenChange={setFortuneModalOpen}
        onSubmit={handleFortuneSubmit}
      />
    </>
  );
}
