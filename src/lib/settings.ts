// 全域設定（Setting 表 key-value）。沒有 row 就用預設值；admin 儲存時 upsert。
import "server-only";
import { prisma } from "@/lib/db";

export const DEFAULT_COOLDOWN_HOURS = 24;

// 首次沒設定時的預設守則。admin 可在 /admin/settings 覆寫。
export const DEFAULT_GUIDELINES = `歡迎使用第五屆學生會跨屆代傳訊息服務。

送出訊息前，請先閱讀並同意以下守則：

1. 訊息會以你的實名同步廣播到各屆的群組，送出後無法收回。
2. 禁止散播不實、辱罵、歧視、騷擾或任何違反校規的內容。
3. 請尊重各屆同學，勿灌水、勿洗版、勿張貼廣告或垃圾訊息。
4. 濫用本服務者，學生會有權暫停或永久停用其傳訊權限。

點擊「我同意」代表你已閱讀並願意遵守以上守則。`;

async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

// 使用者守則（登入彈窗顯示，admin 可編輯）。沒設定就用預設。
export async function getUserGuidelines(): Promise<string> {
  const raw = await getSetting("userGuidelines");
  return raw && raw.trim() ? raw : DEFAULT_GUIDELINES;
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

export async function saveSettings(
  cooldownHours: number,
  bannedWords: string,
  userGuidelines: string,
) {
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
    prisma.setting.upsert({
      where: { key: "userGuidelines" },
      create: { key: "userGuidelines", value: userGuidelines },
      update: { value: userGuidelines },
    }),
  ]);
}
