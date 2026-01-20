"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { User, LogOut, Key, ChevronDown, Trash2, Plus, History } from "lucide-react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useRealTimeRatings, sortByRealTimeRating } from "@/hooks/useRealTimeRatings";
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
import { DeleteAccountModal } from "@/components/delete-account-modal";
import { RecommendationView } from "@/components/recommendation-view";
import { SearchBar } from "@/components/search-bar";
import { FortuneModal } from "@/components/fortune-modal";
import { FortuneResultView } from "@/components/fortune-result";
import { AddRestaurantModal } from "@/components/add-restaurant-modal";
import { RestaurantHistoryList } from "@/components/restaurant-history";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { TopBuildings } from "@/components/top-buildings";
import { BuildingRankingList } from "@/components/building-ranking-list";
import { PopularRestaurantsList } from "@/components/popular-restaurants-list";
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

type View = "home" | "list" | "detail" | "recommend" | "fortune" | "history" | "popular" | "buildingRanking";
type TabType = "home" | "recommend" | "category" | "region" | "building" | "fortune";

interface UserInfo {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [currentView, setCurrentView] = useState<View>("home");
  const [previousView, setPreviousView] = useState<View>("home");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [listTitle, setListTitle] = useState("");
  const [listItems, setListItems] = useState<Restaurant[]>([]);
  const [listType, setListType] = useState<"category" | "building" | "region">("category");
  const [buildingRegion, setBuildingRegion] = useState<string | undefined>(undefined);

  // 커스텀 맛집 (빌딩 랭킹용)
  const [customRestaurantsForRanking, setCustomRestaurantsForRanking] = useState<Restaurant[]>([]);

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
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 운세 상태
  const [fortuneModalOpen, setFortuneModalOpen] = useState(false);
  const [fortuneResult, setFortuneResult] = useState<FortuneResult | null>(null);

  // 맛집 등록 모달 상태
  const [addRestaurantModalOpen, setAddRestaurantModalOpen] = useState(false);

  // 실시간 평점
  const { ratings: realTimeRatings } = useRealTimeRatings();

  // 스와이프 뒤로가기 (홈이 아닌 화면에서만 활성화)
  const handleSwipeBack = useCallback(() => {
    if (currentView === "detail") {
      if (previousView === "home") {
        setCurrentView("home");
        setActiveTab("home");
      } else if (previousView === "recommend") {
        setCurrentView("recommend");
        setActiveTab("recommend");
      } else if (previousView === "fortune") {
        setCurrentView("fortune");
        setActiveTab("fortune");
      } else {
        setCurrentView("list");
      }
      setSelectedRestaurant(null);
    } else if (currentView !== "home") {
      setCurrentView("home");
      setActiveTab("home");
    }
  }, [currentView, previousView]);

  useSwipeBack({
    onSwipeBack: handleSwipeBack,
    enabled: currentView !== "home",
    threshold: 80,
    edgeWidth: 25,
  });

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

