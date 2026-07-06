// 彈窗用的精簡 markdown：只允許段落／粗體／斜體／連結／清單。
// 不掛 remark-gfm（不需要表格/刪除線/自動連結），並以 allowedElements
// 做第二層防護；unwrapDisallowed=true 避免萬一內容誤用到不允許的標籤時
// 整段文字被靜默吃掉（法律用途的概覽文字，寧可退化成純文字也不要消失）。
"use client";

import ReactMarkdown from "react-markdown";
import { OrderedList, UnorderedList, ListItem } from "./OrderedList";

const ALLOWED = ["p", "strong", "em", "a", "ul", "ol", "li", "br"];

export function SimpleMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      allowedElements={ALLOWED}
      unwrapDisallowed
      components={{
        p: (props) => (
          <p className="font-medium leading-relaxed break-words mb-3 last:mb-0" {...props} />
        ),
        strong: (props) => <strong className="font-extrabold" {...props} />,
        em: (props) => <em className="italic" {...props} />,
        a: ({ href, ...props }) => (
          <a
            href={href}
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            className="font-extrabold text-primary underline underline-offset-2 hover:no-underline"
            {...props}
          />
        ),
        ol: OrderedList,
        ul: UnorderedList,
        li: ListItem,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
