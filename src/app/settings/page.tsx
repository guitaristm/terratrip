"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SettingsSchema, type SettingsFormValues } from "@/lib/schemas";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useIdentity } from "@/lib/identity";
import { User, Palette, Bell, Globe } from "lucide-react";

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-stone-100">
        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">{icon}</div>
        <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { setUser } = useIdentity();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: { name: "", currency: "THB", theme: "light", notifications: true },
  });

  const currency = watch("currency");
  const theme = watch("theme");
  const notifications = watch("notifications");

  useEffect(() => {
    api.user.get().then((u) => {
      if (!u) return;
      reset({
        name: u.name ?? "",
        currency: u.currency ?? "THB",
        theme: u.theme ?? "light",
        notifications: u.notifications ?? true,
      });
    }).catch(() => {});
  }, [reset]);

  async function onSubmit(data: SettingsFormValues) {
    try {
      const updated = await api.user.update(data);
      if (updated?.id) setUser(updated);
      toast("Settings saved!");
    } catch {
      toast("Failed to save settings", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-800">Settings</h1>
        <p className="text-sm text-stone-500 mt-1">Manage your account preferences</p>
      </div>
      <div className="space-y-4">
        <Section icon={<User className="h-4 w-4" />} title="Profile">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input placeholder="Your name" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
          </div>
        </Section>

        <Section icon={<Globe className="h-4 w-4" />} title="Preferences">
          <div className="space-y-1.5">
            <Label>Default Currency</Label>
            <Select value={currency} onValueChange={(v) => setValue("currency", v as SettingsFormValues["currency"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="THB">🇹🇭 THB — Thai Baht</SelectItem>
                <SelectItem value="JPY">🇯🇵 JPY — Japanese Yen</SelectItem>
                <SelectItem value="USD">🇺🇸 USD — US Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Section icon={<Palette className="h-4 w-4" />} title="Appearance">
          <div className="space-y-1.5">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={(v) => setValue("theme", v as SettingsFormValues["theme"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">☀️ Light</SelectItem>
                <SelectItem value="dark">🌙 Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Section icon={<Bell className="h-4 w-4" />} title="Notifications">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-800">Trip reminders</p>
              <p className="text-xs text-stone-400 mt-0.5">Get notified before your trips</p>
            </div>
            <Switch checked={notifications} onCheckedChange={(v) => setValue("notifications", v)} />
          </div>
        </Section>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={isSubmitting} className="px-8">
            {isSubmitting ? "Saving…" : "Save Settings"}
          </Button>
        </div>
      </div>
    </form>
  );
}
