"use client";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CollaboratorSchema, type CollaboratorFormValues } from "@/lib/schemas";
import { Crown, Pencil, Eye, Trash2, UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import type { Trip, TripMember } from "@/lib/types";

export function CollaboratorPanel({ trip }: { trip: Trip }) {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CollaboratorFormValues>({
    resolver: zodResolver(CollaboratorSchema),
    defaultValues: { email: "", role: "viewer" },
  });
  const role = watch("role");

  const refresh = useCallback(async () => {
    try {
      const data = await api.collaborators.list(trip.id);
      setMembers(data);
    } catch { toast("Failed to load members", "error"); }
    finally { setLoading(false); }
  }, [trip.id, toast]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleInvite(data: CollaboratorFormValues) {
    setIsLoading(true);
    try {
      const res = await api.collaborators.invite(trip.id, data);
      await refresh();
      reset();
      setInviteOpen(false);
      if (res?.emailSent) {
        toast(`Invite emailed to ${data.email}`);
      } else {
        toast(`${data.email} added (pending) — email not sent`);
      }
    } catch (e: any) {
      toast(e.message ?? "Failed to invite", "error");
    } finally { setIsLoading(false); }
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    try {
      await api.collaborators.updateRole(trip.id, memberId, newRole);
      await refresh();
      toast("Role updated.");
    } catch { toast("Failed to update role", "error"); }
  }

  async function handleRemove(memberId: string) {
    try {
      await api.collaborators.remove(trip.id, memberId);
      await refresh();
      toast("Collaborator removed.");
    } catch { toast("Failed to remove member", "error"); }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-stone-800">Collaborators</h2>
          <p className="text-sm text-stone-500">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="primary" onClick={() => setInviteOpen(true)}><UserPlus className="h-4 w-4" /> Invite</Button>
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 bg-white border border-stone-100 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-sm font-semibold text-amber-700 shrink-0">
              {(member.user?.name ?? member.invitedEmail ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{member.user?.name ?? member.invitedEmail}</p>
              <p className="text-xs text-stone-400 flex items-center gap-1">
                <Mail className="h-3 w-3" /> {member.invitedEmail ?? member.user?.email}
                {!member.accepted && <span className="ml-1 text-amber-500">(pending)</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {member.role === "owner" ? (
                <Badge variant="owner" className="flex items-center gap-1"><Crown className="h-3 w-3" /> Owner</Badge>
              ) : (
                <Select value={member.role} onValueChange={(v) => handleChangeRole(member.id, v)}>
                  <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {member.role !== "owner" && (
                <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-50 hover:text-red-500" onClick={() => handleRemove(member.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-stone-50 rounded-xl p-4 text-xs text-stone-500 space-y-1.5">
        <p className="font-medium text-stone-700 mb-2">Role permissions</p>
        <div className="flex items-center gap-2"><Crown className="h-3 w-3 text-amber-600" /><strong>Owner</strong> — Full access</div>
        <div className="flex items-center gap-2"><Pencil className="h-3 w-3 text-blue-600" /><strong>Editor</strong> — Add/edit itinerary & expenses</div>
        <div className="flex items-center gap-2"><Eye className="h-3 w-3 text-stone-400" /><strong>Viewer</strong> — Read-only</div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Invite Collaborator</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(handleInvite)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <Input type="email" placeholder="friend@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setValue("role", v as CollaboratorFormValues["role"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor — can add/edit</SelectItem>
                  <SelectItem value="viewer">Viewer — read only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)} className="flex-1">Cancel</Button>
              <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">{isLoading ? "Sending…" : "Send Invite"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
