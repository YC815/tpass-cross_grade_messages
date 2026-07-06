// 全域設定（Setting 表 key-value）。沒有 row 就用預設值；admin 儲存時 upsert。
import "server-only";
import { prisma } from "@/lib/db";

export const DEFAULT_COOLDOWN_HOURS = 24;

async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getCooldownHours(): Promise<number> {
  const raw = await getSetting("cooldownHours");
  const parsed = raw === null ? NaN : Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_COOLDOWN_HOURS;
}

// 禁詞：換行分隔、去空白、去空行。比對用小寫（中文無大小寫，英文才有差）。
export async function getBannedWords(): Promise<string[]> {
  const raw = (await getSetting("bannedWords")) ?? "";
  return raw
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

// 大小寫不敏感 substring 比對。刻意不做 regex / 正規化：
// 「笨 蛋」這種空白繞過抓不到，v1 可接受。
export async function findBannedWord(content: string): Promise<string | null> {
  const words = await getBannedWords();
  const lower = content.toLowerCase();
  return words.find((w) => lower.includes(w)) ?? null;
}

export async function saveSettings(cooldownHours: number, bannedWords: string) {
  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: "cooldownHours" },
      create: { key: "cooldownHours", value: String(cooldownHours) },
      update: { value: String(cooldownHours) },
    }),
    prisma.setting.upsert({
      where: { key: "bannedWords" },
      create: { key: "bannedWords", value: bannedWords },
      update: { value: bannedWords },
    }),
  ]);
}
