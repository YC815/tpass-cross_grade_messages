// Webhook 清單：學生送訊息時會廣播到所有「啟用中」的 webhook。
// url 內含 secret，這裡只顯示截斷版。
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/primitives";
import { WebhookForm, TestWebhookButton } from "@/components/admin/WebhookForm";
import { deleteWebhookAction, toggleWebhookAction } from "./actions";

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname.slice(0, 28)}…`;
  } catch {
    return `${url.slice(0, 40)}…`;
  }
}

export default async function AdminWebhooksPage() {
  const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <h1 className="font-extrabold text-2xl tracking-tight mb-2">Webhook 清單</h1>
      <p className="font-medium text-muted-foreground mb-6">
        訊息會同時送到所有「啟用中」的 webhook。測試群請新增後停用，或用完就刪。
      </p>

      <div className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-[4px_4px_0_0_var(--color-foreground)] mb-6">
        <h2 className="font-bold mb-3">新增 webhook</h2>
        <WebhookForm />
      </div>

      <div className="flex flex-col gap-3">
        {webhooks.map((w) => (
          <div
            key={w.id}
            className="rounded-2xl border-2 border-foreground bg-card p-4 shadow-[3px_3px_0_0_var(--color-foreground)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{w.name}</span>
              <Badge className={w.enabled ? "bg-tone-green-badge" : "bg-muted"}>
                {w.enabled ? "啟用中" : "已停用"}
              </Badge>
              <span className="flex-1" />
              <span className="font-mono text-[11px] text-muted-foreground">
                {truncateUrl(w.url)}
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              由 {w.createdBy} 新增 · {w.createdAt.toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" })}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <TestWebhookButton id={w.id} />
              <form action={toggleWebhookAction}>
                <input type="hidden" name="id" value={w.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-foreground bg-card px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0_0_var(--color-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-foreground)]"
                >
                  {w.enabled ? "停用" : "啟用"}
                </button>
              </form>
              <form action={deleteWebhookAction}>
                <input type="hidden" name="id" value={w.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-foreground bg-card px-3 py-1.5 text-sm font-bold text-destructive shadow-[2px_2px_0_0_var(--color-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-foreground)]"
                >
                  <Trash2 className="h-4 w-4" /> 刪除
                </button>
              </form>
            </div>
          </div>
        ))}

        {webhooks.length === 0 && (
          <p className="text-sm font-medium text-muted-foreground">
            還沒有任何 webhook——沒有目標前，學生無法送出訊息。
          </p>
        )}
      </div>
    </div>
  );
}
