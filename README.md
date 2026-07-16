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
pnpm install
pnpm db:generate && pnpm db:push
../scripts/dev.sh msg      # 或 all（需先跑過 ../scripts/setup.sh）
```

單獨跑本服務：`pnpm dev`（package.json 已設好 HTTPS + `msg.lvh.me:3003` + `NODE_TLS_REJECT_UNAUTHORIZED=0`）。檢查：

```bash
pnpm lint
pnpm exec tsc --noEmit
```

Production smoke：`pnpm build && pnpm start:https`（憑證在 `$HOME/tpass-certs`，見上層 `docs/NEW-SERVICE.md` §4.1）。

## 重要邊界

- Webhook URL 內含 secret（key/token）：**只存 DB**，由 admin UI 管理，不進 git、不進 log、UI 顯示截斷。
- SSO 驗章照 `src/lib/tpass-auth.ts`（EdDSA 鎖定 + issuer + audience + exp，四鐵則缺一不可），細節見 `tpass-auth/INTEGRATION.md`。
- 所有網域 / issuer / audience 全部 env 驅動（`src/config/auth.ts`），不寫死。
- 冷卻用 `UserStatus.nextAllowedAt` 單欄位物化；封鎖 = `bannedAt` + 可空 `banExpiresAt`（null = 永久）。
- **登出留在本服務**：`src/config/auth.ts` 的 `logoutUrl` 夾帶 `redirect_uri=<自己>`，登出後 auth 會
  `303` 導回 T-Msg 首頁並帶 `?logout=1`（純畫面提示，不是憑證）。**注意**：`src/app/page.tsx`
  對一般未登入訪客是直接 `redirect(loginUrlFor("/"))`（本服務沒有可瀏覽的公開頁面），
  所以特別在這個自動 redirect **之前**攔了一個 `justLoggedOut` 分支（`!session && logout==='1'`），
  渲染 `LoggedOutNotice`（仿 `components/common/Forbidden.tsx` 版型）讓使用者能先看到「已登出」畫面、
  自己按登入，而不是登出後被瞬間彈回 Google 登入頁。改動這段邏輯時務必保留這個攔截順序。
