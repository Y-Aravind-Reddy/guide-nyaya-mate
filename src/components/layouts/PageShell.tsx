import type { ReactNode } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { TrustBanner } from "@/components/trust/TrustBanner";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <Navbar />
      <div className="pt-16">
        <TrustBanner />
      </div>
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
