import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Globe, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Legal Rights", href: "/#why" },
  { label: "About", href: "/#testimonials" },
  { label: "Resources", href: "/#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
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
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-primary after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100"
            >
              {l.label}
            </a>
          ))}
          <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <Globe className="h-4 w-4" />
            EN
          </button>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" className="font-semibold text-foreground hover:bg-muted">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild className="bg-primary font-semibold text-primary-foreground shadow-soft hover:bg-primary/90">
            <Link to="/login">Get Started</Link>
          </Button>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg text-foreground lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-background/95 px-4 pb-6 pt-3 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild className="w-full bg-primary text-primary-foreground">
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
