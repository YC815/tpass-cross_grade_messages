// 後台清單搜尋列：純 GET 表單（送出即帶 ?q=…），無 client JS。
// 送出時只帶 q，天然丟掉舊的 ?page= → 回到第一頁。
import { Search } from "lucide-react";
import { Input, Button } from "@/components/ui/primitives";

export function SearchBar({
  action,
  defaultValue,
  placeholder,
}: {
  action: string;
  defaultValue?: string;
  placeholder: string;
}) {
  return (
    <form action={action} method="get" className="mb-6 flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="pl-9"
          autoComplete="off"
        />
      </div>
      <Button type="submit">搜尋</Button>
    </form>
  );
}
