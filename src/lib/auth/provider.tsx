"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/types/database";

interface AuthContextValue {
  user: User | null;
  profile: ProfileRow | null;
  loading: boolean;
  isConfigured: boolean;
  /** True once a full name + WhatsApp number are on file (required before creating an invitation). */
  isProfileComplete: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser = null,
  initialProfile = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
  initialProfile?: ProfileRow | null;
}) {
  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  const [user, setUser] = React.useState<User | null>(initialUser);
  const [profile, setProfile] = React.useState<ProfileRow | null>(initialProfile);
  const [loading, setLoading] = React.useState(false);

  const fetchProfile = React.useCallback(
    async (userId: string) => {
      if (!supabase) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      return data;
    },
    [supabase]
  );

  const refreshProfile = React.useCallback(async () => {
    if (!user) return;
    const next = await fetchProfile(user.id);
    setProfile(next);
  }, [user, fetchProfile]);

  React.useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        const next = await fetchProfile(session.user.id);
        setProfile(next);
        setLoading(false);
      } else {
        setProfile(null);
      }
      router.refresh();
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const signOut = React.useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  }, [supabase, router]);

  const isProfileComplete = Boolean(profile?.full_name && profile?.whatsapp);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isConfigured: Boolean(supabase),
      isProfileComplete,
      signOut,
      refreshProfile,
    }),
    [user, profile, loading, supabase, isProfileComplete, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