  // 빌딩 랭킹용 커스텀 맛집 로드
  useEffect(() => {
    const loadCustomRestaurants = async () => {
      try {
        const res = await fetch("/api/custom-restaurants");
        const data = await res.json();
        if (data.success && data.data) {
          setCustomRestaurantsForRanking(data.data.map(convertCustomToRestaurant));
        }
      } catch (error) {
        console.error("Failed to load custom restaurants for ranking:", error);
      }
    };
    loadCustomRestaurants();
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

  // 인기 맛집 - 3시간마다 카테고리 로테이션, 하루마다 순위 로테이션
  const [popularRestaurants, setPopularRestaurants] = useState(() => getPopularRestaurants());

  // 3시간마다 인기맛집 갱신
  useEffect(() => {
    const updatePopular = () => {
      setPopularRestaurants(getPopularRestaurants());
    };

    // 다음 3시간 단위까지 남은 시간 계산
    const now = new Date();
    const currentSlot = Math.floor(now.getHours() / 3);
    const nextSlotHour = (currentSlot + 1) * 3;
    const nextUpdate = new Date(now);
    nextUpdate.setHours(nextSlotHour, 0, 0, 0);
    if (nextSlotHour >= 24) {
      nextUpdate.setDate(nextUpdate.getDate() + 1);
      nextUpdate.setHours(0, 0, 0, 0);
    }
    const msUntilNext = nextUpdate.getTime() - now.getTime();

    // 첫 업데이트 예약
    const timeout = setTimeout(() => {
      updatePopular();
      // 이후 3시간마다 반복
      const interval = setInterval(updatePopular, 3 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, msUntilNext);

    return () => clearTimeout(timeout);
  }, []);

  // 지역별 맛집 (실시간 평점 기준 정렬)
  const regionRestaurants = useMemo(() => {
    const restaurants = getRestaurantsByRegion(selectedRegion);
    return sortByRealTimeRating(restaurants, realTimeRatings).slice(0, 6);
  }, [selectedRegion, realTimeRatings]);

  // 운세 모달 상태 변경 핸들러
  const handleFortuneModalChange = (open: boolean) => {
    setFortuneModalOpen(open);
    // 모달이 닫힐 때 (X 버튼 클릭) 운세 화면으로 전환
    if (!open && activeTab === "fortune") {
      setCurrentView("fortune");
    }
  };

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

  // 주소에서 빌딩명 추출 (공백 제거 후 비교)
  const extractBuildingFromAddress = (address: string): string | undefined => {
    const buildingNames = [
      "IFC몰", "더현대서울", "63빌딩", "파이낸스타워", "원센티널",
      "브라이튼여의도", "더샵아일랜드파크", "CCMM빌딩", "홍우빌딩", "백상빌딩",
      "아일렉스빌딩", "국회대로상가", "여의도백화점", "오륜빌딩", "정우빌딩",
      "BNK금융타워", "씨티플라자", "유성빌딩", "미원빌딩", "신송빌딩",
      "경호빌딩", "익스콘벤처타워", "율촌빌딩", "삼도오피스텔"
    ];
    // 주소에서 공백 제거하여 비교 (Google Places 주소에 "BNK 금융타워"처럼 공백이 들어가는 경우 대응)
    const normalizedAddress = address.replace(/\s/g, "");
    for (const building of buildingNames) {
      const normalizedBuilding = building.replace(/\s/g, "");
      if (normalizedAddress.includes(normalizedBuilding)) {
        return building;
      }
    }
    return undefined;
  };

  // 커스텀 맛집을 Restaurant 형식으로 변환
  const convertCustomToRestaurant = (custom: {
    name: string;
    address: string;
    category: string;
    feature?: string;
    region: string;
    google_rating?: number;
    building?: string;
  }): Restaurant => ({
    이름: custom.name,
    카테고리: custom.category as Restaurant["카테고리"],
    평점: custom.google_rating || 0,
    특징: custom.feature || "",
    지역: custom.region as Restaurant["지역"],
    주소: custom.address,
    빌딩: custom.building || extractBuildingFromAddress(custom.address),
  });

  // 커스텀 맛집 가져오기
  const fetchCustomRestaurants = async (): Promise<Restaurant[]> => {
    try {
      const res = await fetch("/api/custom-restaurants");
      const data = await res.json();
      if (data.success && data.data) {
        return data.data.map(convertCustomToRestaurant);
      }
      return [];
    } catch {
      return [];
    }
  };

  // 카테고리 선택 (실시간 평점 기준 정렬)
  const handleCategorySelect = async (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    setListTitle(categoryId === "전체" ? "전체 맛집" : `${category?.name || categoryId} 맛집`);

    // 기존 데이터
    const staticRestaurants = getRestaurantsByCategory(categoryId);

    // 커스텀 맛집 가져오기
    const customRestaurants = await fetchCustomRestaurants();
    const filteredCustom = categoryId === "전체"
      ? customRestaurants
      : customRestaurants.filter((r) => r.카테고리 === categoryId);

    // 중복 제거 (이름 기준)
    const existingNames = new Set(staticRestaurants.map((r) => r.이름));
    const uniqueCustom = filteredCustom.filter((r) => !existingNames.has(r.이름));

    const combined = [...staticRestaurants, ...uniqueCustom];
    setListItems(sortByRealTimeRating(combined, realTimeRatings));
    setListType("category");
    setBuildingRegion(undefined);
    setCurrentView("list");
    setActiveTab("category");
  };

  // 지역 선택 (실시간 평점 기준 정렬)
  const handleRegionSelect = async (regionId: string) => {
    const region = regions.find((r) => r.id === regionId);
    setListTitle(regionId === "전체" ? "전체 지역" : `${region?.name || regionId} 맛집`);

    // 기존 데이터
    const staticRestaurants = getRestaurantsByRegion(regionId);

    // 커스텀 맛집 가져오기
    const customRestaurants = await fetchCustomRestaurants();
    const filteredCustom = regionId === "전체"
      ? customRestaurants
      : customRestaurants.filter((r) => r.지역 === regionId);

    // 중복 제거 (이름 기준)
    const existingNames = new Set(staticRestaurants.map((r) => r.이름));
    const uniqueCustom = filteredCustom.filter((r) => !existingNames.has(r.이름));

    const combined = [...staticRestaurants, ...uniqueCustom];
    setListItems(sortByRealTimeRating(combined, realTimeRatings));
    setListType("region");
    setBuildingRegion(undefined);
    setCurrentView("list");
    setActiveTab("region");
  };

  // 빌딩 선택 (실시간 평점 기준 정렬)
  const handleBuildingSelect = async (buildingId: string) => {
    const building = buildings.find((b) => b.id === buildingId);
    setListTitle(buildingId === "전체" ? "전체 빌딩" : `${building?.name || buildingId} 맛집`);

    // 기존 데이터
    const staticRestaurants = getRestaurantsByBuilding(buildingId);

    // 커스텀 맛집 가져오기
    const customRestaurants = await fetchCustomRestaurants();
    const filteredCustom = buildingId === "전체"
      ? customRestaurants
      : customRestaurants.filter((r) => r.빌딩 === building?.name);

    // 중복 제거 (이름 기준)
    const existingNames = new Set(staticRestaurants.map((r) => r.이름));
    const uniqueCustom = filteredCustom.filter((r) => !existingNames.has(r.이름));

    const combined = [...staticRestaurants, ...uniqueCustom];
    setListItems(sortByRealTimeRating(combined, realTimeRatings));
    setListType("building");
    setBuildingRegion(building?.지역);
    setCurrentView("list");
    setActiveTab("building");
  };

  // 맛집 선택
  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setPreviousView(currentView);
    setSelectedRestaurant(restaurant);
    setCurrentView("detail");
  };

  // 인기맛집 전체보기
  const handleShowAllPopular = () => {
    setCurrentView("popular");
  };

  // 맛빌딩 전체보기
  const handleShowAllBuildings = () => {
    setCurrentView("buildingRanking");
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
      } else if (previousView === "fortune") {
        setCurrentView("fortune");
        setActiveTab("fortune");
      } else if (previousView === "popular") {
        setCurrentView("popular");
      } else if (previousView === "buildingRanking") {
        setCurrentView("buildingRanking");
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
        <RestaurantDetail restaurant={selectedRestaurant} onBack={handleBack} user={user} />
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
        <FortuneModal
          open={fortuneModalOpen}
          onOpenChange={handleFortuneModalChange}
          onSubmit={handleFortuneSubmit}
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
        <FortuneModal
          open={fortuneModalOpen}
          onOpenChange={handleFortuneModalChange}
          onSubmit={handleFortuneSubmit}
        />
      </>
    );
  }

  // 히스토리에서 맛집 선택 시 상세화면으로 이동
  const handleHistoryRestaurantSelect = async (placeId: string) => {
    try {
      // 커스텀 맛집 조회
      const res = await fetch("/api/custom-restaurants");
      const data = await res.json();
      if (data.success && data.data) {
        const found = data.data.find((r: { place_id: string }) => r.place_id === placeId);
        if (found) {
          // Restaurant 형태로 변환
          const restaurant: Restaurant = {
            이름: found.name,
            카테고리: found.category,
            지역: found.region || "서여의도",
            주소: found.address,
            특징: found.feature || "",
            평점: found.google_rating || undefined,
          };
          setPreviousView("history");
          setSelectedRestaurant(restaurant);
          setCurrentView("detail");
        }
      }
    } catch (error) {
      console.error("맛집 조회 실패:", error);
    }
  };

  // 히스토리 뷰
  if (currentView === "history") {
    return (
      <RestaurantHistoryList
        onBack={() => {
          setCurrentView("home");
          setActiveTab("home");
        }}
        onSelectRestaurant={handleHistoryRestaurantSelect}
      />
    );
  }

  // 인기맛집 전체 리스트 뷰
  if (currentView === "popular") {
    return (
      <>
        <PopularRestaurantsList
          onBack={() => {
            setCurrentView("home");
            setActiveTab("home");
          }}
          onSelect={(restaurant) => {
            setPreviousView("popular");
            setSelectedRestaurant(restaurant);
            setCurrentView("detail");
          }}
          realTimeRatings={realTimeRatings}
        />
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </>
    );
  }

  // 맛빌딩 랭킹 전체 리스트 뷰
  if (currentView === "buildingRanking") {
    return (
      <>
        <BuildingRankingList
          onBack={() => {
            setCurrentView("home");
            setActiveTab("home");
          }}
          onSelectBuilding={handleBuildingSelect}
          customRestaurants={customRestaurantsForRanking}
        />
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
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
          onOpenChange={handleFortuneModalChange}
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
          realTimeRatings={realTimeRatings}
          listType={listType}
          buildingRegion={buildingRegion}
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
      <PullToRefresh>
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
                    {/* 관리자 전용: 등록 히스토리 */}
                    {user.is_admin && (
                      <button
                        onClick={() => {
                          setCurrentView("history");
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <History className="w-4 h-4" />
                        등록 히스토리
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setDeleteAccountModalOpen(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      계정 삭제
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
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

          {/* 인기 맛집 - 배치 로딩 적용 (실시간 평점 표시) */}
          <PopularRestaurants
            restaurants={popularRestaurants}
            onSelect={handleRestaurantSelect}
            onShowAll={handleShowAllPopular}
            realTimeRatings={realTimeRatings}
          />

          {/* 오늘의 맛빌딩 */}
          <TopBuildings onSelect={handleBuildingSelect} onShowAll={handleShowAllBuildings} customRestaurants={customRestaurantsForRanking} />

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
                    realTimeRating={realTimeRatings[restaurant.이름]}
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
      </PullToRefresh>

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

      {/* 계정 삭제 모달 */}
      <DeleteAccountModal
        isOpen={deleteAccountModalOpen}
        onClose={() => setDeleteAccountModalOpen(false)}
        onSuccess={() => setUser(null)}
      />

      {/* 운세 모달 */}
      <FortuneModal
        open={fortuneModalOpen}
        onOpenChange={handleFortuneModalChange}
        onSubmit={handleFortuneSubmit}
      />

      {/* 맛집 등록 모달 */}
      <AddRestaurantModal
        isOpen={addRestaurantModalOpen}
        onClose={() => setAddRestaurantModalOpen(false)}
        onSuccess={() => {
          // 등록 성공 시 처리 (필요하면 목록 새로고침 등)
        }}
      />

      {/* 맛집 등록 플로팅 버튼 (관리자 또는 테스트 계정만) */}
      {user && (user.is_admin || user.email === "test@test.com") && (
        <button
          onClick={() => setAddRestaurantModalOpen(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40"
          title="맛집 등록"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
