"use client";

import { useActionState } from "react";
import { Send, CheckCircle2, XCircle } from "lucide-react";
import { sendMessageAction, type SendResult } from "@/app/actions";
import { Button, Textarea, Badge } from "@/components/ui/primitives";

export function MessageForm({
  maxLength,
  cooldownHours,
}: {
  maxLength: number;
  cooldownHours: number;
}) {
  const [state, action, pending] = useActionState<SendResult | null, FormData>(
    sendMessageAction,
    null,
  );

  if (state?.ok && state.deliveries) {
    return (
      <div className="rounded-2xl border-2 border-foreground bg-tone-green-bg p-5 shadow-[4px_4px_0_0_var(--color-foreground)]">
        <p className="font-extrabold text-lg">訊息已送出！</p>
        <ul className="mt-3 flex flex-col gap-2">
          {state.deliveries.map((d) => (
            <li key={d.webhookId} className="flex items-center gap-2">
              {d.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-tone-green-text" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              )}
              <span className="font-bold">{d.name}</span>
              <Badge className={d.ok ? "bg-card" : "bg-card text-destructive"}>
                {d.ok ? "送達" : `失敗${d.error ? `：${d.error}` : ""}`}
              </Badge>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          下一則要等 {cooldownHours} 小時後才能再傳。
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <Textarea
        name="content"
        required
        maxLength={maxLength}
        placeholder={`想對三屆同學說什麼？（上限 ${maxLength} 字）`}
        className="min-h-36"
        disabled={pending}
      />
      {state?.error && (
        <p className="font-mono text-xs font-bold text-destructive">{state.error}</p>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">
          每 {cooldownHours} 小時限傳一則，送出後無法收回。
        </p>
        <Button type="submit" variant="primary" disabled={pending}>
          <Send className="h-4 w-4" /> {pending ? "傳送中…" : "送出"}
        </Button>
      </div>
    </form>
  );
}
