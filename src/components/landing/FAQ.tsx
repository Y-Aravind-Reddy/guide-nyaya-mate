import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is NyayaMate free?",
    a: "Yes. Core guidance on legal rights and government services is completely free for every citizen. Premium features may be added later, but essentials stay free.",
  },
  {
    q: "Can I trust the information?",
    a: "Our AI is grounded in official government sources and verified legal references. We always encourage confirming critical actions on the relevant official portal.",
  },
  {
    q: "How is my data protected?",
    a: "Your conversations are encrypted with 256-bit encryption. We never sell your data, and you can delete your history at any time.",
  },
  {
    q: "Is NyayaMate government affiliated?",
    a: "NyayaMate AI is an independent assistant. We are not a government body, but we point you to the correct official services and portals.",
  },
  {
    q: "Which languages are supported?",
    a: "We currently support English, Hindi, Telugu, and Tamil, with more Indian languages being added regularly.",
  },
];

function CourthouseShield() {
  return (
    <svg viewBox="0 0 400 360" className="h-auto w-full max-w-md" role="img" aria-label="Courthouse and security shield illustration">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
        <linearGradient id="shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect x="20" y="20" width="360" height="320" rx="28" fill="url(#sky)" />
      {/* courthouse */}
      <g fill="#2563eb">
        <polygon points="120,90 280,90 200,50" />
        <rect x="120" y="92" width="160" height="14" rx="3" />
        <rect x="132" y="112" width="14" height="120" />
        <rect x="166" y="112" width="14" height="120" />
        <rect x="220" y="112" width="14" height="120" />
        <rect x="254" y="112" width="14" height="120" />
        <rect x="116" y="236" width="168" height="16" rx="3" />
      </g>
      <rect x="116" y="252" width="168" height="8" rx="3" fill="#111827" />
      {/* steps */}
      <rect x="104" y="262" width="192" height="9" rx="3" fill="#cbd5e1" />
      <rect x="92" y="273" width="216" height="9" rx="3" fill="#e2e8f0" />
      {/* shield */}
      <g transform="translate(248,176)">
        <path
          d="M52 0 L104 22 V70 C104 110 80 134 52 146 C24 134 0 110 0 70 V22 Z"
          fill="url(#shield)"
        />
        <path
          d="M30 70 L46 88 L78 50"
          fill="none"
          stroke="#ffffff"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 bg-card py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <span className="text-sm font-bold uppercase tracking-wider text-secondary">FAQ</span>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about using NyayaMate AI.
          </p>

          <Accordion type="single" collapsible className="mt-8 w-full">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`item-${i}`}
                className="mb-3 rounded-xl border border-border bg-background px-5 shadow-soft"
              >
                <AccordionTrigger className="py-4 text-left text-base font-semibold text-foreground hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="animate-float-slow">
            <CourthouseShield />
          </div>
        </div>
      </div>
    </section>
  );
}
