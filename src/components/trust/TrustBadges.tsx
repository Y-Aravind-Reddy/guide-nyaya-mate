import { Accessibility, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function TrustBadges({ className, light = false }: { className?: string; light?: boolean }) {
  const { t } = useI18n();
  const badges = [
    { icon: ShieldCheck, label: t("trust.verifiedSources") },
    { icon: Accessibility, label: t("trust.accessibility") },
    { icon: Lock, label: t("trust.secure") },
    { icon: UserCheck, label: t("trust.privacy") },
  ];

  return (
    <ul className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {badges.map((b) => (
        <li
          key={b.label}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold",
            light
              ? "bg-white/10 text-white"
              : "border border-border bg-card text-foreground shadow-soft",
          )}
        >
          <b.icon className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
          {b.label}
        </li>
      ))}
    </ul>
  );
}
