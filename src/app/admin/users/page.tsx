// 使用者管理：一人一列（有傳過訊息或被動過狀態的才會出現）。
// 可用 ?q= 依姓名/信箱搜尋。
import type { Prisma } from "@prisma/client";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { activeBan, cooldownRemainingMs, formatRemaining } from "@/lib/status";
import { Badge } from "@/components/ui/primitives";
import { BanUserForm } from "@/components/admin/BanUserForm";
import { SearchBar } from "@/components/admin/SearchBar";
import { resetCooldownAction, unbanUserAction } from "./actions";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim();

  const where: Prisma.UserStatusWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const users = await prisma.userStatus.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
  const now = new Date();

  return (
    <div>
      <h1 className="font-extrabold text-2xl tracking-tight mb-2">使用者管理</h1>
      <p className="font-medium text-muted-foreground mb-6">
        重置冷卻、封鎖或解除封鎖。名單只包含使用過傳訊功能的人。
      </p>

      <SearchBar action="/admin/users" defaultValue={q} placeholder="搜尋姓名或信箱…" />

      <div className="flex flex-col gap-3">
        {users.map((u) => {
          const ban = activeBan(u, now);
          const remainingMs = cooldownRemainingMs(u, now);
          return (
            <div
              key={u.sub}
              className="rounded-2xl border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_0_var(--color-foreground)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{u.name}</span>
                <span className="font-mono text-[11px] text-muted-foreground break-all">{u.email}</span>
                <span className="flex-1" />
                {ban ? (
                  <Badge className="bg-tone-rose-badge text-destructive">
                    封鎖中
                    {ban.expiresAt
                      ? ` · 至 ${ban.expiresAt.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`
                      : " · 永久"}
                  </Badge>
                ) : remainingMs > 0 ? (
                  <Badge className="bg-tone-orange-badge">
                    冷卻中 · 剩 {formatRemaining(remainingMs)}
                  </Badge>
                ) : (
                  <Badge className="bg-tone-green-badge">可傳訊</Badge>
                )}
              </div>

              {ban && (
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  原因：{ban.reason}
                  {u.bannedBy && <span className="font-mono text-[11px]">（由 {u.bannedBy} 封鎖）</span>}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {remainingMs > 0 && (
                  <form action={resetCooldownAction}>
                    <input type="hidden" name="sub" value={u.sub} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-foreground bg-card px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0_0_var(--color-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-foreground)]"
                    >
                      <RotateCcw className="h-4 w-4" /> 重置冷卻
                    </button>
                  </form>
                )}
                {ban && (
                  <form action={unbanUserAction}>
                    <input type="hidden" name="sub" value={u.sub} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-foreground bg-card px-3 py-1.5 text-sm font-bold text-tone-green-text shadow-[2px_2px_0_0_var(--color-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-foreground)]"
                    >
                      <ShieldCheck className="h-4 w-4" /> 解除封鎖
                    </button>
                  </form>
                )}
              </div>

              {!ban && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-bold text-destructive">
                    封鎖這個使用者…
                  </summary>
                  <div className="mt-2">
                    <BanUserForm sub={u.sub} />
                  </div>
                </details>
              )}
            </div>
          );
        })}

        {users.length === 0 && (
          <p className="text-sm font-medium text-muted-foreground">
            {q ? "找不到符合的使用者。" : "還沒有人使用過傳訊功能。"}
          </p>
        )}
      </div>
    </div>
  );
}
