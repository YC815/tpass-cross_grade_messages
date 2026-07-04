"use client";

import { useActionState } from "react";
import { Ban } from "lucide-react";
import { banUserAction, type BanResult } from "@/app/admin/users/actions";
import { Button, Input } from "@/components/ui/primitives";

export function BanUserForm({ sub }: { sub: string }) {
  const [state, action, pending] = useActionState<BanResult | null, FormData>(
    banUserAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="sub" value={sub} />
      <div className="flex flex-wrap gap-2">
        <Input
          name="hours"
          type="number"
          min={1}
          placeholder="小時數（留空 = 永久）"
          className="w-full sm:w-44 sm:flex-none"
          disabled={pending}
        />
        <Input
          name="reason"
          required
          placeholder="封禁原因（必填，會顯示給使用者）"
          className="w-full sm:flex-1 sm:min-w-48"
          disabled={pending}
        />
        <Button type="submit" variant="destructive" size="sm" disabled={pending} className="w-full sm:w-auto">
          <Ban className="h-4 w-4" /> 封鎖
        </Button>
      </div>
      {state?.error && (
        <p className="font-mono text-xs font-bold text-destructive">{state.error}</p>
      )}
    </form>
  );
}
