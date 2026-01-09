"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Trash2, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReviewModal } from "@/components/review-modal";
import { Review } from "@/lib/types";
import Image from "next/image";

interface ReviewSectionProps {
  restaurantId: string;
  restaurantName: string;
}

interface UserInfo {
  id: number;
  name: string;
}

export function ReviewSection({ restaurantId, restaurantName }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?restaurant_id=${encodeURIComponent(restaurantId)}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchReviews();

    // 사용자 정보 확인
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
        }
      } catch {
        // 비로그인 상태
      }
    };
    checkAuth();
  }, [fetchReviews]);

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      } else {
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleReviewSubmitted = () => {
    fetchReviews();
    setReviewModalOpen(false);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">리뷰 ({reviews.length})</h2>
        <Button
          size="sm"
          onClick={() => {
            if (!user) {
              alert("로그인이 필요합니다.");
              return;
            }
            setReviewModalOpen(true);
          }}
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          리뷰 작성
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-3/4 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {review.user_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{review.user_name}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                {user && user.id === review.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteReview(review._id!)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {review.content && (
                <p className="text-sm mt-3 text-foreground/80">{review.content}</p>
              )}
              {review.photos && review.photos.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {review.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden"
                    >
                      <Image
                        src={photo}
                        alt={`리뷰 사진 ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              )}
              {review.meal_type && (
                <p className="text-xs text-muted-foreground mt-2">
                  {review.meal_type}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!
        </div>
      )}

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        onSuccess={handleReviewSubmitted}
      />
    </div>
  );
}
