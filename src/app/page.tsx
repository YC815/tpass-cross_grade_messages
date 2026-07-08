// 學生傳訊頁：未登入導 SSO；封鎖/冷卻中顯示狀態卡，否則給傳訊表單。
import Link from "next/link";
import { redirect } from "next/navigation";
import { Ban, Clock, LogIn, MessagesSquare } from "lucide-react";
import { getSession } from "@/lib/tpass-auth";
import { isAdmin } from "@/config/admin";
import { authConfig, loginUrlFor } from "@/config/auth";
import { prisma } from "@/lib/db";
import { getCooldownHours } from "@/lib/settings";
import { getGuidelinesMarkdown } from "@/lib/content";
import { activeBan, cooldownRemainingMs, formatRemaining } from "@/lib/status";
import { MAX_CONTENT_LENGTH } from "@/lib/constants";
import { MessageForm } from "@/components/MessageForm";
import { Guidelines } from "@/components/Guidelines";
import { PortalLink } from "@/components/common/PortalLink";
import { Badge, Button } from "@/components/ui/primitives";

function LoggedOutNotice() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-50 h-16 bg-background/90 backdrop-blur-md border-b-2 border-foreground/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PortalLink href={authConfig.portalUrl} />
            <span className="font-mono text-lg font-extrabold tracking-tight text-foreground">
              T<span className="text-primary">-</span>Msg
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-24 flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-foreground bg-card text-foreground shadow-[4px_4px_0_0_var(--color-foreground)]">
          <LogIn className="h-8 w-8" />
        </span>
        <h1 className="mt-6 font-extrabold text-2xl tracking-tight">您已登出</h1>
        <p className="mt-2 font-medium text-muted-foreground">
          您已安全登出 T-Msg。要繼續使用跨屆傳訊，請重新登入。
        </p>
        <a href={authConfig.loginUrl} className="mt-6">
          <Button variant="primary">使用學校帳號登入</Button>
        </a>
      </main>
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ logout?: string }>;
}) {
  const session = await getSession();
  // logout=1 只是 auth 導回來的畫面提示，不是憑證：只有在 session 確實無效時才採信。
  const { logout } = await searchParams;
  const justLoggedOut = !session && logout === "1";
  if (justLoggedOut) return <LoggedOutNotice />;
  if (!session) redirect(loginUrlFor("/"));

  const [status, cooldownHours, webhooks, admin] = await Promise.all([
    prisma.userStatus.findUnique({ where: { email: session.email.trim().toLowerCase() } }),
    getCooldownHours(),
    prisma.webhook.findMany({
      where: { enabled: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    isAdmin(session.email),
  ]);
  const guidelines = getGuidelinesMarkdown();

  const ban = activeBan(status);
  const remainingMs = ban ? 0 : cooldownRemainingMs(status);

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-50 h-16 bg-background/90 backdrop-blur-md border-b-2 border-foreground/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PortalLink href={authConfig.portalUrl} />
            <span className="font-mono text-lg font-extrabold tracking-tight text-foreground">
              T<span className="text-primary">-</span>Msg
            </span>
          </div>
          <div className="flex items-center gap-3">
            {admin && (
              <Link
                href="/admin"
                className="rounded-md border-2 border-foreground bg-primary px-2.5 py-1 font-mono text-[11px] font-bold text-primary-foreground shadow-[2px_2px_0_0_var(--color-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-foreground)]"
              >
                管理後台
              </Link>
            )}
            <span className="hidden sm:inline rounded-md border-2 border-foreground bg-card px-2 py-0.5 font-mono text-[11px] font-bold text-foreground">
              {session.name}
            </span>
            <form method="post" action={authConfig.logoutUrl}>
              <button
                type="submit"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                登出
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-foreground bg-accent text-primary-foreground shadow-[2px_2px_0_0_var(--color-foreground)]">
            <MessagesSquare className="h-5 w-5" />
          </span>
          <h1 className="font-extrabold text-2xl tracking-tight">跨屆傳訊</h1>
        </div>
        <p className="font-medium text-muted-foreground mb-4">
          寫一則訊息，同步送到各屆的 Google Chat 群組。訊息會以你的名義署名送出。
        </p>

        <div className="mb-6">
          <Guidelines content={guidelines} portalUrl={authConfig.portalUrl} />
        </div>

        {webhooks.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">將送達：</span>
            {webhooks.map((w) => (
              <Badge key={w.id} className="bg-tone-blue-badge">
                {w.name}
              </Badge>
            ))}
          </div>
        )}

        {ban ? (
          <div className="rounded-2xl border-2 border-foreground bg-tone-rose-bg p-5 shadow-[4px_4px_0_0_var(--color-foreground)]">
            <div className="flex items-center gap-2 font-extrabold text-lg text-tone-rose-text">
              <Ban className="h-5 w-5" /> 傳訊功能已被停用
            </div>
            <p className="mt-2 font-medium">
              {ban.expiresAt
                ? `停用至 ${ban.expiresAt.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`
                : "永久停用"}
            </p>
            <p className="mt-1 font-medium text-muted-foreground">原因：{ban.reason}</p>
          </div>
        ) : remainingMs > 0 ? (
          <div className="rounded-2xl border-2 border-foreground bg-tone-orange-bg p-5 shadow-[4px_4px_0_0_var(--color-foreground)]">
            <div className="flex items-center gap-2 font-extrabold text-lg text-tone-orange-text">
              <Clock className="h-5 w-5" /> 冷卻中
            </div>
            <p className="mt-2 font-medium">
              還要等 {formatRemaining(remainingMs)} 才能再傳下一則（每 {cooldownHours} 小時限傳一則）。
            </p>
          </div>
        ) : (
          <MessageForm maxLength={MAX_CONTENT_LENGTH} cooldownHours={cooldownHours} />
        )}
      </main>
    </div>
  );
}
