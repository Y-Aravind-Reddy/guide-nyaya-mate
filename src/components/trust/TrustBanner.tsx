import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function TrustBanner() {
  return (
    <div role="note" className="border-b border-border bg-primary-light/70">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium text-primary sm:text-sm">
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{useI18n().t("trust.banner")}</span>
      </div>
    </div>
  );
}
