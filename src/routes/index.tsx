import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { ServicesGrid } from "@/components/landing/ServicesGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Services } from "@/components/landing/Services";
import { WhyNyayaMate } from "@/components/landing/WhyNyayaMate";
import { SocialProof } from "@/components/landing/SocialProof";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NyayaMate AI — Your AI Guide for Legal Rights & Government Services" },
      {
        name: "description",
        content:
          "Get step-by-step guidance for legal procedures, government documents, and citizen services in simple language with NyayaMate AI.",
      },
      {
        property: "og:title",
        content: "NyayaMate AI — AI Guide for Legal Rights & Government Services",
      },
      {
        property: "og:description",
        content:
          "Step-by-step guidance for legal procedures, government documents, and citizen services in simple language.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <ServicesGrid />
        <Services />
        <HowItWorks />
        <WhyNyayaMate />
        <SocialProof />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
