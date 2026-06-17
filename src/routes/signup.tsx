import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Phone,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Home,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — NyayaMate AI" },
      {
        name: "description",
        content:
          "Create your free NyayaMate AI account to access trusted, step-by-step guidance for legal rights and government services.",
      },
    ],
  }),
  component: SignupPage,
});

const FEATURES = [
  { icon: Scale, label: "Understand Legal Rights" },
  { icon: Home, label: "Government Services" },
  { icon: CreditCard, label: "Property Guidance" },
  { icon: Sparkles, label: "AI Assistance" },
];

const DOCS = [
  { label: "Passport", className: "left-0 top-4 animate-float" },
  { label: "PAN Card", className: "right-2 top-16 animate-float-slow" },
  { label: "Aadhaar", className: "left-4 bottom-24 animate-float-slow" },
  { label: "Driving Licence", className: "right-0 bottom-10 animate-float" },
];

const LANGS = ["English", "Hindi", "Telugu", "Tamil"];

function RobotIllustration() {
  return (
    <svg viewBox="0 0 240 240" className="h-56 w-56 drop-shadow-xl" role="img" aria-label="Friendly AI robot">
      <defs>
        <linearGradient id="body-su" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0b3d91" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="216" rx="64" ry="12" fill="#000" opacity="0.12" />
      <rect x="108" y="38" width="24" height="22" rx="6" fill="#94a3b8" />
      <circle cx="120" cy="34" r="9" fill="#10b981" />
      <rect x="58" y="58" width="124" height="100" rx="32" fill="url(#body-su)" />
      <rect x="74" y="80" width="92" height="56" rx="22" fill="#0a2c66" />
      <circle cx="102" cy="108" r="11" fill="#10b981" />
      <circle cx="138" cy="108" r="11" fill="#10b981" />
      <circle cx="105" cy="105" r="3.5" fill="#fff" />
      <circle cx="141" cy="105" r="3.5" fill="#fff" />
      <path d="M104 126 Q120 138 136 126" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="78" y="162" width="84" height="46" rx="20" fill="url(#body-su)" />
      <rect x="96" y="176" width="48" height="8" rx="4" fill="#f59e0b" />
      <rect x="40" y="92" width="16" height="46" rx="8" fill="#2563eb" />
      <rect x="184" y="92" width="16" height="46" rx="8" fill="#2563eb" />
      <circle cx="48" cy="140" r="10" fill="#f59e0b" />
      <circle cx="192" cy="140" r="10" fill="#f59e0b" />
    </svg>
  );
}

function Field({
  label,
  icon: Icon,
  type = "text",
  placeholder,
}: {
  label: string;
  icon: typeof Mail;
  type?: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 transition-colors focus-within:border-primary">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input
          type={type}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </div>
  );
}

function SignupPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [lang, setLang] = useState("English");

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Left panel */}
      <div
        className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col xl:p-14"
        style={{ background: "linear-gradient(150deg, var(--navy), var(--primary))" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.28),transparent_45%)]" />
        <div className="relative z-10">
          <Logo light />
        </div>

        <div className="relative z-10 mx-auto mt-8 flex h-64 w-full max-w-sm items-center justify-center">
          <RobotIllustration />
          {DOCS.map((d) => (
            <span
              key={d.label}
              className={`absolute ${d.className} flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md`}
            >
              <CreditCard className="h-3.5 w-3.5 text-secondary" />
              {d.label}
            </span>
          ))}
        </div>

        <div className="relative z-10 mt-6">
          <h1 className="text-3xl font-extrabold leading-tight xl:text-4xl">
            Join thousands navigating <span className="text-secondary">Legal Rights</span> &
            Government Services
          </h1>
          <p className="mt-3 text-white/70">
            Simple language. Clear guidance. Empowering every citizen.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary/20 text-secondary">
                  <f.icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-md">
              <Lock className="h-3.5 w-3.5 text-secondary" /> 256-bit Encryption
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary" /> Trusted by Citizens
            </span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-5 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-soft">
            <Globe className="h-4 w-4 text-primary" /> {lang}
          </button>
        </div>

        <div className="w-full max-w-md rounded-[20px] border border-border bg-card p-8 shadow-premium animate-fade-up">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-foreground lg:mt-0">Create your account</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Start your citizen journey in under a minute.
          </p>

          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Field label="Full Name" icon={UserRound} placeholder="Your full name" />
            <Field label="Email" icon={Mail} type="email" placeholder="you@example.com" />
            <Field label="Phone" icon={Phone} type="tel" placeholder="+91 98765 43210" />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 transition-colors focus-within:border-primary">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Field label="Confirm Password" icon={Lock} type="password" placeholder="••••••••" />

            <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--primary)]" />
              <span>
                I accept the{" "}
                <a href="#" className="font-medium text-primary hover:underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="font-medium text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            <Button className="h-11 w-full bg-primary text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90">
              Create Account
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">or sign up with</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
              <GoogleIcon /> Google
            </button>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
              <Smartphone className="h-5 w-5 text-primary" /> OTP
            </button>
          </div>

          <p className="mt-7 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={
                lang === l
                  ? "rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft"
                  : "rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 7.1 29.6 5 24 5 16 5 9.1 9.6 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.1 26.7 35 24 35c-5.3 0-9.7-3.6-11.3-8.4l-6.5 5C9 38.4 15.9 43 24 43z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41 35.5 44 30.2 44 23c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
