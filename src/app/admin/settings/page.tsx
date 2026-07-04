import { getCooldownHours, getBannedWords, getUserGuidelines } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const [cooldownHours, bannedWords, userGuidelines] = await Promise.all([
    getCooldownHours(),
    getBannedWords(),
    getUserGuidelines(),
  ]);

  return (
    <div>
      <h1 className="font-extrabold text-2xl tracking-tight mb-2">設定</h1>
      <p className="font-medium text-muted-foreground mb-6">
        冷卻時間與禁詞清單，儲存後立即生效。
      </p>

      <div className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-[4px_4px_0_0_var(--color-foreground)] max-w-xl">
        <SettingsForm
          cooldownHours={cooldownHours}
          bannedWords={bannedWords.join("\n")}
          userGuidelines={userGuidelines}
        />
      </div>
    </div>
  );
}
