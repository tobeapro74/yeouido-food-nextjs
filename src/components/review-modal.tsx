"use client";

import { useState } from "react";
import { Star, X, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  onSuccess: () => void;
}

const mealTypes = ["아침/브런치", "점심 식사", "저녁 식사", "야식", "기타"];

export function ReviewModal({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  onSuccess,
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
  };

  const resizeImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ratio = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("별점을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
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
        alert(data.error || "리뷰 작성에 실패했습니다.");
      }
    } catch {
      alert("리뷰 작성 중 오류가 발생했습니다.");
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">리뷰 작성</DialogTitle>
          <p className="text-sm text-muted-foreground">{restaurantName}</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
              className="w-full h-24 px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 사진 업로드 */}
          <div>
            <p className="text-sm font-medium mb-2">사진 첨부 (최대 4장)</p>
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
                <label className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                  />
                </label>
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

          {/* 제출 버튼 */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                작성 중...
              </>
            ) : (
              "리뷰 등록"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
