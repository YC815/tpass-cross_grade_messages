"use client";

// 使用規則概覽彈窗 + 重新查看按鈕。
// 刻意不記憶同意狀態：每次載入（含重新整理）都以 open=true 呈現，強制先看過概覽。
// 同意 → 關閉彈窗照常使用；不同意 → 導回門戶大廳（portalUrl，env 驅動）。
// 完整條款固定於 /terms；概覽下方附不可移除之效力聲明與連結。
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ScrollText, Check, X, ExternalLink } from "lucide-react";
import { TERMS_PATH } from "@/lib/terms";
import { Button } from "@/components/ui/primitives";
import { SimpleMarkdown } from "@/components/markdown/SimpleMarkdown";

const SCROLL_EPSILON = 4; // px，容忍次像素捲動誤差（高 DPI / 瀏覽器縮放）

export function Guidelines({
  content,
  portalUrl,
}: {
  content: string;
  portalUrl: string;
}) {
  const [open, setOpen] = useState(true);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScrollBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setScrolledToBottom(distanceFromBottom <= SCROLL_EPSILON);
  }, []);

  // 彈窗開啟時鎖住背景捲動。
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 每次開啟（含用頁首按鈕重新打開）都重置捲動判定，並在掛載、內容尺寸變化
  // （含字型載入造成的 reflow）、視窗縮放時重新檢查。內容不需捲動（一開始就到底）
  // 的情況會在 checkScrollBottom() 首次呼叫時直接判定為 true。
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;

    setScrolledToBottom(false);
    checkScrollBottom();

    const resizeObserver = new ResizeObserver(() => checkScrollBottom());
    resizeObserver.observe(el);
    window.addEventListener("resize", checkScrollBottom);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkScrollBottom);
    };
  }, [open, checkScrollBottom]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-tone-orange-badge px-3 py-2 font-bold text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
      >
        <ScrollText className="h-4 w-4" /> 使用規則概覽
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="使用規則概覽"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
        >
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--color-foreground)]">
            <div className="flex items-center gap-2 border-b-2 border-foreground px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-foreground bg-accent text-primary-foreground shadow-[2px_2px_0_0_var(--color-foreground)]">
                <ScrollText className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-extrabold text-xl tracking-tight">使用規則概覽</h2>
                <p className="text-xs font-medium text-muted-foreground">
                  快速了解重點，完整條款請見下方連結
                </p>
              </div>
            </div>

            <div ref={scrollRef} onScroll={checkScrollBottom} className="flex-1 overflow-y-auto px-5 py-4">
              <SimpleMarkdown>{content}</SimpleMarkdown>

              <div className="mt-4 rounded-xl border-2 border-foreground bg-tone-blue-bg px-3 py-2.5 shadow-[2px_2px_0_0_var(--color-foreground)]">
                <p className="text-sm font-medium leading-relaxed">
                  本概覽僅供快速參考，方便你了解服務重點；若概覽與完整條款內容有所歧異，以
                  <Link
                    href={TERMS_PATH}
                    className="mx-0.5 inline-flex items-center gap-0.5 font-extrabold text-primary underline underline-offset-2 hover:no-underline"
                    onClick={() => setOpen(false)}
                  >
                    完整使用者守則
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </Link>
                  為準。
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t-2 border-foreground px-5 py-4">
              {!scrolledToBottom && (
                <p className="text-xs font-medium text-muted-foreground">
                  請先捲動閱讀至底部，才能點選「我同意」
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    window.location.href = portalUrl;
                  }}
                >
                  <X className="h-4 w-4" /> 不同意，離開
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!scrolledToBottom}
                  onClick={() => setOpen(false)}
                >
                  <Check className="h-4 w-4" /> 我同意
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
