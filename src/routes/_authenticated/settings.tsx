import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Lock, Loader2, Palette, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — NyayaMate AI" }] }),
  component: SettingsPage,
});

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof Bell;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function SettingsPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notif, setNotif] = useState({ email: true, product: false });
  const [pwd, setPwd] = useState({ next: "", confirm: "" });
  const [updating, setUpdating] = useState(false);

  const updatePassword = async () => {
    if (pwd.next.length < 8) return toast.error("Password must be at least 8 characters.");
    if (pwd.next !== pwd.confirm) return toast.error("Passwords do not match.");
    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    setUpdating(false);
    if (error) return toast.error(error.message);
    setPwd({ next: "", confirm: "" });
    toast.success("Password updated.");
  };

  return (
    <DashboardLayout title="Settings">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage account, notifications and security.</p>
        </div>

        <Section icon={Bell} title="Notifications" desc="Choose what updates you receive.">
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-foreground">Email updates on saved guides</span>
              <Switch checked={notif.email} onCheckedChange={(v) => setNotif((n) => ({ ...n, email: v }))} />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-foreground">Product announcements</span>
              <Switch checked={notif.product} onCheckedChange={(v) => setNotif((n) => ({ ...n, product: v }))} />
            </label>
          </div>
        </Section>

        <Section icon={Palette} title="Appearance" desc="Theme preferences.">
          <p className="text-sm text-muted-foreground">
            Light theme is active. A dark mode is coming soon.
          </p>
        </Section>

        <Section icon={Lock} title="Security" desc="Update your password.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="next">New password</Label>
              <Input
                id="next"
                type="password"
                value={pwd.next}
                onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                className="mt-1.5"
              />
            </div>
          </div>
          <Button onClick={updatePassword} disabled={updating} className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
            {updating && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </Section>

        <Section icon={ShieldAlert} title="Privacy & Account" desc="Manage your account data.">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                await queryClient.cancelQueries();
                queryClient.clear();
                await signOut();
                navigate({ to: "/", replace: true });
              }}
            >
              Sign out
            </Button>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => toast.info("Account deletion will be available soon.")}
            >
              <Trash2 className="h-4 w-4" /> Delete account
            </Button>
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}
