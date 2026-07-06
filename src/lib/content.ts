// 靜態內容（.md）讀取：使用規則概覽彈窗 + 完整使用者守則。
// 這個 app 以 PM2 + 自訂 server.mjs 常駐執行（非 standalone output），
// 完整原始碼樹在執行期都存在，process.cwd() 相對路徑讀檔是安全的。
import "server-only";
import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "src/content");

export interface TermsSection {
  title: string;
  body: string;
}

function readContentFile(filename: string): string {
  return fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
}

// 檔案內容在部署期間不會變動，模組層快取，避免每個 request 都讀一次磁碟。
let guidelinesCache: string | null = null;
let termsCache: TermsSection[] | null = null;

// 使用規則概覽（彈窗顯示）。
export function getGuidelinesMarkdown(): string {
  if (guidelinesCache === null) {
    guidelinesCache = readContentFile("guidelines.md").trim();
  }
  return guidelinesCache;
}

// 完整使用者守則：依頂層 `## ` 標題切成 {title, body} 陣列，交給 /terms 逐段渲染。
export function getTermsSections(): TermsSection[] {
  if (termsCache === null) {
    termsCache = splitByH2(readContentFile("terms.md"));
  }
  return termsCache;
}

// 只切「## 標題」這一層（`###` 以下的子標題會留在該段 body 內，不會被切開）。
// 邊界情況：
// - 第一個 `##` 之前的內容（若有）會被捨棄（terms.md 目前不需要前言；
//   TERMS_META 已涵蓋版本/標題/適用對象等資訊）。
// - 標題整行只有空白視為異常，該段捨棄。
// - body 允許是空字串：寧可讓畫面上出現一張「有標題、沒內容」的卡片讓人一眼發現，
//   也不要讓內容被靜默吃掉（這是法律條款頁，漏字比多一張空卡更危險）。
export function splitByH2(markdown: string): TermsSection[] {
  const lines = markdown.split("\n");
  const sections: TermsSection[] = [];
  let currentTitle: string | null = null;
  let currentBody: string[] = [];

  const flush = () => {
    if (currentTitle === null) return;
    const title = currentTitle.trim();
    if (!title) return;
    sections.push({ title, body: currentBody.join("\n").trim() });
  };

  const H2 = /^##\s+(.*?)\s*$/; // 只比對 "## "，"### " 因第 3 碼非空白不會誤中

  for (const line of lines) {
    const match = H2.exec(line);
    if (match) {
      flush();
      currentTitle = match[1];
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  flush();

  return sections;
}
