// Google Chat incoming webhook 廣播。
// 每個 webhook 各自 10 秒 timeout、allSettled 收結果：部分失敗不影響其他群組，
// 也不外拋 —— 呼叫端把結果存進 Message.deliveries。
// 注意：webhook URL 內含 secret，錯誤訊息與 log 一律不得帶出完整 URL。
import "server-only";

export interface DeliveryResult {
  webhookId: string;
  name: string;
  ok: boolean;
  status?: number;
  error?: string;
}

const TIMEOUT_MS = 10_000;

async function postToWebhook(
  webhook: { id: string; name: string; url: string },
  text: string,
): Promise<DeliveryResult> {
  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      return { webhookId: webhook.id, name: webhook.name, ok: false, status: res.status, error: `HTTP ${res.status}` };
    }
    return { webhookId: webhook.id, name: webhook.name, ok: true, status: res.status };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "逾時（10 秒）"
        : err instanceof Error
          ? err.name
          : "unknown";
    return { webhookId: webhook.id, name: webhook.name, ok: false, error: message };
  }
}

export async function broadcastToWebhooks(
  webhooks: Array<{ id: string; name: string; url: string }>,
  text: string,
): Promise<DeliveryResult[]> {
  const settled = await Promise.allSettled(webhooks.map((w) => postToWebhook(w, text)));
  return settled.map((s, i) =>
    s.status === "fulfilled"
      ? s.value
      : { webhookId: webhooks[i].id, name: webhooks[i].name, ok: false, error: "unexpected" },
  );
}
