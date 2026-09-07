"use client";

import { Trash2, UserPlus } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertText, Field } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { useAuth } from "@/lib/auth/provider";
import { useTranslation } from "@/lib/i18n/provider";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RestaurantRole } from "@/types/database";

export interface TeamMember {
  id: string;
  userId: string;
  role: RestaurantRole;
  fullName: string | null;
  email: string | null;
}

const ASSIGNABLE_ROLES: RestaurantRole[] = ["manager", "staff"];

export function TeamPanel({ initialMembers }: { initialMembers: TeamMember[] }) {
  const { t } = useTranslation();
  const { restaurant, can } = useRestaurant();
  const { profile } = useAuth();
  const toast = useToast();
  const canManage = can("team:manage");

  const [members, setMembers] = React.useState(initialMembers);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<RestaurantRole>("staff");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<TeamMember | null>(null);

  React.useEffect(() => setMembers(initialMembers), [initialMembers]);

  const roleLabels: Record<RestaurantRole, string> = {
    owner: t.settings.roleOwner,
    manager: t.settings.roleManager,
    staff: t.settings.roleStaff,
  };

  const roleHelp: Record<RestaurantRole, string> = {
    owner: t.settings.roleOwnerHelp,
    manager: t.settings.roleManagerHelp,
    staff: t.settings.roleStaffHelp,
  };

  const addMember = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("add_restaurant_member_by_email", {
      p_restaurant: restaurant.id,
      p_email: email.trim(),
      p_role: role,
    });
    setBusy(false);

    if (rpcError) {
      const message = rpcError.message.includes("USER_NOT_FOUND")
        ? t.settings.teamUserNotFound
        : rpcError.message.includes("ALREADY_A_MEMBER")
          ? t.settings.teamAlreadyMember
          : translateDataError(rpcError.message, t);
      setError(message);
      return;
    }

    setEmail("");
    toast({ title: t.common.success, variant: "success" });

    const { data } = await supabase
      .from("restaurant_members")
      .select("id, user_id, role, profiles:user_id (full_name, email)")
      .eq("restaurant_id", restaurant.id);

    if (data) {
      setMembers(
        data.map((row) => {
          const linked = row.profiles as unknown as { full_name: string | null; email: string | null } | null;
          return {
            id: row.id,
            userId: row.user_id,
            role: row.role,
            fullName: linked?.full_name ?? null,
            email: linked?.email ?? null,
          };
        })
      );
    }
  };

  const changeRole = async (member: TeamMember, nextRole: RestaurantRole) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, role: nextRole } : item)));

    const { error: updateError } = await supabase
      .from("restaurant_members")
      .update({ role: nextRole })
      .eq("id", member.id);

    if (updateError) {
      setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, role: member.role } : item)));
      toast({ title: translateDataError(updateError.message, t), variant: "error" });
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    const { error: deleteError } = await supabase.from("restaurant_members").delete().eq("id", removing.id);
    setBusy(false);

    if (deleteError) {
      toast({ title: translateDataError(deleteError.message, t), variant: "error" });
      return;
    }

    setMembers((current) => current.filter((item) => item.id !== removing.id));
    setRemoving(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">{t.settings.teamTitle}</h3>
        <p className="text-sm text-muted-foreground">{t.settings.teamSubtitle}</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertText className="text-foreground">{error}</AlertText>
        </Alert>
      ) : null}

      <ul className="divide-y divide-border rounded-lg border border-border">
        {members.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center gap-3 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {(member.fullName ?? member.email ?? "?").slice(0, 1).toUpperCase()}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 truncate text-sm font-medium">
                {member.fullName ?? member.email}
                {member.userId === profile?.id ? <Badge variant="neutral">{t.settings.teamYou}</Badge> : null}
              </span>
              <span className="block truncate text-xs text-muted-foreground" dir="ltr">
                {member.email}
              </span>
            </span>

            {member.role === "owner" || !canManage || member.userId === profile?.id ? (
              <Badge variant={member.role === "owner" ? "default" : "neutral"}>{roleLabels[member.role]}</Badge>
            ) : (
              <>
                <Select value={member.role} onValueChange={(value) => void changeRole(member, value as RestaurantRole)}>
                  <SelectTrigger className="w-36" aria-label={t.admin.role}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {roleLabels[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={() => setRemoving(member)}
                  aria-label={t.settings.teamRemove}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </>
            )}
          </li>
        ))}

        {members.length === 0 ? (
          <li className="p-4 text-center text-sm text-muted-foreground">{t.settings.teamEmpty}</li>
        ) : null}
      </ul>

      {canManage ? (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <Field label={t.settings.teamEmail} htmlFor="member_email" hint={t.settings.teamEmailHelp}>
              <Input
                id="member_email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.auth.emailPlaceholder}
              />
            </Field>

            <Field label={t.admin.role}>
              <Select value={role} onValueChange={(value) => setRole(value as RestaurantRole)}>
                <SelectTrigger className="sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {roleLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Button loading={busy} disabled={!email.trim()} onClick={() => void addMember()}>
              <UserPlus aria-hidden />
              {t.settings.teamAdd}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">{roleHelp[role]}</p>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t.settings.teamRemove}
        description={removing?.email ?? undefined}
        confirmLabel={t.common.delete}
        loading={busy}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
