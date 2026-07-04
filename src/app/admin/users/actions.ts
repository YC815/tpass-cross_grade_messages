"use server";

// 使用者管理：重置冷卻 / 封鎖（限時或永久 + 原因）/ 解除封鎖。
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guard";
import { prisma } from "@/lib/db";

export interface BanResult {
  ok: boolean;
  error?: string;
}

export async function resetCooldownAction(formData: FormData): Promise<void> {
  await requireAdmin("/admin/users");
  const sub = formData.get("sub");
  if (typeof sub === "string" && sub) {
    await prisma.userStatus
      .update({ where: { sub }, data: { nextAllowedAt: null } })
      .catch(() => {});
  }
  revalidatePath("/admin/users");
  revalidatePath("/");
}

export async function banUserAction(
  _prev: BanResult | null,
  formData: FormData,
): Promise<BanResult> {
  const session = await requireAdmin("/admin/users");

  const sub = formData.get("sub");
  if (typeof sub !== "string" || !sub) return { ok: false, error: "缺少使用者。" };

  const reason = (formData.get("reason") ?? "").toString().trim();
  if (!reason) return { ok: false, error: "請填寫封禁原因。" };

  // 小時數留空 = 永久。
  const rawHours = (formData.get("hours") ?? "").toString().trim();
  let banExpiresAt: Date | null = null;
  if (rawHours !== "") {
    const hours = Number.parseInt(rawHours, 10);
    if (!Number.isFinite(hours) || hours <= 0) {
      return { ok: false, error: "小時數要是正整數，或留空表示永久。" };
    }
    banExpiresAt = new Date(Date.now() + hours * 3_600_000);
  }

  const updated = await prisma.userStatus
    .update({
      where: { sub },
      data: { bannedAt: new Date(), banExpiresAt, banReason: reason, bannedBy: session.email },
    })
    .catch(() => null);
  if (!updated) return { ok: false, error: "找不到這個使用者。" };

  revalidatePath("/admin/users");
  revalidatePath("/");
  return { ok: true };
}

export async function unbanUserAction(formData: FormData): Promise<void> {
  await requireAdmin("/admin/users");
  const sub = formData.get("sub");
  if (typeof sub === "string" && sub) {
    await prisma.userStatus
      .update({
        where: { sub },
        data: { bannedAt: null, banExpiresAt: null, banReason: null, bannedBy: null },
      })
      .catch(() => {});
  }
  revalidatePath("/admin/users");
  revalidatePath("/");
}
