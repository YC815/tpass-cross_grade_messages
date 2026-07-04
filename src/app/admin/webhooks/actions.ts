"use server";

// Webhook 清單管理。url 內含 secret：不回顯完整 URL、不寫進錯誤訊息。
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { broadcastToWebhooks } from "@/lib/chat";

export interface WebhookResult {
  ok: boolean;
  error?: string;
  warning?: string;
}

export async function addWebhookAction(
  _prev: WebhookResult | null,
  formData: FormData,
): Promise<WebhookResult> {
  const session = await requireAdmin("/admin/webhooks");

  const name = (formData.get("name") ?? "").toString().trim();
  const url = (formData.get("url") ?? "").toString().trim();
  if (!name) return { ok: false, error: "請填寫名稱（例如：第一屆）。" };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "這不是有效的網址。" };
  }
  if (parsed.protocol !== "https:") return { ok: false, error: "Webhook 必須是 https:// 開頭。" };

  await prisma.webhook.create({ data: { name, url, createdBy: session.email } });
  revalidatePath("/admin/webhooks");
  revalidatePath("/");

  // Google Chat 以外的網域放行但提醒（可能只是打錯）。
  const warning =
    parsed.hostname === "chat.googleapis.com"
      ? undefined
      : `已新增，但網域是 ${parsed.hostname}，不是 chat.googleapis.com——確定沒貼錯？`;
  return { ok: true, warning };
}

export async function toggleWebhookAction(formData: FormData): Promise<void> {
  await requireAdmin("/admin/webhooks");
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    const current = await prisma.webhook.findUnique({ where: { id }, select: { enabled: true } });
    if (current) {
      await prisma.webhook.update({ where: { id }, data: { enabled: !current.enabled } });
    }
  }
  revalidatePath("/admin/webhooks");
  revalidatePath("/");
}

export async function deleteWebhookAction(formData: FormData): Promise<void> {
  await requireAdmin("/admin/webhooks");
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    await prisma.webhook.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/admin/webhooks");
  revalidatePath("/");
}

export async function sendTestWebhookAction(
  _prev: WebhookResult | null,
  formData: FormData,
): Promise<WebhookResult> {
  const session = await requireAdmin("/admin/webhooks");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { ok: false, error: "缺少 webhook。" };

  const webhook = await prisma.webhook.findUnique({ where: { id } });
  if (!webhook) return { ok: false, error: "找不到這個 webhook。" };

  const [result] = await broadcastToWebhooks(
    [webhook],
    `🔧 測試訊息 from T-Msg（由 ${session.email} 觸發）`,
  );
  if (!result.ok) {
    return { ok: false, error: `投遞失敗${result.error ? `：${result.error}` : ""}` };
  }
  return { ok: true };
}
