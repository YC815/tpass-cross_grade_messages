"use client";

// 使用者守則彈窗 + 重新查看按鈕。
// 刻意不記憶同意狀態：每次載入（含重新整理）都以 open=true 呈現，強制先看過守則。
// 同意 → 關閉彈窗照常使用；不同意 → 導回門戶大廳（portalUrl，env 驅動）。
// 關閉後頁面上留一顆顯眼按鈕可再次打開同一份守則。
import { useEffect, useState } from "react";
import { ScrollText, Check, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";

export function Guidelines({
  content,
  portalUrl,
}: {
  content: string;
  portalUrl: string;
}) {
  const [open, setOpen] = useState(true);

  // 彈窗開啟時鎖住背景捲動。
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-tone-orange-badge px-3 py-2 font-bold text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
      >
        <ScrollText className="h-4 w-4" /> 使用者守則
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="使用者守則"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
        >
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--color-foreground)]">
            <div className="flex items-center gap-2 border-b-2 border-foreground px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-foreground bg-accent text-primary-foreground shadow-[2px_2px_0_0_var(--color-foreground)]">
                <ScrollText className="h-5 w-5" />
              </span>
              <h2 className="font-extrabold text-xl tracking-tight">使用者守則</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="whitespace-pre-wrap break-words font-medium leading-relaxed text-foreground">
                {content}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t-2 border-foreground px-5 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  window.location.href = portalUrl;
                }}
              >
                <X className="h-4 w-4" /> 不同意，離開
              </Button>
              <Button type="button" variant="primary" onClick={() => setOpen(false)}>
                <Check className="h-4 w-4" /> 我同意
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
