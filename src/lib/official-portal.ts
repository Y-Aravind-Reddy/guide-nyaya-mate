/**
 * Shared helpers for the Official Government Portal directory.
 * NyayaMate AI guides users, then redirects them to official government websites.
 */

export const OFFICIAL_PORTAL_COLS =
  "id, title, authority, department, ministry, government_level, category, jurisdiction, state, source_url, apply_online_url, update_url, track_status_url, forms_url, appointment_url, locate_office_url, mobile_app_url, complaint_url, help_centre_url, helpline, email, office_address, source_type, status, is_active, last_verified_at, link_status, website_link_status, apply_link_status, forms_link_status";

export type OfficialPortal = {
  id: string;
  title: string;
  authority: string | null;
  department: string | null;
  ministry: string | null;
  government_level: string | null;
  category?: string | null;
  jurisdiction?: string | null;
  state?: string | null;
  source_url: string | null;
  apply_online_url: string | null;
  update_url: string | null;
  track_status_url: string | null;
  forms_url: string | null;
  appointment_url: string | null;
  locate_office_url: string | null;
  mobile_app_url: string | null;
  complaint_url: string | null;
  help_centre_url: string | null;
  helpline: string | null;
  email: string | null;
  office_address?: string | null;
  source_type?: string | null;
  status: string | null;
  is_active: boolean | null;
  last_verified_at: string | null;
  link_status?: string | null;
  website_link_status?: string | null;
  apply_link_status?: string | null;
  forms_link_status?: string | null;
};

export type OfficialActionKey =
  | "website"
  | "apply"
  | "update"
  | "track"
  | "forms"
  | "appointment"
  | "locate"
  | "help"
  | "complaint"
  | "app";

export type OfficialAction = { key: OfficialActionKey; label: string; url: string };

const LABELS: Record<OfficialActionKey, string> = {
  website: "Visit Official Website",
  apply: "Apply Online",
  update: "Update Details",
  track: "Track Status",
  forms: "Download Forms",
  appointment: "Book Appointment",
  locate: "Locate Office",
  help: "Help Centre",
  complaint: "Complaint Portal",
  app: "Official Mobile App",
};

export const OFFICIAL_ACTION_LABELS = LABELS;

/** Link Verification statuses that must never be surfaced to public users. */
function healthy(status?: string | null): boolean {
  const s = (status ?? "").toLowerCase();
  return s !== "broken" && s !== "inactive";
}

function valid(url?: string | null): boolean {
  return !!url && /^https?:\/\//i.test(url.trim());
}

/** Returns only the action buttons that have a valid, non-broken official URL. */
export function buildOfficialActions(portal?: OfficialPortal | null): OfficialAction[] {
  if (!portal || portal.is_active === false) return [];
  const rows: { key: OfficialActionKey; url: string | null; health?: string | null }[] = [
    { key: "website", url: portal.source_url, health: portal.website_link_status },
    { key: "apply", url: portal.apply_online_url, health: portal.apply_link_status },
    { key: "update", url: portal.update_url },
    { key: "track", url: portal.track_status_url },
    { key: "forms", url: portal.forms_url, health: portal.forms_link_status },
    { key: "appointment", url: portal.appointment_url },
    { key: "locate", url: portal.locate_office_url },
    { key: "help", url: portal.help_centre_url },
    { key: "complaint", url: portal.complaint_url },
    { key: "app", url: portal.mobile_app_url },
  ];
  return rows
    .filter((r) => valid(r.url) && healthy(r.health))
    .map((r) => ({ key: r.key, label: LABELS[r.key], url: r.url!.trim() }));
}

export function formatVerifiedDate(d?: string | null): string | null {
  if (!d) return null;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return null;
  return t.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export const NO_PORTAL_MESSAGE =
  "No verified official Government portal is currently available.";

export const LEAVING_MESSAGE =
  "You are leaving NyayaMate AI and visiting an official Government website.";
