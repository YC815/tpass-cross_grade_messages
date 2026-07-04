"use server";

// 學生送訊息的主流程。順序：
//   內容驗證 → 禁詞 → 封鎖 → 有無目標 → 原子搶冷卻 → 落紀錄 → 廣播 → 回填投遞結果。
// 「先落 Message 再廣播」：部分/全部投遞失敗也不掉審計紀錄（冷卻照樣消耗，admin 可重置）。
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { getCooldownHours, findBannedWord } from "@/lib/settings";
import { activeBan, cooldownRemainingMs, formatRemaining } from "@/lib/status";
import { broadcastToWebhooks, type DeliveryResult } from "@/lib/chat";
import { MAX_CONTENT_LENGTH } from "@/lib/constants";

export interface SendResult {
  ok: boolean;
  error?: string;
  deliveries?: DeliveryResult[];
}

export async function sendMessageAction(
  _prev: SendResult | null,
  formData: FormData,
): Promise<SendResult> {
  const session = await requireSession("/");
  const now = new Date();

  const raw = formData.get("content");
  const content = (typeof raw === "string" ? raw : "").trim();
  if (!content) return { ok: false, error: "訊息不能是空的。" };
  if (content.length > MAX_CONTENT_LENGTH) {
    return { ok: false, error: `訊息太長了（上限 ${MAX_CONTENT_LENGTH} 字）。` };
  }

  // 不回顯命中的是哪個詞，避免變成禁詞查詢器。
  if (await findBannedWord(content)) {
    return { ok: false, error: "訊息包含不允許的字詞，請修改後再送出。" };
  }

  const status = await prisma.userStatus.findUnique({ where: { sub: session.sub } });
  const ban = activeBan(status, now);
  if (ban) {
    const until = ban.expiresAt
      ? `至 ${ban.expiresAt.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`
      : "（永久）";
    return { ok: false, error: `你已被停用傳訊功能${until}。原因：${ban.reason}` };
  }

  const webhooks = await prisma.webhook.findMany({
    where: { enabled: true },
    orderBy: { createdAt: "asc" },
  });
  if (webhooks.length === 0) {
    return { ok: false, error: "目前沒有可傳送的目標群組，請聯絡學生會。" };
  }

  // 原子搶冷卻名額：條件式 updateMany 擋掉連點/並發雙送。
  const cooldownHours = await getCooldownHours();
  await prisma.userStatus.upsert({
    where: { sub: session.sub },
    create: { sub: session.sub, email: session.email, name: session.name },
    update: { email: session.email, name: session.name },
  });
  const claimed = await prisma.userStatus.updateMany({
    where: {
      sub: session.sub,
      OR: [{ nextAllowedAt: null }, { nextAllowedAt: { lte: now } }],
    },
    data: { nextAllowedAt: new Date(now.getTime() + cooldownHours * 3_600_000) },
  });
  if (claimed.count === 0) {
    const fresh = await prisma.userStatus.findUnique({ where: { sub: session.sub } });
    const remaining = formatRemaining(cooldownRemainingMs(fresh, now));
    return { ok: false, error: `冷卻中，還要等 ${remaining} 才能再傳。` };
  }

  const message = await prisma.message.create({
    data: {
      senderSub: session.sub,
      senderEmail: session.email,
      senderName: session.name,
      content,
      deliveries: [],
    },
  });

  // 使用者已拍板：Chat 訊息署名（開頭附姓名）。
  const deliveries = await broadcastToWebhooks(webhooks, `${session.name}：\n${content}`);

  await prisma.message.update({
    where: { id: message.id },
    data: { deliveries: deliveries as unknown as Prisma.InputJsonValue },
  });

  revalidatePath("/");
  return { ok: true, deliveries };
}
