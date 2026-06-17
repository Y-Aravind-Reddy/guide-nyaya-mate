import { ArrowRight, MessageSquare, Send, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  "Visit the official Passport Seva Portal",
  "Register & create your account",
  "Fill the online application form",
  "Pay the application fee",
  "Book an appointment",
  "Visit the Passport Seva Kendra (PSK)",
  "Complete police verification",
  "Receive your passport by post",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36">
      {/* background flourishes */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
        {/* Left */}
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-primary shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            AI-powered citizen assistance
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">
            Your AI Guide for{" "}
            <span className="text-gradient-primary">Legal Rights</span> &{" "}
            <span className="text-secondary">Government Services</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Get step-by-step guidance for legal procedures, government documents, and
            citizen services in simple language.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 bg-primary px-7 text-base font-semibold text-primary-foreground shadow-premium hover:bg-primary/90"
            >
              <MessageSquare className="h-5 w-5" /> Start Chat
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-border bg-card px-7 text-base font-semibold text-foreground hover:bg-muted"
            >
              Explore Services <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
            {[
              { icon: Users, label: "Trusted by Citizens" },
              { icon: Sparkles, label: "AI Powered" },
              { icon: ShieldCheck, label: "Secure & Private" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-secondary/15 text-secondary">
                  <b.icon className="h-3.5 w-3.5" />
                </span>
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right — chat window */}
        <div className="relative animate-fade-up [animation-delay:150ms]">
          <div className="absolute -right-6 -top-6 hidden h-24 w-24 animate-float rounded-2xl bg-accent/20 blur-2xl sm:block" />
          <div className="relative rounded-[24px] border border-border bg-card/90 p-2 shadow-premium backdrop-blur-xl">
            {/* window header */}
            <div className="flex items-center justify-between rounded-t-[18px] bg-primary px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/15">
                  <Sparkles className="h-4 w-4 text-white" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">NyayaMate AI</p>
                  <p className="flex items-center gap-1 text-[11px] text-white/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse-ring" /> Online
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
              </div>
            </div>

            {/* messages */}
            <div className="max-h-[420px] space-y-4 overflow-hidden px-4 py-5">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-soft">
                  How do I apply for a passport in India?
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-border bg-background px-4 py-3 text-sm text-foreground shadow-soft">
                  <p className="font-medium text-foreground">
                    Here's a simple step-by-step guide:
                  </p>
                  <ul className="mt-2.5 space-y-2">
                    {STEPS.map((s, i) => (
                      <li key={s} className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-[13px] leading-snug text-muted-foreground">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* input */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 shadow-soft">
                <input
                  disabled
                  placeholder="Ask about any government service…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Send className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
