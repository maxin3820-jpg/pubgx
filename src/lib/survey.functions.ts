import { createServerFn } from "@tanstack/react-start";

export type SurveySubmission = {
  player_name: string;
  ign_id?: string | null;
  pubg_level?: number | null;
  favorite_map: string;
  favorite_weapon: string;
  preferred_mode: string;
  rank_tier: string;
  hours_per_week: number;
  feedback?: string | null;
};

export const submitSurvey = createServerFn({ method: "POST" })
  .validator((data: SurveySubmission) => data)
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key || url.trim() === "" || key.trim() === "") {
      throw new Error("Supabase is not configured");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Insert into surveys table
    const { data: result, error } = await supabaseAdmin
      .from("surveys")
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error("Survey submission error:", error);
      throw new Error(`Failed to submit survey: ${error.message}`);
    }

    return result;
  });
