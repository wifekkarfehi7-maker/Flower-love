"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser,
  initialProfile,
}: {
  children: React.ReactNode;
  initialUser: User | null;
  initialProfile: Profile | null;
}) {
  const router = useRouter();
  const [user, setUser] = React.useState(initialUser);
  const [profile, setProfile] = React.useState(initialProfile);

  React.useEffect(() => {
    setUser(initialUser);
    setProfile(initialProfile);
  }, [initialUser, initialProfile]);

  const refreshProfile = React.useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) setProfile(data);
  }, [user]);

  const signOut = React.useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.replace("/login");
    router.refresh();
  }, [router]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isSuperAdmin: profile?.platform_role === "super_admin",
      signOut,
      refreshProfile,
    }),
    [user, profile, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}
