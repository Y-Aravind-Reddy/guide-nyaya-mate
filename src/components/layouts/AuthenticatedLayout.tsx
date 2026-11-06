import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  Flag,
  BookA,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileText,
  Gavel,
  HeartPulse,
  Rocket,
  BookOpen,
  Gauge,
  HelpCircle,
  History,
  LayoutDashboard,
  Landmark,
  Link2,
  LogOut,
  Menu,
  RefreshCw,
  Save,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQueryClient } from "@tanstack/react-query";

const itemClass = (active: boolean) =>
  `flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "bg-secondary/10 text-secondary-strong shadow-soft"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
      { icon: Sparkles, label: "AI Chat", to: "/ai-chat" },
      { icon: History, label: "Chat History", to: "/chat-history" },
    ],
  },
  {
    label: "Government & Legal",
    items: [
      { icon: Landmark, label: "Government Services", to: "/government-services" },
      { icon: BookOpen, label: "Legal Rights", to: "/legal-rights" },
      { icon: Scale, label: "Legal Knowledge Center", to: "/legal-knowledge" },
      { icon: Gavel, label: "Law Explorer", to: "/laws" },
      { icon: Trophy, label: "Schemes", to: "/schemes" },
      { icon: FileText, label: "Complaint Templates", to: "/complaint-templates" },
      { icon: HelpCircle, label: "FAQs", to: "/faqs" },
      { icon: BookA, label: "Glossary", to: "/glossary" },
      { icon: Link2, label: "Official Sources", to: "/official-sources" },
    ],
  },
  {
    label: "Personal",
    items: [
      { icon: Save, label: "Saved Items", to: "/saved" },
      { icon: UserRound, label: "Profile", to: "/profile" },
      { icon: Settings, label: "Settings", to: "/settings" },
    ],
  },
] as const;

const ADMIN_NAV = [
  { icon: Rocket, label: "Launch Readiness", to: "/admin/launch-readiness" },
  { icon: HeartPulse, label: "Knowledge Health", to: "/admin/knowledge-health" },
  { icon: ClipboardCheck, label: "Content Health", to: "/admin/content-health" },
  { icon: ClipboardList, label: "Content Ops", to: "/admin/content-ops" },
  { icon: BarChart3, label: "Analytics", to: "/admin/analytics" },
  { icon: Flag, label: "AI Review Queue", to: "/admin/review-queue" },
  { icon: Bell, label: "Notifications", to: "/admin/notifications" },
  { icon: Gauge, label: "AI Usage", to: "/admin/ai-usage" },
  { icon: RefreshCw, label: "KB Sync", to: "/admin/kb-sync" },
  { icon: Database, label: "Knowledge Base", to: "/knowledge-base" },
  { icon: ShieldCheck, label: "Admin Official Sources", to: "/admin/official-sources" },
  { icon: Activity, label: "Retrieval Analytics", to: "/retrieval-analytics" },
] as const;

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

type NavItem = { icon: typeof LayoutDashboard; label: string; to: string };

export function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const allItems: NavItem[] = [
    ...NAV_GROUPS.flatMap((g) => [...g.items]),
    ...ADMIN_NAV,
  ];
  const title = allItems.find((item) => isActive(pathname, item.to))?.label;

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? "";
  const email = user?.email ?? "";
  const initial =
    fullName?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "U";

  const handleSignOut = async () => {
    setMenuOpen(false);
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/", replace: true });
  };

  const renderItems = (items: readonly NavItem[]) =>
    items.map((item) => {
      const active = isActive(pathname, item.to);
      return (
        <Link
          key={item.label}
          to={item.to}
          onClick={() => setOpen(false)}
          title={item.label}
          className={itemClass(active)}
        >
          <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="hidden truncate lg:inline">{item.label}</span>
          <span className="sr-only lg:hidden">{item.label}</span>
        </Link>
      );
    });

  return (
    <div className="min-h-screen bg-background">
      <aside
        aria-label="Dashboard navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-border bg-card transition-transform duration-300 md:w-16 md:translate-x-0 lg:w-64 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between p-5 md:justify-center lg:justify-between lg:px-5">
          <Link to="/" className="md:hidden lg:block" aria-label="NyayaMate AI home">
            <Logo />
          </Link>
          <Link to="/" className="hidden md:grid lg:hidden" aria-label="NyayaMate AI home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              N
            </span>
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-5 pb-4 md:px-3 lg:px-5">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label}>
              <p className="px-3.5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground first:pt-1 md:hidden lg:block">
                {group.label}
              </p>
              {gi > 0 && <div className="my-2 hidden border-t border-border md:block lg:hidden" aria-hidden="true" />}
              {renderItems(group.items)}
            </div>
          ))}

          {isAdmin && (
            <>
              <p className="px-3.5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:hidden lg:block">
                Administration
              </p>
              <div className="my-2 hidden border-t border-border md:block lg:hidden" aria-hidden="true" />
              {renderItems(ADMIN_NAV)}
            </>
          )}
        </nav>

        <div className="shrink-0 border-t border-border p-5 md:p-3 lg:p-5">
          <div className="mb-3 flex items-center gap-3 md:hidden lg:flex">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {fullName || email.split("@")[0] || "Account"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className={itemClass(false) + " text-destructive hover:bg-destructive/10 hover:text-destructive"}
            title="Logout"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="hidden truncate lg:inline">Logout</span>
            <span className="sr-only lg:hidden">Logout</span>
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="md:pl-16 lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-3.5 backdrop-blur-xl sm:px-6">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = (new FormData(e.currentTarget).get("q") as string)?.trim();
              navigate({ to: "/search", search: q ? { q } : {} });
            }}
            className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 sm:max-w-md"
          >
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              name="q"
              placeholder="Search services, guides…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </form>
          {isAdmin ? (
            <Link
              to="/admin/notifications"
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent" />
            </Link>
          ) : (
            <button
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
              aria-label="Account menu"
            >
              {initial}
            </button>
            {menuOpen && (
              <>
                <button
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close account menu"
                  tabIndex={-1}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-soft"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {fullName || email.split("@")[0] || "Account"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                  </div>
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                  >
                    <UserRound className="h-4 w-4" aria-hidden="true" /> Profile
                  </Link>
                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" /> Settings
                  </Link>
                  <button
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {title && <h1 className="sr-only">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}
