import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

const NAV_LINKS = [
  { key: "nav.home", label: "Home", to: "/" },
  { key: "nav.services", label: "Government Services", to: "/government-services" },
  { key: "nav.rights", label: "Legal Rights", to: "/legal-rights" },
  { key: "nav.schemes", label: "Schemes", to: "/schemes" },
  { key: "nav.faqs", label: "FAQs", to: "/faqs" },
  { key: "nav.glossary", label: "Glossary", to: "/glossary" },
  { key: "nav.about", label: "About", to: "/about" },
  { key: "nav.contact", label: "Contact", to: "/contact" },
] as const;


export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl shadow-soft"
          : "bg-transparent",
      )}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="NyayaMate AI home" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Logo />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="relative rounded text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&.active]:text-primary"
            >
              {t(l.key, l.label)}
            </Link>
          ))}
          <LanguageSwitcher />
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Button asChild className="bg-primary font-semibold text-primary-foreground shadow-soft hover:bg-primary/90">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="font-semibold text-foreground hover:bg-muted">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild className="bg-primary font-semibold text-primary-foreground shadow-soft hover:bg-primary/90">
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="grid h-11 w-11 place-items-center rounded-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-border bg-background/95 px-4 pb-6 pt-3 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t(l.key, l.label)}
              </Link>
            ))}
          </div>
          <div className="mt-3"><LanguageSwitcher /></div>
          <div className="mt-4 flex flex-col gap-2">
            {user ? (
              <Button asChild className="w-full bg-primary text-primary-foreground">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild className="w-full bg-primary text-primary-foreground">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
