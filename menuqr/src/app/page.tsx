import { LandingPage } from "@/components/marketing/landing-page";
import { STATIC_PLANS } from "@/lib/billing/static-plans";
import { getSupabaseAnonClient } from "@/lib/supabase/anon";

export const revalidate = 3600;

export default async function HomePage() {
  const supabase = getSupabaseAnonClient();

  const { data } = supabase
    ? await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
    : { data: null };

  return <LandingPage plans={data && data.length > 0 ? data : STATIC_PLANS} />;
}
