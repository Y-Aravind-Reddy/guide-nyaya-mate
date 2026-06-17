import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Bookmark,
  BookOpen,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Landmark,
  LogOut,
  Menu,
  Save,
  Search,
  Settings,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NyayaMate AI" },
      { name: "description", content: "Your NyayaMate AI dashboard for legal and government guidance." },
    ],
  }),
  component: DashboardPage,
});

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Landmark, label: "Government Services" },
  { icon: BookOpen, label: "Legal Topics" },
  { icon: Save, label: "Saved Guides" },
  { icon: Bookmark, label: "Bookmarks" },
  { icon: UserRound, label: "Profile" },
  { icon: Settings, label: "Settings" },
];

const STATS = [
  { label: "Guides Viewed", value: "48", change: "+12%", icon: BookOpen, bg: "bg-primary/10", tint: "text-primary" },
  { label: "Saved Guides", value: "12", change: "+3", icon: Save, bg: "bg-secondary/10", tint: "text-secondary" },
  { label: "Documents Ready", value: "7", change: "+2", icon: FileText, bg: "bg-accent/10", tint: "text-accent" },
  { label: "Bookmarks", value: "21", change: "+5", icon: Bookmark, bg: "bg-primary/10", tint: "text-primary" },
];

const RECENT = [
  { title: "Passport Application Process", cat: "Government Services", progress: 80 },
  { title: "Property Registration Guide", cat: "Legal Procedures", progress: 45 },
  { title: "Consumer Rights Basics", cat: "Legal Rights", progress: 100 },
  { title: "Driving Licence Renewal", cat: "Government Services", progress: 30 },
];

const QUICK = ["Passport", "PAN Card", "Aadhaar", "Driving Licence", "Property", "Consumer Rights"];

function DashboardPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card p-5 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="mt-8 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                item.active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </button>
          ))}
        </nav>

        <Link
          to="/login"
          className="absolute inset-x-5 bottom-5 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4.5 w-4.5" /> Logout
        </Link>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-3.5 backdrop-blur-xl sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 sm:max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search services, guides…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground" aria-label="Notifications">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent" />
          </button>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            R
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {/* Welcome banner */}
          <div className="relative overflow-hidden rounded-[24px] bg-navy p-7 text-white shadow-premium sm:p-9">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
            <div className="relative">
              <h1 className="text-2xl font-extrabold sm:text-3xl">Welcome back, Rahul 👋</h1>
              <p className="mt-2 max-w-lg text-white/70">
                Continue where you left off or explore new government and legal services.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur transition-colors hover:bg-white/20"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-[20px] border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl ${s.bg} ${s.tint}`}>
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                    <TrendingUp className="h-3.5 w-3.5" /> {s.change}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-extrabold text-foreground">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Continue + quick links */}
          <div className="mt-7 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[20px] border border-border bg-card p-6 shadow-card lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Continue Reading</h2>
                <button className="text-sm font-semibold text-primary hover:underline">View all</button>
              </div>
              <div className="mt-5 space-y-3">
                {RECENT.map((r) => (
                  <div
                    key={r.title}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.cat}</p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-secondary" style={{ width: `${r.progress}%` }} />
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-border bg-card p-6 shadow-card">
              <h2 className="text-lg font-bold text-foreground">Popular Services</h2>
              <div className="mt-5 space-y-2.5">
                {["Passport Services", "Property Registration", "Driving Licence", "Government Schemes", "Cyber Crime"].map(
                  (s) => (
                    <button
                      key={s}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/40"
                    >
                      {s}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
