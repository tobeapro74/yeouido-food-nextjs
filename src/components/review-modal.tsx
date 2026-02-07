"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Star, X, Camera, Loader2, ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { Review } from "@/lib/types";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  onSuccess: () => void;
  editReview?: Review | null; // 수정할 리뷰 (없으면 새 리뷰 작성)
}

const mealTypes = ["아침/브런치", "점심 식사", "저녁 식사", "야식", "기타"];

export function ReviewModal({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  onSuccess,
  editReview,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [atmosphereRating, setAtmosphereRating] = useState(0);
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [mealType, setMealType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useWebFallback, setUseWebFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!editReview;

  // 네이티브 플러그인 사용 가능 여부 체크
  const checkNativeAvailable = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    try {
      // 플러그인이 제대로 로드되었는지 확인
      await CapacitorCamera.checkPermissions();
      return true;
    } catch (error) {
      console.log("Native camera plugin not available, using web fallback", error);
      return false;
    }
  }, []);

  // 컴포넌트 마운트 시 네이티브 플러그인 사용 가능 여부 체크
  useEffect(() => {
    if (Capacitor.isNativePlatform() && !useWebFallback) {
      checkNativeAvailable().then((available) => {
        if (!available) {
          setUseWebFallback(true);
        }
      });
    }
  }, [checkNativeAvailable, useWebFallback]);

  const isNative = Capacitor.isNativePlatform() && !useWebFallback;

  // 수정 모드일 때 기존 데이터로 폼 초기화 및 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      if (editReview) {
        setRating(editReview.rating);
        setFoodRating(editReview.food_rating || 0);
        setServiceRating(editReview.service_rating || 0);
        setAtmosphereRating(editReview.atmosphere_rating || 0);
        setContent(editReview.content || "");
        setPhotos(editReview.photos || []);
        setMealType(editReview.meal_type || "");
      } else {
        resetForm();
      }
      // 배경 스크롤 방지
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, editReview]);

  const resetForm = () => {
    setRating(0);
    setFoodRating(0);
    setServiceRating(0);
    setAtmosphereRating(0);
    setContent("");
    setPhotos([]);
    setMealType("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 에러 메시지 표시 (3초 후 자동 숨김)
  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 3000);
  }, []);

  // 카메라/갤러리 권한 확인 함수
  const checkCameraPermissions = async (source: CameraSource): Promise<boolean> => {
    try {
      const permissions = await CapacitorCamera.checkPermissions();

      if (source === CameraSource.Camera) {
        if (permissions.camera === 'denied') {
          showError("카메라 권한이 필요합니다. 설정에서 허용해주세요.");
          return false;
        }
        if (permissions.camera === 'prompt' || permissions.camera === 'prompt-with-rationale') {
          const requested = await CapacitorCamera.requestPermissions({ permissions: ['camera'] });
          if (requested.camera === 'denied') {
            showError("카메라 권한이 필요합니다. 설정에서 허용해주세요.");
            return false;
          }
        }
      } else if (source === CameraSource.Photos) {
        if (permissions.photos === 'denied') {
          showError("사진 라이브러리 권한이 필요합니다. 설정에서 허용해주세요.");
          return false;
        }
        if (permissions.photos === 'prompt' || permissions.photos === 'prompt-with-rationale') {
          const requested = await CapacitorCamera.requestPermissions({ permissions: ['photos'] });
          if (requested.photos === 'denied') {
            showError("사진 라이브러리 권한이 필요합니다. 설정에서 허용해주세요.");
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      console.error("Permission check error:", error);
      // 플러그인 에러 시 웹 폴백으로 전환
      setUseWebFallback(true);
      return false;
    }
  };

  // Capacitor Camera로 사진 촬영 또는 갤러리 선택
  const handleNativePhoto = async (source: CameraSource) => {
    if (photos.length >= 4) return;

    setShowPhotoOptions(false);

    // 먼저 권한 확인
    const hasPermission = await checkCameraPermissions(source);
    if (!hasPermission) {
      return;
    }

    setIsUploading(true);

    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source,
        width: 800,
        height: 800,
        correctOrientation: true,
        saveToGallery: false,
        // iPad에서 카메라/갤러리 UI가 popover로 표시되어야 함
        presentationStyle: 'popover',
      });

      if (image.dataUrl) {
        // Cloudinary에 업로드
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: image.dataUrl }),
        });
        const data = await res.json();

        if (data.success && data.url) {
          setPhotos((prev) => [...prev, data.url]);
        } else {
          showError("사진 업로드에 실패했습니다. 다시 시도해주세요.");
        }
      }
    } catch (error: unknown) {
      // 사용자가 취소한 경우는 에러 메시지 표시하지 않음
      const errMsg = error instanceof Error ? error.message : String(error);
      const isCancelled =
        errMsg.toLowerCase().includes("cancel") ||
        errMsg.toLowerCase().includes("user denied") ||
        errMsg.toLowerCase().includes("no image picked") ||
        errMsg.includes("User cancelled");

      if (!isCancelled) {
        console.error("Camera error:", error);
        // 플러그인 에러 또는 카메라 사용 불가 시 웹 폴백으로 전환
        if (errMsg.includes("Camera not available") ||
            errMsg.includes("no camera") ||
            errMsg.includes("unavailable")) {
          // 카메라 사용 불가 시 갤러리만 안내
          showError("카메라를 사용할 수 없습니다. 갤러리를 이용해주세요.");
        } else if (errMsg.includes("not implemented") ||
                   errMsg.includes("plugin") ||
                   errMsg.includes("undefined") ||
                   errMsg.includes("null")) {
          // 플러그인 에러 시 웹 폴백으로 자동 전환
          console.log("Switching to web fallback due to plugin error");
          setUseWebFallback(true);
          // 웹 파일 선택기 자동 트리거
          setTimeout(() => fileInputRef.current?.click(), 100);
        } else {
          // 기타 에러 시 웹 폴백으로 전환
          setUseWebFallback(true);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  // 웹용 파일 input 핸들러
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || photos.length >= 4) return;

    setIsUploading(true);

    for (let i = 0; i < Math.min(files.length, 4 - photos.length); i++) {
      const file = files[i];
      try {
        // 이미지 리사이즈
        const resized = await resizeImage(file, 800, 0.6);

        // Cloudinary에 업로드
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: resized }),
        });
        const data = await res.json();

        if (data.success && data.url) {
          setPhotos((prev) => [...prev, data.url]);
        }
      } catch (error) {
        console.error("Upload error:", error);
      }
    }

    setIsUploading(false);
    // input 초기화 (같은 파일 다시 선택 가능하게)
    if (e.target) {
      e.target.value = "";
    }
  };

  const resizeImage = (file: File, maxSize: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      // URL.createObjectURL 사용 (iOS Safari 호환)
      const objectUrl = URL.createObjectURL(file);
      const img = document.createElement("img");

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // 비율 유지하면서 리사이즈
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height / width) * maxSize);
              width = maxSize;
            } else {
              width = Math.round((width / height) * maxSize);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Canvas context not available"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          URL.revokeObjectURL(objectUrl);
          resolve(dataUrl);
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Image load failed"));
      };

      // iOS Safari에서는 blob URL에 crossOrigin 설정하면 안됨
      img.src = objectUrl;
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.warning("별점을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditMode ? `/api/reviews/${editReview._id}` : "/api/reviews";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          rating,
          food_rating: foodRating || undefined,
          service_rating: serviceRating || undefined,
          atmosphere_rating: atmosphereRating || undefined,
          content,
          photos: photos.length > 0 ? photos : undefined,
          meal_type: mealType || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
        handleClose();
      } else {
        toast.error(data.error || (isEditMode ? "리뷰 수정에 실패했습니다." : "리뷰 작성에 실패했습니다."));
      }
    } catch {
      toast.error(isEditMode ? "리뷰 수정 중 오류가 발생했습니다." : "리뷰 작성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({
    value,
    onChange,
    size = "md",
  }: {
    value: number;
    onChange: (v: number) => void;
    size?: "sm" | "md";
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${size === "sm" ? "w-5 h-5" : "w-8 h-8"} ${
              star <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={handleClose}
      />

      {/* 바텀시트 */}
      <div className="relative bg-background w-full max-w-lg rounded-t-3xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col pb-[env(safe-area-inset-bottom)]">
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="px-5 pb-3 flex items-center justify-between border-b">
          <div>
            <h2 className="text-lg font-semibold">{isEditMode ? "리뷰 수정" : "리뷰 작성"}</h2>
            <p className="text-sm text-muted-foreground">{restaurantName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 - 스크롤 가능 */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* 전체 별점 */}
          <div className="text-center">
            <p className="text-sm font-medium mb-2">전체 평점 *</p>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* 세부 별점 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">음식</p>
              <StarRating value={foodRating} onChange={setFoodRating} size="sm" />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">서비스</p>
              <StarRating value={serviceRating} onChange={setServiceRating} size="sm" />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">분위기</p>
              <StarRating value={atmosphereRating} onChange={setAtmosphereRating} size="sm" />
            </div>
          </div>

          {/* 리뷰 내용 */}
          <div>
            <p className="text-sm font-medium mb-2">리뷰 내용</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="음식, 서비스, 분위기 등에 대한 솔직한 리뷰를 남겨주세요."
              className="w-full h-24 px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          {/* 사진 업로드 */}
          <div>
            <p className="text-sm font-medium mb-2">사진 첨부 (최대 4장)</p>
            {/* 에러 메시지 표시 */}
            {errorMessage && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {photos.map((photo, index) => (
                <div key={index} className="relative w-20 h-20">
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                    sizes="80px"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < 4 && (
                <>
                  {isNative ? (
                    // iOS/Android 네이티브: 카메라/갤러리 선택 버튼
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                        disabled={isUploading}
                        className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors"
                      >
                        {isUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        ) : (
                          <Camera className="w-6 h-6 text-muted-foreground" />
                        )}
                      </button>
                      {showPhotoOptions && !isUploading && (
                        <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleNativePhoto(CameraSource.Camera)}
                            className="flex items-center gap-2 px-4 py-2 w-full hover:bg-muted text-sm"
                          >
                            <Camera className="w-4 h-4" />
                            사진 촬영
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNativePhoto(CameraSource.Photos)}
                            className="flex items-center gap-2 px-4 py-2 w-full hover:bg-muted text-sm"
                          >
                            <ImageIcon className="w-4 h-4" />
                            갤러리에서 선택
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // 웹: 기존 파일 input
                    <label className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      ) : (
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      )}
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 식사 유형 */}
          <div>
            <p className="text-sm font-medium mb-2">식사 유형</p>
            <div className="flex gap-2 flex-wrap">
              {mealTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={mealType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMealType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 제출 버튼 - 하단 고정 */}
        <div className="p-4 border-t bg-background flex-shrink-0">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full h-12"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditMode ? "수정 중..." : "작성 중..."}
              </>
            ) : (
              isEditMode ? "리뷰 수정" : "리뷰 등록"
            )}
          </Button>
        </div>
      </div>

    </div>
  );
}
