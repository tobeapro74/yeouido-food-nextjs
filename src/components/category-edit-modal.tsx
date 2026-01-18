"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string;
  currentCategory: string;
  onSuccess: (newCategory: string) => void;
}

const categories = [
  { id: "한식", name: "한식", icon: "🍚" },
  { id: "양식", name: "양식", icon: "🥩" },
  { id: "중식", name: "중식", icon: "🥟" },
  { id: "일식", name: "일식", icon: "🍣" },
  { id: "동남아식", name: "동남아식", icon: "🍜" },
];

export function CategoryEditModal({
  isOpen,
  onClose,
  placeId,
  currentCategory,
  onSuccess,
}: CategoryEditModalProps) {
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (selectedCategory === currentCategory) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/custom-restaurants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: placeId,
          category: selectedCategory,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess(selectedCategory);
        onClose();
      } else {
        setError(data.error || "카테고리 수정에 실패했습니다.");
      }
    } catch {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>카테고리 수정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3 rounded-lg border-2 transition-colors text-left ${
                  selectedCategory === cat.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-xl mr-2">{cat.icon}</span>
                <span className="font-medium">{cat.name}</span>
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || selectedCategory === currentCategory}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
