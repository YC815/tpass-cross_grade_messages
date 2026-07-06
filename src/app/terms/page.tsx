// 完整使用者守則（權威條款）。不需登入即可閱讀，供概覽彈窗連結與外部引用。
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ScrollText } from "lucide-react";
import { authConfig } from "@/config/auth";
import { getSession } from "@/lib/tpass-auth";
import { TERMS_META } from "@/lib/terms";
import { getTermsSections } from "@/lib/content";
import { PortalLink } from "@/components/common/PortalLink";
import { Badge } from "@/components/ui/primitives";
import { RichMarkdown } from "@/components/markdown/RichMarkdown";

export const metadata: Metadata = {
  title: `完整使用者守則 — T-Msg`,
  description: TERMS_META.title,
};

export default async function TermsPage() {
  const session = await getSession();
  const sections = getTermsSections();

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-50 h-16 bg-background/90 backdrop-blur-md border-b-2 border-foreground/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PortalLink href={authConfig.portalUrl} />
            <span className="font-mono text-lg font-extrabold tracking-tight text-foreground">
              T<span className="text-primary">-</span>Msg
            </span>
          </div>
          {session ? (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              返回傳訊
            </Link>
          ) : (
            <a
              href={authConfig.loginUrl}
              className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              登入
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start gap-3 mb-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-foreground bg-accent text-primary-foreground shadow-[2px_2px_0_0_var(--color-foreground)]">
            <ScrollText className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-extrabold text-2xl tracking-tight">{TERMS_META.subtitle}</h1>
              <Badge className="bg-tone-orange-badge">{TERMS_META.version}</Badge>
            </div>
            <p className="font-medium text-muted-foreground">{TERMS_META.title}</p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border-2 border-foreground bg-tone-blue-bg px-4 py-3 shadow-[3px_3px_0_0_var(--color-foreground)]">
          <p className="text-sm font-medium leading-relaxed">
            本頁為本服務之<strong className="font-extrabold">完整且具效力</strong>之使用條款。
            傳訊頁面所顯示之「使用規則概覽」僅供快速參考；若內容有所歧異，以本頁條款為準。
          </p>
        </div>

        <dl className="flex flex-col gap-2 mb-8 text-sm font-medium text-muted-foreground">
          <div className="flex gap-2">
            <dt className="shrink-0 font-bold text-foreground">適用對象</dt>
            <dd>{TERMS_META.audience}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-bold text-foreground">服務提供方</dt>
            <dd>{TERMS_META.provider}</dd>
          </div>
        </dl>

        <article className="flex flex-col gap-6">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-[4px_4px_0_0_var(--color-foreground)]"
            >
              <h2 className="font-extrabold text-lg tracking-tight mb-3">{section.title}</h2>
              <RichMarkdown>{section.body}</RichMarkdown>
            </section>
          ))}
        </article>

        <footer className="mt-10 pt-6 border-t-2 border-foreground/20 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            {TERMS_META.provider} · {TERMS_META.version}
          </p>
          {session && (
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              返回跨屆傳訊
            </Link>
          )}
        </footer>
      </main>
    </div>
  );
}
