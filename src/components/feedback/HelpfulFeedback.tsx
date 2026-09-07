import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

export function HelpfulFeedback({
  contentType,
  contentSlug,
  contentTitle,
}: {
  contentType: "service" | "legal_topic" | "scheme" | "faq" | "page";
  contentSlug: string;
  contentTitle?: string;
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [sent, setSent] = useState<null | boolean>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (helpful: boolean) => {
    if (busy || sent !== null) return;
    setBusy(true);
    const { error } = await supabase.from("content_feedback").insert({
      content_type: contentType,
      content_slug: contentSlug,
      content_title: contentTitle ?? null,
      helpful,
      user_id: user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not send feedback. Please try again.");
      return;
    }
    setSent(helpful);
    toast.success(t("feedback.thanks"));
  };

  return (
    <section
      aria-label="Content feedback"
      className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <p className="text-sm font-semibold text-foreground">{t("feedback.question")}</p>
      {sent === null ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-secondary hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ThumbsUp className="h-4 w-4" aria-hidden="true" /> {t("feedback.yes")}
          </button>
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-destructive hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ThumbsDown className="h-4 w-4" aria-hidden="true" /> {t("feedback.no")}
          </button>
        </div>
      ) : (
        <p role="status" className="text-sm font-medium text-secondary">
          {t("feedback.thanks")}
        </p>
      )}
    </section>
  );
}
