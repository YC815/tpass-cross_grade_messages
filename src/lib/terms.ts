// 完整使用者守則（權威條款，進版控）。內文見 src/content/terms.md，由 src/lib/content.ts 讀取切分。
// 彈窗概覽內文見 src/content/guidelines.md。
export const TERMS_PATH = "/terms" as const;

export const TERMS_META = {
  version: "v1.0",
  title: "第五屆學生會跨屆代傳訊息服務（T-Msg）使用者守則",
  subtitle: "完整條款",
  audience: "經 T-Pass 單一登入（SSO）驗證之本校師生",
  provider: "第五屆學生會",
} as const;
