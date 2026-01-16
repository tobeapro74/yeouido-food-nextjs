"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gender, MaritalStatus } from "@/lib/fortune";

interface FortuneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    gender: Gender;
    maritalStatus: MaritalStatus;
  }) => void;
}

export function FortuneModal({ open, onOpenChange, onSubmit }: FortuneModalProps) {
  const currentYear = new Date().getFullYear();
  const [birthYear, setBirthYear] = useState(1990);
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState(1);
  const [gender, setGender] = useState<Gender>("male");
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>("single");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ birthYear, birthMonth, birthDay, gender, maritalStatus });
  };

  // 연도 옵션 생성 (1940 ~ 현재)
  const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <span className="text-2xl">🔮</span>
            오늘의 운세
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* 생년월일 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              생년월일
            </label>
            <div className="flex gap-2">
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(Number(e.target.value))}
                className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(Number(e.target.value))}
                className="w-20 h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(Number(e.target.value))}
                className="w-20 h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}일</option>
                ))}
              </select>
            </div>
          </div>

          {/* 성별 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              성별
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`flex-1 h-10 rounded-md text-sm font-medium transition-all ${
                  gender === "male"
                    ? "bg-blue-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                남성 👨
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`flex-1 h-10 rounded-md text-sm font-medium transition-all ${
                  gender === "female"
                    ? "bg-pink-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                여성 👩
              </button>
            </div>
          </div>

          {/* 결혼 여부 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              결혼 여부
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMaritalStatus("single")}
                className={`flex-1 h-10 rounded-md text-sm font-medium transition-all ${
                  maritalStatus === "single"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                미혼 💫
              </button>
              <button
                type="button"
                onClick={() => setMaritalStatus("married")}
                className={`flex-1 h-10 rounded-md text-sm font-medium transition-all ${
                  maritalStatus === "married"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                기혼 💍
              </button>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-base hover:opacity-90 transition-opacity"
          >
            운세 보기 ✨
          </button>

          <p className="text-xs text-center text-muted-foreground">
            입력하신 정보는 저장되지 않습니다
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
