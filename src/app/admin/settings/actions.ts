"use server";

// 全域設定：冷卻小時數 + 禁詞清單。
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guard";
import { saveSettings } from "@/lib/settings";

export interface SettingsResult {
  ok: boolean;
  error?: string;
}

export async function saveSettingsAction(
  _prev: SettingsResult | null,
  formData: FormData,
): Promise<SettingsResult> {
  await requireAdmin("/admin/settings");

  const cooldownHours = Number.parseInt((formData.get("cooldownHours") ?? "").toString(), 10);
  if (!Number.isFinite(cooldownHours) || cooldownHours < 1 || cooldownHours > 168) {
    return { ok: false, error: "冷卻時間要在 1–168 小時之間。" };
  }

  const bannedWords = (formData.get("bannedWords") ?? "").toString();
  const userGuidelines = (formData.get("userGuidelines") ?? "").toString().trim();
  if (!userGuidelines) {
    return { ok: false, error: "使用者守則不能是空的。" };
  }

  await saveSettings(cooldownHours, bannedWords, userGuidelines);
  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { ok: true };
}
