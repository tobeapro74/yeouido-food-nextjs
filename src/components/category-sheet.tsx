"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SheetOption {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

interface CategorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: SheetOption[];
  onSelect: (id: string) => void;
}

export function CategorySheet({
  open,
  onOpenChange,
  title,
  options,
  onSelect,
}: CategorySheetProps) {
  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-lg">{title}</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-3 py-4">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted hover:bg-muted/80 transition-all active:scale-95"
            >
              <span className="text-2xl mb-2">{option.icon}</span>
              <span className="text-sm font-medium">{option.name}</span>
              {option.description && (
                <span className="text-xs text-muted-foreground mt-1">
                  {option.description}
                </span>
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
