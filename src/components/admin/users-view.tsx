"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, User as UserIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";
import { setUserRole } from "@/lib/admin/users-client";
import { formatShortDate } from "@/lib/i18n/format-date";
import type { AdminUserSummary } from "@/lib/admin/users";

const STRINGS = {
  ar: {
    title: "المستخدمون",
    empty: "لا يوجد مستخدمون بعد.",
    name: "الاسم",
    whatsapp: "واتساب",
    invitations: "الدعوات",
    role: "الدور",
    joined: "تاريخ التسجيل",
    admin: "مدير",
    customer: "عميل",
    promote: "ترقية إلى مدير",
    demote: "إلغاء صلاحية المدير",
    you: "أنت",
  },
  fr: {
    title: "Utilisateurs",
    empty: "Aucun utilisateur pour le moment.",
    name: "Nom",
    whatsapp: "WhatsApp",
    invitations: "Invitations",
    role: "Rôle",
    joined: "Inscrit le",
    admin: "Admin",
    customer: "Client",
    promote: "Promouvoir admin",
    demote: "Retirer les droits admin",
    you: "Vous",
  },
  en: {
    title: "Users",
    empty: "No users yet.",
    name: "Name",
    whatsapp: "WhatsApp",
    invitations: "Invitations",
    role: "Role",
    joined: "Joined",
    admin: "Admin",
    customer: "Customer",
    promote: "Promote to admin",
    demote: "Remove admin rights",
    you: "You",
  },
};

export function AdminUsersView({ users, currentUserId }: { users: AdminUserSummary[]; currentUserId: string | null }) {
  const { locale } = useTranslation();
  const router = useRouter();
  const t = STRINGS[locale];
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function handleToggleRole(userId: string, currentRole: "customer" | "admin") {
    setBusyId(userId);
    await setUserRole(userId, currentRole === "admin" ? "customer" : "admin");
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <h1 className="font-heading text-2xl font-bold text-ink-900">{t.title}</h1>

      {users.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-200 p-10 text-center text-sm text-ink-500">
          {t.empty}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full min-w-[720px] text-start text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs text-ink-400">
                <th className="px-4 py-3 text-start font-medium">{t.name}</th>
                <th className="px-4 py-3 text-start font-medium">{t.whatsapp}</th>
                <th className="px-4 py-3 text-start font-medium">{t.invitations}</th>
                <th className="px-4 py-3 text-start font-medium">{t.role}</th>
                <th className="px-4 py-3 text-start font-medium">{t.joined}</th>
                <th className="px-4 py-3 text-start font-medium" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr key={user.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {user.full_name || "—"}
                      {isSelf && <span className="ms-2 text-xs font-normal text-ink-400">({t.you})</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-600" dir="ltr">
                      {user.whatsapp ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{user.invitationCount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === "admin" ? "gold" : "soft"}>
                        {user.role === "admin" ? (
                          <>
                            <ShieldCheck className="h-3 w-3" /> {t.admin}
                          </>
                        ) : (
                          <>
                            <UserIcon className="h-3 w-3" /> {t.customer}
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-400" dir="ltr">
                      {formatShortDate(new Date(user.created_at), locale)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSelf || busyId === user.id}
                        onClick={() => handleToggleRole(user.id, user.role)}
                      >
                        {busyId === user.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {user.role === "admin" ? t.demote : t.promote}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
