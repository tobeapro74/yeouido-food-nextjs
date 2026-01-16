"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FortuneDetailExplanation } from "@/lib/fortune";
import { Lightbulb, Utensils } from "lucide-react";

interface FortuneDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  explanation: FortuneDetailExplanation | null;
  score: number;
}

// 점수를 이모지로 변환
function renderScoreEmoji(score: number, emoji: string): string {
  return emoji.repeat(score);
}

// 점수별 배경 그라데이션
function getScoreGradient(score: number): string {
  if (score >= 4) return "from-amber-400 to-orange-500";
  if (score === 3) return "from-blue-400 to-cyan-500";
  return "from-gray-400 to-slate-500";
}

export function FortuneDetailModal({
  open,
  onOpenChange,
  explanation,
  score
}: FortuneDetailModalProps) {
  if (!explanation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <span className="text-2xl">{explanation.emoji}</span>
            {explanation.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 점수 표시 */}
          <div className={`bg-gradient-to-r ${getScoreGradient(score)} rounded-xl p-4 text-white text-center`}>
            <p className="text-2xl mb-1">
              {renderScoreEmoji(score, explanation.emoji)}
            </p>
            <p className="font-bold text-lg">{explanation.summary}</p>
          </div>

          {/* 상세 설명 */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {explanation.details.map((detail, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <p className="text-sm text-gray-700">{detail}</p>
              </div>
            ))}
          </div>

          {/* 조언 */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-blue-600 font-medium mb-1">오늘의 조언</p>
                <p className="text-sm text-blue-800">{explanation.advice}</p>
              </div>
            </div>
          </div>

          {/* 음식 팁 */}
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-start gap-2">
              <Utensils className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-orange-600 font-medium mb-1">맛집 팁</p>
                <p className="text-sm text-orange-800">{explanation.foodTip}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
