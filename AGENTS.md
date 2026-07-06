<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# tpass-cross_grade_messages（T-Msg 跨屆傳訊）

學生填訊息 → 廣播到所有啟用中的 Google Chat webhook。生態系總覽、`services.json` 註冊表與 `tpass` CLI 見上層 **tpass-ops** repo（`AGENTS.md`、`docs/`）。

## 鐵律

- **禁止 `npm run dev`**。檢查用 `npm run lint` + `npx tsc --noEmit`；跑起來用 `npm run start:https`（或上層 tpass-ops 的 `scripts/tpass dev msg`）。
- UI 一律 light-only Neobrutalism + OKLCH，照 `tpass-portal/docs/design.md`；共用元件在 `src/components/ui/primitives.tsx`。
- SSO 驗章照 `src/lib/tpass-auth.ts`，四鐵則（EdDSA 鎖定 / issuer / audience / exp）不可動；只碰公鑰，絕不 import auth 的私鑰。
- 網域 / issuer / audience / DB 連線全 env 驅動（`src/config/auth.ts`、`.env`），不寫死。
- Webhook URL 內含 secret：只存 DB（admin UI 管理），不進 git / log / 錯誤訊息，UI 顯示截斷。
- 每個 server action / route handler 內部都要重呼 `require*` guard（`src/lib/guard.ts`），不能只靠 layout 擋。

## 資料模型速記（`prisma/schema.prisma`）

- 冷卻：`UserStatus.nextAllowedAt`（null/已過 = 可傳；送出時原子 `updateMany` 搶名額；重置 = 設 null）。
- 封鎖：`bannedAt` 非 null 即封鎖，`banExpiresAt` null = 永久。
- 全域設定：`Setting` key-value（`cooldownHours` / `bannedWords`），無 row 用預設值。
- Schema 變更走 migration（`npm run db:migrate`），部署端 `deploy.sh` 會跑 `prisma migrate deploy`。
