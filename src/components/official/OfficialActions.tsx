import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building2,
  CalendarClock,
  Download,
  ExternalLink,
  FileSearch,
  LifeBuoy,
  MapPin,
  Megaphone,
  PencilLine,
  Send,
  Smartphone,
  ShieldAlert,
} from "lucide-react";
import { VerifiedBadge } from "@/components/trust/VerifiedBadge";
import { supabase } from "@/integrations/supabase/client";
import {
  buildOfficialActions,
  formatVerifiedDate,
  LEAVING_MESSAGE,
  NO_PORTAL_MESSAGE,
  type OfficialAction,
  type OfficialActionKey,
  type OfficialPortal,
} from "@/lib/official-portal";

const ICONS: Record<OfficialActionKey, typeof ExternalLink> = {
  website: ExternalLink,
  apply: Send,
  update: PencilLine,
  track: FileSearch,
  forms: Download,
  appointment: CalendarClock,
  locate: MapPin,
  help: LifeBuoy,
  complaint: Megaphone,
  app: Smartphone,
};

type Props = {
  portal?: OfficialPortal | null;
  serviceSlug?: string | null;
  serviceTitle?: string | null;
  /** compact = inline chips (AI chat, cards); full = titled panel with source meta */
  variant?: "full" | "compact";
  className?: string;
};

/**
 * Renders the verified official-government actions for a service.
 * Every link opens in a new tab after an explicit "you are leaving" confirmation.
 */
export function OfficialActions({
  portal,
  serviceSlug,
  serviceTitle,
  variant = "full",
  className,
}: Props) {
  const [pending, setPending] = useState<OfficialAction | null>(null);
  const actions = buildOfficialActions(portal);

  const logClick = (action: OfficialAction) => {
    void supabase
      .from("official_link_clicks")
      .insert({
        source_id: portal?.id ?? null,
        service_slug: serviceSlug ?? null,
        service_title: serviceTitle ?? portal?.title ?? null,
        action: action.key,
        target_url: action.url,
      })
      .then(undefined, () => undefined);
  };

  const confirmOpen = () => {
    if (!pending) return;
    logClick(pending);
    window.open(pending.url, "_blank", "noopener,noreferrer");
    setPending(null);
  };

  const buttons = (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => {
        const Icon = ICONS[a.key];
        return (
          <a
            key={a.key}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              setPending(a);
            }}
            className={
              variant === "compact"
                ? "inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary"
                : "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground shadow-soft transition-colors hover:border-primary/40 hover:text-primary"
            }
          >
            <Icon className={variant === "compact" ? "h-3 w-3" : "h-4 w-4"} aria-hidden="true" />
            {a.label}
          </a>
        );
      })}
    </div>
  );

  const dialog = (
    <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leaving NyayaMate AI</AlertDialogTitle>
          <AlertDialogDescription>
            {LEAVING_MESSAGE}
            {pending ? (
              <span className="mt-2 block break-all font-medium text-foreground">{pending.url}</span>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay here</AlertDialogCancel>
          <AlertDialogAction onClick={confirmOpen}>Continue to official site</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === "compact") {
    if (actions.length === 0) return null;
    return (
      <div className={className}>
        {buttons}
        {dialog}
      </div>
    );
  }

  if (!portal || actions.length === 0) {
    return (
      <div
        className={`flex items-start gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground ${className ?? ""}`}
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <span>{NO_PORTAL_MESSAGE}</span>
      </div>
    );
  }

  const verified = formatVerifiedDate(portal.last_verified_at);

  return (
    <div className={`rounded-[20px] border border-border bg-card p-6 shadow-card ${className ?? ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Building2 className="h-5 w-5 text-primary" aria-hidden="true" /> Official Actions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {portal.title}
            {portal.department ? ` · ${portal.department}` : ""}
            {portal.ministry ? ` · ${portal.ministry}` : ""}
          </p>
          {portal.government_level || verified ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {portal.government_level ? `${portal.government_level} Government` : ""}
              {portal.government_level && verified ? " · " : ""}
              {verified ? `Last verified ${verified}` : ""}
            </p>
          ) : null}
        </div>
        {portal.status === "verified" ? (
          <VerifiedBadge label="Verified Government Source" date={portal.last_verified_at} size="md" />
        ) : null}
      </div>

      <div className="mt-4">{buttons}</div>

      {portal.helpline || portal.email ? (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          {portal.helpline ? `Official helpline: ${portal.helpline}` : ""}
          {portal.helpline && portal.email ? " · " : ""}
          {portal.email ? `Email: ${portal.email}` : ""}
        </p>
      ) : null}

      <p className="mt-2 text-xs text-muted-foreground">
        NyayaMate AI is an AI guidance platform and never replaces official Government websites.
      </p>

      {dialog}
    </div>
  );
}
