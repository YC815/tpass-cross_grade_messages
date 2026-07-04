"use client";

import { useActionState } from "react";
import { Plus, Radio } from "lucide-react";
import {
  addWebhookAction,
  sendTestWebhookAction,
  type WebhookResult,
} from "@/app/admin/webhooks/actions";
import { Button, Input } from "@/components/ui/primitives";

export function WebhookForm() {
  const [state, action, pending] = useActionState<WebhookResult | null, FormData>(
    addWebhookAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Input
          name="name"
          required
          placeholder="名稱（例如：第一屆）"
          className="w-48 flex-none"
          disabled={pending}
        />
        <Input
          name="url"
          type="url"
          required
          placeholder="https://chat.googleapis.com/v1/spaces/…"
          className="flex-1 min-w-64 font-mono text-sm"
          disabled={pending}
        />
        <Button type="submit" variant="primary" disabled={pending}>
          <Plus className="h-4 w-4" /> 新增
        </Button>
      </div>
      {state?.error && (
        <p className="font-mono text-xs font-bold text-destructive">{state.error}</p>
      )}
      {state?.ok && state.warning && (
        <p className="font-mono text-xs font-bold text-tone-orange-text">{state.warning}</p>
      )}
      {state?.ok && !state.warning && (
        <p className="font-mono text-xs font-bold text-primary">已新增 webhook。</p>
      )}
    </form>
  );
}

export function TestWebhookButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState<WebhookResult | null, FormData>(
    sendTestWebhookAction,
    null,
  );

  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" disabled={pending}>
        <Radio className="h-4 w-4" /> {pending ? "測試中…" : "測試"}
      </Button>
      {state && (
        <span
          className={`font-mono text-xs font-bold ${state.ok ? "text-primary" : "text-destructive"}`}
        >
          {state.ok ? "送達 ✓" : state.error}
        </span>
      )}
    </form>
  );
}
