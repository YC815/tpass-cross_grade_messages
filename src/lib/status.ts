// UserStatus 的純函式判斷（頁面顯示與 server action 共用同一套邏輯）。
import type { UserStatus } from "@prisma/client";

export interface ActiveBan {
  reason: string;
  expiresAt: Date | null; // null = 永久
}

// 封鎖中？bannedAt 非 null 且（永久 或 尚未到期）。
export function activeBan(
  status: Pick<UserStatus, "bannedAt" | "banExpiresAt" | "banReason"> | null,
  now = new Date(),
): ActiveBan | null {
  if (!status?.bannedAt) return null;
  if (status.banExpiresAt && status.banExpiresAt <= now) return null;
  return {
    reason: status.banReason ?? "未填寫原因",
    expiresAt: status.banExpiresAt,
  };
}

// 冷卻剩餘毫秒；0 = 可傳。
export function cooldownRemainingMs(
  status: Pick<UserStatus, "nextAllowedAt"> | null,
  now = new Date(),
): number {
  if (!status?.nextAllowedAt) return 0;
  return Math.max(0, status.nextAllowedAt.getTime() - now.getTime());
}

// 「X 小時 Y 分鐘」的人話格式（不足 1 分鐘進位成 1 分鐘）。
export function formatRemaining(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours} 小時 ${minutes} 分鐘`;
  if (hours > 0) return `${hours} 小時`;
  return `${minutes} 分鐘`;
}
