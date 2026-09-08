import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/trust/TrustBadges";

const COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Government Services", to: "/government-services" },
      { label: "Legal Rights", to: "/legal-rights" },
      { label: "Schemes", to: "/schemes" },
      { label: "Glossary", to: "/glossary" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Official Sources", to: "/official-sources" },
      { label: "Search", to: "/search" },
    ],
  },
  {
    title: "Legal & Policies",
    links: [
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms" },
      { label: "Disclaimer", to: "/disclaimer" },
      { label: "Accessibility", to: "/accessibility" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQs", to: "/faqs" },
      { label: "Help & Contact", to: "/contact" },
      { label: "Accessibility Help", to: "/accessibility" },
      { label: "Login", to: "/login" },
    ],
  },
];

const SOCIALS = [
  { Icon: Twitter, label: "NyayaMate AI on X" },
  { Icon: Linkedin, label: "NyayaMate AI on LinkedIn" },
  { Icon: Facebook, label: "NyayaMate AI on Facebook" },
  { Icon: Instagram, label: "NyayaMate AI on Instagram" },
  { Icon: Youtube, label: "NyayaMate AI on YouTube" },
];

export function Footer() {
  return (
    <footer
      style={{ backgroundColor: "var(--navy)" }}
      className="text-white"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Site footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.4fr_1.2fr]">
          {/* Brand */}
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              Your trusted AI guide for legal rights and government services — simple, secure and
              always available.
            </p>
            <TrustBadges light className="mt-6" />
            <ul className="mt-6 flex gap-2.5">
              {SOCIALS.map(({ Icon, label }) => (
                <li key={label}>
                  <a
                    href="#"
                    className="grid h-11 w-11 place-items-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-secondary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--navy)]"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns */}
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-bold text-white">{col.title}</h3>
                <ul className="mt-4 space-y-1">
                  {col.links.map((l) => (
                    <li key={`${col.title}-${l.label}`}>
                      <Link
                        to={l.to}
                        className="inline-flex min-h-11 items-center text-sm text-white/70 transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--navy)]"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-bold text-white">Newsletter</h3>
            <p className="mt-4 text-sm text-white/70">
              Get the latest guides and citizen updates.
            </p>
            <form className="mt-4 flex flex-col gap-2.5" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                placeholder="Your email address"
                className="min-h-11 rounded-lg border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/50 focus:border-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              />
              <Button className="min-h-11 bg-secondary font-semibold text-secondary-foreground hover:bg-secondary/90">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} NyayaMate AI. All rights reserved.
          </p>
          <p className="max-w-xl text-center text-xs text-white/60 sm:text-right">
            NyayaMate AI provides informational guidance only and is not a government website.{" "}
            <Link to="/disclaimer" className="font-semibold text-secondary hover:underline">
              Read the full disclaimer
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
