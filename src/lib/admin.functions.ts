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

  // Supabase must be configured
  if (!url || !key || url.trim() === "" || key.trim() === "") {
    throw new Error("Supabase is not configured. Please check your .env file.");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  
  // Query the "surveys" table (updated table name)
  const { data, error } = await supabaseAdmin
    .from("surveys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase query error:", error);
    throw new Error(`Failed to fetch survey data: ${error.message}`);
  }
  
  return (data ?? []) as SurveyRow[];
});
