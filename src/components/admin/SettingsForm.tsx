"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { saveSettingsAction, type SettingsResult } from "@/app/admin/settings/actions";
import { Button, Input, Label, Textarea } from "@/components/ui/primitives";

export function SettingsForm({
  cooldownHours,
  bannedWords,
  userGuidelines,
}: {
  cooldownHours: number;
  bannedWords: string;
  userGuidelines: string;
}) {
  const [state, action, pending] = useActionState<SettingsResult | null, FormData>(
    saveSettingsAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cooldownHours">冷卻時間（小時）</Label>
        <Input
          id="cooldownHours"
          name="cooldownHours"
          type="number"
          min={1}
          max={168}
          required
          defaultValue={cooldownHours}
          className="w-32"
          disabled={pending}
        />
        <p className="text-xs font-medium text-muted-foreground">
          每個學生送出一則後，要等這麼久才能再送。改動只影響之後的送出。
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bannedWords">禁詞清單（一行一個）</Label>
        <Textarea
          id="bannedWords"
          name="bannedWords"
          defaultValue={bannedWords}
          placeholder={"一行一個詞\n命中就擋下，不分大小寫"}
          className="min-h-40 font-mono text-sm"
          disabled={pending}
        />
        <p className="text-xs font-medium text-muted-foreground">
          訊息內容包含任一詞就會被擋下（不會告訴學生是哪個詞）。留空 = 不過濾。
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="userGuidelines">使用者守則</Label>
        <Textarea
          id="userGuidelines"
          name="userGuidelines"
          required
          defaultValue={userGuidelines}
          placeholder={"學生每次登入都會跳出這份守則，要同意才能使用。\n可用換行分段。"}
          className="min-h-56 text-sm"
          disabled={pending}
        />
        <p className="text-xs font-medium text-muted-foreground">
          學生每次載入傳訊頁都會彈出這份守則，需點「我同意」才能傳訊；不同意會導回門戶大廳。
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          <Save className="h-4 w-4" /> {pending ? "儲存中…" : "儲存"}
        </Button>
        {state?.error && (
          <p className="font-mono text-xs font-bold text-destructive">{state.error}</p>
        )}
        {state?.ok && <p className="font-mono text-xs font-bold text-primary">已儲存。</p>}
      </div>
    </form>
  );
}
