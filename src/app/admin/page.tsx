// 訊息紀錄：誰在什麼時候傳了什麼、各群組投遞結果。offset 分頁（?page=）。
// 可用 ?q= 依傳送者姓名/信箱或訊息內容搜尋。
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/primitives";
import { SearchBar } from "@/components/admin/SearchBar";
import type { DeliveryResult } from "@/lib/chat";

const PAGE_SIZE = 50;

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: rawPage, q: rawQ } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const q = (rawQ ?? "").trim();

  const where: Prisma.MessageWhereInput = q
    ? {
        OR: [
          { senderName: { contains: q, mode: "insensitive" } },
          { senderEmail: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.message.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div>
      <h1 className="font-extrabold text-2xl tracking-tight mb-2">訊息紀錄</h1>
      <p className="font-medium text-muted-foreground mb-6">
        {q ? `符合「${q}」的訊息共 ${total} 則。` : "共 " + total + " 則。投遞失敗的訊息仍會保留在紀錄中。"}
      </p>

      <SearchBar action="/admin" defaultValue={q} placeholder="搜尋傳送者姓名、信箱或訊息內容…" />

      <div className="flex flex-col gap-3">
        {messages.map((m) => {
          const deliveries = (m.deliveries ?? []) as unknown as DeliveryResult[];
          return (
            <div
              key={m.id}
              className="rounded-2xl border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_0_var(--color-foreground)]"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-bold">{m.senderName}</span>
                <span className="font-mono text-[11px] text-muted-foreground break-all">
                  {m.senderEmail}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {m.createdAt.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}
                </span>
                <span className="flex-1" />
                {deliveries.map((d) => (
                  <Badge
                    key={d.webhookId}
                    className={d.ok ? "bg-tone-green-badge" : "bg-tone-rose-badge text-destructive"}
                  >
                    {d.name} {d.ok ? "✓" : "✗"}
                  </Badge>
                ))}
                {deliveries.length === 0 && (
                  <Badge className="bg-tone-orange-badge">無投遞結果</Badge>
                )}
              </div>
              <p className="font-medium whitespace-pre-wrap break-words">{m.content}</p>
            </div>
          );
        })}

        {messages.length === 0 && (
          <p className="text-sm font-medium text-muted-foreground">
            {q ? "找不到符合的訊息。" : "還沒有任何訊息。"}
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {page > 1 && (
            <PageLink href={`/admin?page=${page - 1}${qs}`}>
              <ChevronLeft className="h-4 w-4" /> 上一頁
            </PageLink>
          )}
          <span className="font-mono text-xs font-bold">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <PageLink href={`/admin?page=${page + 1}${qs}`}>
              下一頁 <ChevronRight className="h-4 w-4" />
            </PageLink>
          )}
        </div>
      )}
    </div>
  );
}

function PageLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-xl border-2 border-foreground bg-card px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0_0_var(--color-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-foreground)]"
    >
      {children}
    </Link>
  );
}
