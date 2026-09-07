import { useI18n } from "@/lib/i18n";

export function SkipToContent({ targetId = "main-content" }: { targetId?: string }) {
  const { t } = useI18n();
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {t("a11y.skip")}
    </a>
  );
}
