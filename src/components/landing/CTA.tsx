import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-navy px-6 py-16 text-center shadow-premium sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
          </div>
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Start free today
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Ready to simplify legal and government services?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
              Join thousands of citizens navigating their rights and services with clarity.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 bg-secondary px-7 text-base font-semibold text-secondary-foreground hover:bg-secondary/90"
              >
                <Link to="/signup">
                  Get Started <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/30 bg-white/5 px-7 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
              >
                <a href="#all-services">Explore Services</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
