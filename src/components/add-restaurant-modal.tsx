"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  MapPin,
  Star,
  Phone,
  Clock,
  ExternalLink,
  ChevronLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface AddRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SearchResult {
  place_id: string;
  name: string;
  description: string;
  secondary_text: string;
}

interface PlaceDetails {
  place_id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: number | null;
  phoneNumber: string | null;
  openingHours: string[];
  isOpen: boolean | undefined;
  photos: string[];
  website: string | null;
  googleMapUrl: string | null;
  businessStatus: string;
  region: "서여의도" | "동여의도";
}

type Step = "search" | "details" | "confirm";

const categories = [
  { id: "한식", name: "한식", icon: "🍚" },
  { id: "양식", name: "양식", icon: "🥩" },
  { id: "중식", name: "중식", icon: "🥟" },
  { id: "일식", name: "일식", icon: "🍣" },
  { id: "동남아식", name: "동남아식", icon: "🍜" },
];

const regions = [
  { id: "서여의도", name: "서여의도", description: "국회의사당 쪽" },
  { id: "동여의도", name: "동여의도", description: "여의도역, IFC 쪽" },
];

export function AddRestaurantModal({
  isOpen,
  onClose,
  onSuccess,
}: AddRestaurantModalProps) {
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 등록 폼 상태
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [feature, setFeature] = useState("");

  // 검색 디바운스
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/places-search?q=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.predictions || []);
        }
      } catch {
        console.error("Search error");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 장소 선택
  const handleSelectPlace = useCallback(async (placeId: string) => {
    setIsLoadingDetails(true);
    setError("");

    try {
      const res = await fetch("/api/place-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId }),
      });
      const data = await res.json();

      if (data.success) {
        setSelectedPlace(data.data);
        setSelectedRegion(data.data.region);
        setStep("details");
      } else {
        setError(data.error || "장소 정보를 가져올 수 없습니다.");
      }
    } catch {
      setError("장소 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // 맛집 등록
  const handleSubmit = async () => {
    if (!selectedPlace || !selectedCategory || !selectedRegion) {
      setError("카테고리와 지역을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/custom-restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: selectedPlace.place_id,
          name: selectedPlace.name,
          address: selectedPlace.address,
          category: selectedCategory,
          feature,
          region: selectedRegion,
          coordinates: selectedPlace.coordinates,
          google_rating: selectedPlace.rating,
          google_reviews_count: selectedPlace.reviewCount,
          price_level: selectedPlace.priceLevel,
          phone_number: selectedPlace.phoneNumber,
          opening_hours: selectedPlace.openingHours,
          photos: selectedPlace.photos,
          website: selectedPlace.website,
          google_map_url: selectedPlace.googleMapUrl,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStep("confirm");
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 1500);
      } else {
        setError(data.error || "맛집 등록에 실패했습니다.");
      }
    } catch {
      setError("맛집 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("search");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedPlace(null);
    setSelectedCategory("");
    setSelectedRegion("");
    setFeature("");
    setError("");
    onClose();
  };

  const handleBack = () => {
    if (step === "details") {
      setStep("search");
      setSelectedPlace(null);
      setSelectedCategory("");
      setFeature("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step === "details" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <DialogTitle>
              {step === "search" && "맛집 검색"}
              {step === "details" && "맛집 정보 확인"}
              {step === "confirm" && "등록 완료"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Step 1: 검색 */}
        {step === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="맛집 이름으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
              )}
            </div>

            {/* 검색 결과 */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSelectPlace(result.place_id)}
                  disabled={isLoadingDetails}
                  className="w-full p-3 text-left rounded-lg border hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <p className="font-medium">{result.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {result.secondary_text}
                  </p>
                </button>
              ))}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <p className="text-center text-muted-foreground py-8">
                  검색 결과가 없습니다.
                </p>
              )}

              {searchQuery.length < 2 && (
                <p className="text-center text-muted-foreground py-8">
                  맛집 이름을 2자 이상 입력해주세요.
                </p>
              )}
            </div>

            {isLoadingDetails && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>정보를 불러오는 중...</span>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {/* Step 2: 상세 정보 */}
        {step === "details" && selectedPlace && (
          <div className="space-y-4">
            {/* 대표 이미지 */}
            {selectedPlace.photos.length > 0 && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={selectedPlace.photos[0]}
                  alt={selectedPlace.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* 기본 정보 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{selectedPlace.name}</h3>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{selectedPlace.address}</span>
              </div>

              {selectedPlace.rating && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{selectedPlace.rating}</span>
                  {selectedPlace.reviewCount && (
                    <span className="text-muted-foreground">
                      ({selectedPlace.reviewCount.toLocaleString()}개 리뷰)
                    </span>
                  )}
                </div>
              )}

              {selectedPlace.phoneNumber && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{selectedPlace.phoneNumber}</span>
                </div>
              )}

              {selectedPlace.openingHours.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mt-0.5" />
                  <div className="space-y-0.5">
                    {selectedPlace.openingHours.slice(0, 3).map((hour, idx) => (
                      <p key={idx}>{hour}</p>
                    ))}
                    {selectedPlace.openingHours.length > 3 && (
                      <p className="text-xs">...</p>
                    )}
                  </div>
                </div>
              )}

              {selectedPlace.googleMapUrl && (
                <a
                  href={selectedPlace.googleMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Google Maps에서 보기
                </a>
              )}
            </div>

            {/* 카테고리 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                카테고리 <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.icon} {cat.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 지역 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                지역 <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                {regions.map((reg) => (
                  <Badge
                    key={reg.id}
                    variant={selectedRegion === reg.id ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => setSelectedRegion(reg.id)}
                  >
                    {reg.name}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {regions.find((r) => r.id === selectedRegion)?.description}
              </p>
            </div>

            {/* 특징/메모 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">특징/메모 (선택)</label>
              <Input
                placeholder="예: 점심특선 추천, 웨이팅 있음"
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
                maxLength={100}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedCategory || !selectedRegion}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  등록 중...
                </>
              ) : (
                "맛집 등록하기"
              )}
            </Button>
          </div>
        )}

        {/* Step 3: 완료 */}
        {step === "confirm" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">등록 완료!</h3>
            <p className="text-muted-foreground">
              맛집이 성공적으로 등록되었습니다.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
