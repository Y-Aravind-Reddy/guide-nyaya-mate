import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

const COLUMNS = [
  {
    title: "Company",
    links: ["About", "Careers", "Press", "Contact"],
  },
  {
    title: "Explore",
    links: ["Services", "Legal Rights", "Government Schemes", "Documents"],
  },
  {
    title: "Resources",
    links: ["Blog", "Guides", "Help Center", "Community"],
  },
  {
    title: "Support",
    links: ["FAQ", "Privacy Policy", "Terms of Service", "Security"],
  },
];

const SOCIALS = [Twitter, Linkedin, Facebook, Instagram, Youtube];

export function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--navy)" }} className="text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr_1.4fr]">
          {/* Brand */}
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Your trusted AI guide for legal rights and government services — simple,
              secure, and always available.
            </p>
            <div className="mt-6 flex gap-2.5">
              {SOCIALS.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-secondary hover:text-white"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-bold text-white">{col.title}</h4>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-white/60 transition-colors hover:text-secondary">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-bold text-white">Newsletter</h4>
            <p className="mt-4 text-sm text-white/60">
              Get the latest guides and citizen updates.
            </p>
            <form
              className="mt-4 flex flex-col gap-2.5"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Your email address"
                className="rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-secondary focus:outline-none"
              />
              <Button className="bg-secondary font-semibold text-secondary-foreground hover:bg-secondary/90">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} NyayaMate AI. All rights reserved.
          </p>
          <p className="text-xs text-white/50">
            Made for citizens with{" "}
            <Link to="/login" className="font-semibold text-secondary hover:underline">
              trust & care
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
