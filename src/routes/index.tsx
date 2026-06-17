import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Services } from "@/components/landing/Services";
import { WhyNyayaMate } from "@/components/landing/WhyNyayaMate";
import { SocialProof } from "@/components/landing/SocialProof";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

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
        <Services />
        <WhyNyayaMate />
        <SocialProof />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
