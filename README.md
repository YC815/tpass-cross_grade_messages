# T-Msg — 跨屆傳訊

TSchool 學生會數位服務：學生登入（T-Pass SSO）後填一則訊息，系統自動廣播到各屆
Google Chat 群組（incoming webhook）。後台記錄送出者、支援禁詞過濾、每人冷卻時間、
封鎖管理與 webhook 清單管理。

- 本機網址：`https://msg.lvh.me:3003`
- Stack：Next.js 16（App Router, React Compiler）+ Prisma / PostgreSQL + `jose`（JWKS 驗章）
- UI：light-only Neobrutalism，一律照 `tpass-portal/docs/design.md`

## 功能

| 對象 | 功能 |
| --- | --- |
| 學生（`/`） | 填訊息 → 署名廣播到所有啟用中的 webhook；顯示冷卻/封鎖狀態與投遞結果 |
| 管理員（`/admin`） | 訊息紀錄（含各群組投遞狀態） |
| 管理員（`/admin/users`） | 重置冷卻、封鎖（限時或永久 + 原因）、解除封鎖 |
| 管理員（`/admin/webhooks`） | 新增/啟停/刪除/測試 webhook（可不只三個，測試群也放這） |
| 管理員（`/admin/settings`） | 冷卻小時數（1–168）、禁詞清單（一行一個） |
| 超管（`/admin/members`） | 管理管理員名單（超管種子在 env `SUPER_ADMIN_EMAILS`） |

## 本機開發

```bash
cp .env.example .env       # 填 DATABASE_URL、SUPER_ADMIN_EMAILS
createdb tmsg
npm install
npm run db:generate && npm run db:push
../scripts/dev.sh msg      # 或 all（需先跑過 ../scripts/setup.sh）
```

檢查（禁止 `npm run dev` 驗證）：

```bash
npm run lint
npx tsc --noEmit
```

Production smoke：`npm run build && npm run start:https`（憑證見頂層 `scripts/setup.sh`）。

## 重要邊界

- Webhook URL 內含 secret（key/token）：**只存 DB**，由 admin UI 管理，不進 git、不進 log、UI 顯示截斷。
- SSO 驗章照 `src/lib/tpass-auth.ts`（EdDSA 鎖定 + issuer + audience + exp，四鐵則缺一不可），細節見 `tpass-auth/INTEGRATION.md`。
- 所有網域 / issuer / audience 全部 env 驅動（`src/config/auth.ts`），不寫死。
- 冷卻用 `UserStatus.nextAllowedAt` 單欄位物化；封鎖 = `bannedAt` + 可空 `banExpiresAt`（null = 永久）。
