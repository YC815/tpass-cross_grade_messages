-- 身分鍵由 Google sub 改為校園 email：先去重再加 UNIQUE(email)。
-- 同一 email 多列 → 併為一列：冷卻取最嚴（max nextAllowedAt）、任一列在封鎖則保留該封鎖。

-- 1) 每列套上其 email 群組的最嚴冷卻，並把 email 正規化為小寫。
UPDATE "UserStatus" k
SET "nextAllowedAt" = g.max_next,
    email = g.le
FROM (
  SELECT lower(email) AS le, max("nextAllowedAt") AS max_next
  FROM "UserStatus" GROUP BY lower(email)
) g
WHERE lower(k.email) = g.le;

-- 2) 群組內若有封鎖，取 bannedAt 最新的那筆，整組套用其封鎖欄位。
UPDATE "UserStatus" k
SET "bannedAt" = b."bannedAt",
    "banExpiresAt" = b."banExpiresAt",
    "banReason" = b."banReason",
    "bannedBy" = b."bannedBy"
FROM (
  SELECT DISTINCT ON (lower(email)) lower(email) AS le,
         "bannedAt", "banExpiresAt", "banReason", "bannedBy"
  FROM "UserStatus"
  WHERE "bannedAt" IS NOT NULL
  ORDER BY lower(email), "bannedAt" DESC
) b
WHERE lower(k.email) = b.le;

-- 3) 每個 email 保留一列（updatedAt 最新者），刪掉其餘重複列。
DELETE FROM "UserStatus" us
USING (
  SELECT DISTINCT ON (lower(email)) sub AS keep_sub, lower(email) AS le
  FROM "UserStatus"
  ORDER BY lower(email), "updatedAt" DESC
) k
WHERE lower(us.email) = k.le AND us.sub <> k.keep_sub;

-- 4) 加上 email 唯一索引：從此一個校園帳號只會有一列狀態。
CREATE UNIQUE INDEX "UserStatus_email_key" ON "UserStatus"("email");
