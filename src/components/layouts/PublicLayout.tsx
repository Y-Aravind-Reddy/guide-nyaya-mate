import type { ReactNode } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { TrustBanner } from "@/components/trust/TrustBanner";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { useAuth } from "@/hooks/useAuth";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background" aria-busy="true">
        <span role="status" className="text-sm text-muted-foreground">
          Loading NyayaMate AI…
        </span>
      </div>
    );
  }

  if (user) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }

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
