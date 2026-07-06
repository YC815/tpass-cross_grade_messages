// 共用的「有序清單」渲染：react-markdown 的 li 不會自動附上 index/ordered，
// 所以在 ol 這層用 cloneElement 把序號塞進每個 li（此時 li 還只是尚未
// 執行的 React element，可以安全地加 prop）。ul 走同一顆 li 元件，
// 但不會被注入 __olIndex，元件內部就退回顯示項目符號。
import * as React from "react";

interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  __olIndex?: number;
}

export function OrderedList({ children, ...props }: React.OlHTMLAttributes<HTMLOListElement>) {
  const items = React.Children.toArray(children);
  return (
    <ol className="flex flex-col gap-2.5 mb-3 last:mb-0 list-none" {...props}>
      {items.map((child, i) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<ListItemProps>, { __olIndex: i + 1 })
          : child,
      )}
    </ol>
  );
}

export function UnorderedList({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className="flex flex-col gap-2 mb-3 last:mb-0 list-none" {...props}>
      {children}
    </ul>
  );
}

export function ListItem({ children, __olIndex, ...props }: ListItemProps) {
  return (
    <li className="flex gap-3 font-medium leading-relaxed" {...props}>
      <span className="shrink-0 font-mono text-xs font-bold text-muted-foreground pt-0.5">
        {__olIndex ? `${__olIndex}.` : "•"}
      </span>
      <span>{children}</span>
    </li>
  );
}
