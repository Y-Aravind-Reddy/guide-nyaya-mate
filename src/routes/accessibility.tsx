import { createFileRoute } from "@tanstack/react-router";
import { Accessibility, Keyboard, Eye, Mail, MonitorSmartphone } from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { TrustBadges } from "@/components/trust/TrustBadges";

export const Route = createFileRoute("/accessibility")({
  head: () => ({
    meta: [
      { title: "Accessibility Statement — NyayaMate AI" },
      {
        name: "description",
        content:
          "NyayaMate AI is committed to WCAG 2.1 AA accessibility: keyboard navigation, screen reader support, clear contrast and accessible forms for every citizen.",
      },
      { property: "og:title", content: "Accessibility Statement — NyayaMate AI" },
      {
        property: "og:description",
        content: "Our WCAG 2.1 AA commitment, keyboard shortcuts, screen reader support and accessibility contact.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccessibilityPage,
});

const KEYBOARD = [
  ["Tab / Shift + Tab", "Move forward or backward between links, buttons and form fields."],
  ["Enter or Space", "Activate the focused link, button, accordion or menu item."],
  ["Escape", "Close an open dialog, dropdown or mobile menu."],
  ["Arrow keys", "Move between options inside menus, dropdowns and tab lists."],
];

function AccessibilityPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Accessibility" }]} />
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3.5 py-1.5 text-xs font-semibold text-primary">
          <Accessibility className="h-3.5 w-3.5" aria-hidden="true" /> WCAG 2.1 AA
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Accessibility Statement
        </h1>
        <p className="mt-3 text-muted-foreground">
          NyayaMate AI is built so every citizen — including people using screen readers,
          keyboard-only navigation, magnification or assistive input — can access legal and
          government guidance independently.
        </p>

        <TrustBadges className="mt-6" />

        <section className="mt-10" aria-labelledby="commitment">
          <h2 id="commitment" className="text-xl font-bold text-foreground">
            Our commitment
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>We aim to conform to WCAG 2.1 Level AA and GIGW 3.0 guidance for citizen services.</li>
            <li>Pages use semantic HTML with landmarks, a single main heading and logical heading order.</li>
            <li>All interactive elements are reachable by keyboard with a visible focus indicator.</li>
            <li>Text and interface colours are checked for sufficient contrast.</li>
            <li>Touch targets are at least 44 x 44 pixels on mobile.</li>
            <li>Forms have visible labels, helpful errors and clear instructions.</li>
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="keyboard">
          <h2 id="keyboard" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Keyboard className="h-5 w-5 text-primary" aria-hidden="true" /> Keyboard navigation
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A “Skip to main content” link appears as soon as you press Tab on any page.
          </p>
          <table className="mt-4 w-full border-collapse overflow-hidden rounded-xl border border-border text-left text-sm">
            <caption className="sr-only">Keyboard shortcuts supported across NyayaMate AI</caption>
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold text-foreground">Key</th>
                <th scope="col" className="px-4 py-3 font-semibold text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {KEYBOARD.map(([key, action]) => (
                <tr key={key} className="border-t border-border">
                  <th scope="row" className="px-4 py-3 font-medium text-foreground">{key}</th>
                  <td className="px-4 py-3 text-muted-foreground">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-10" aria-labelledby="screenreader">
          <h2 id="screenreader" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Eye className="h-5 w-5 text-primary" aria-hidden="true" /> Screen reader support
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The platform is tested with NVDA on Windows, VoiceOver on macOS and iOS, and TalkBack on
            Android. Images carry alternative text, decorative icons are hidden from assistive
            technology, status messages are announced politely, and dialogs trap focus until closed.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="compat">
          <h2 id="compat" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <MonitorSmartphone className="h-5 w-5 text-primary" aria-hidden="true" /> Compatibility
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            NyayaMate AI works on current versions of Chrome, Edge, Firefox and Safari on desktop and
            mobile, and supports browser zoom up to 200% without loss of content.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-soft" aria-labelledby="contact-a11y">
          <h2 id="contact-a11y" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" /> Accessibility feedback
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If any part of this platform is difficult to use, tell us and we will respond within 5
            working days.
          </p>
          <p className="mt-3 text-sm font-semibold text-foreground">
            accessibility@nyayamate.ai
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Please replace this with your real support address before launch.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
