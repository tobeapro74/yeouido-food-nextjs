"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteAccountModal({ isOpen, onClose, onSuccess }: DeleteAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const resetForm = () => {
    setConfirmText("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDelete = async () => {
    if (confirmText !== "계정삭제") {
      setError("'계정삭제'를 정확히 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
        handleClose();
      } else {
        setError(data.error || "계정 삭제에 실패했습니다.");
      }
    } catch {
      setError("계정 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-destructive flex items-center justify-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            계정 삭제
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="bg-destructive/10 p-4 rounded-lg space-y-2">
            <p className="text-sm text-destructive font-medium">
              정말 계정을 삭제하시겠습니까?
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 모든 개인정보가 영구적으로 삭제됩니다.</li>
              <li>• 작성하신 모든 리뷰가 삭제됩니다.</li>
              <li>• 이 작업은 되돌릴 수 없습니다.</li>
            </ul>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              계정을 삭제하려면 아래에 <span className="font-semibold text-foreground">&apos;계정삭제&apos;</span>를 입력해주세요.
            </p>
            <Input
              type="text"
              placeholder="계정삭제"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="text-center"
            />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading || confirmText !== "계정삭제"}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "계정 삭제"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
