// 完整條款頁用的完整 markdown：remark-gfm（表格/刪除線/自動連結），
// 樣式對齊既有 Neobrutalism/OKLCH tokens，沿用 terms/page.tsx 既有的
// 卡片內文字/清單/連結視覺語言，不另外發明新樣式。
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { OrderedList, UnorderedList, ListItem } from "./OrderedList";

export function RichMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: (props) => <p className="font-medium leading-relaxed mb-3 last:mb-0" {...props} />,
        strong: (props) => <strong className="font-extrabold" {...props} />,
        em: (props) => <em className="italic" {...props} />,
        a: ({ href, ...props }) => (
          <a
            href={href}
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            className="font-extrabold text-primary underline underline-offset-2 hover:no-underline break-words"
            {...props}
          />
        ),
        ol: OrderedList,
        ul: UnorderedList,
        li: ListItem,
        h1: (props) => (
          <h1 className="font-extrabold text-xl tracking-tight mt-4 mb-2 first:mt-0" {...props} />
        ),
        h2: (props) => (
          <h2 className="font-extrabold text-lg tracking-tight mt-4 mb-2 first:mt-0" {...props} />
        ),
        h3: (props) => (
          <h3 className="font-extrabold text-base tracking-tight mt-3 mb-1.5 first:mt-0" {...props} />
        ),
        blockquote: (props) => (
          <blockquote
            className="rounded-xl border-2 border-foreground bg-tone-blue-bg px-4 py-3 shadow-[2px_2px_0_0_var(--color-foreground)] my-3 text-sm font-medium leading-relaxed"
            {...props}
          />
        ),
        hr: () => <hr className="my-4 border-t-2 border-foreground/20" />,
        code: (props) => (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs" {...props} />
        ),
        table: (props) => (
          <div className="my-3 overflow-x-auto rounded-xl border-2 border-foreground">
            <table className="w-full border-collapse text-sm" {...props} />
          </div>
        ),
        thead: (props) => <thead className="bg-tone-blue-bg" {...props} />,
        th: (props) => (
          <th className="border-b-2 border-foreground px-3 py-2 text-left font-extrabold" {...props} />
        ),
        td: (props) => <td className="border-t-2 border-foreground px-3 py-2 align-top" {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
