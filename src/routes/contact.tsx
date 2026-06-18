import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Clock, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — NyayaMate AI" },
      { name: "description", content: "Get in touch with the NyayaMate AI team. We're here to help." },
      { property: "og:title", content: "Contact NyayaMate AI" },
      { property: "og:description", content: "Reach out with questions, feedback or partnership ideas." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(150),
  message: z.string().trim().min(1, "Message is required").max(1000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    setSending(false);
    if (error) {
      toast.error("Could not send your message. Please try again.");
      return;
    }
    setForm({ name: "", email: "", subject: "", message: "" });
    toast.success("Message sent! We'll get back to you soon.");
  };

  return (
    <PageShell>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">Contact</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">We're here to help</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Questions, feedback or partnership ideas — send us a message and we'll respond promptly.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            {[
              { icon: Mail, label: "Email", value: "support@nyayamate.ai" },
              { icon: Phone, label: "Phone", value: "+91 1800 000 000" },
              { icon: MapPin, label: "Office", value: "Hyderabad, Telangana, India" },
              { icon: Clock, label: "Business Hours", value: "Mon–Sat, 9:00 AM – 7:00 PM IST" },
            ].map((c) => (
              <div key={c.label} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
                  <p className="mt-0.5 font-medium text-foreground">{c.value}</p>
                </div>
              </div>
            ))}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 text-sm text-muted-foreground">
                <MapPin className="mr-2 h-5 w-5 text-primary" /> Map placeholder
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="rounded-[20px] border border-border bg-card p-6 shadow-card lg:col-span-3 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1.5" placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1.5" placeholder="you@example.com" />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="mt-1.5" placeholder="How can we help?" />
            </div>
            <div className="mt-4">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={6} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} className="mt-1.5" placeholder="Write your message…" />
            </div>
            <Button type="submit" disabled={sending} className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Message
            </Button>
          </form>
        </div>
      </section>
    </PageShell>
  );
}
