import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, useI18n, type LanguageCode } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const { lang, setLang } = useI18n();
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Change language, current language ${current.label}`}
        className={cn(
          "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          light ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-primary",
        )}
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        {current.short}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onSelect={() => setLang(l.code as LanguageCode)}
            className="flex items-center justify-between"
          >
            <span>{l.label}</span>
            {l.code === lang && <Check className="h-4 w-4 text-secondary" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
