import { createServerFn } from "@tanstack/react-start";

export type SurveyRow = {
  id: string;
  player_name: string;
  ign_id: string | null;
  pubg_level: number | null;
  favorite_map: string;
  favorite_weapon: string;
  preferred_mode: string;
  rank_tier: string;
  hours_per_week: number;
  feedback: string | null;
  created_at: string;
};

export const getSurveyResponses = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If Supabase is not configured, return demo data
  if (!url || !key || url.trim() === "" || key.trim() === "" || key === "your-service-role-key-here") {
    const { DEMO_ROWS } = await import("@/lib/demo-data");
    return DEMO_ROWS;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("survey_responses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SurveyRow[];
});
