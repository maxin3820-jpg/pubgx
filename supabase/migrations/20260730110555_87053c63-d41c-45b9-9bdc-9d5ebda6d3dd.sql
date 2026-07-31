CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  ign_id TEXT,
  favorite_map TEXT NOT NULL,
  favorite_weapon TEXT NOT NULL,
  preferred_mode TEXT NOT NULL,
  rank_tier TEXT NOT NULL,
  hours_per_week INTEGER NOT NULL DEFAULT 0,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.survey_responses TO anon;
GRANT INSERT ON public.survey_responses TO authenticated;
GRANT ALL ON public.survey_responses TO service_role;

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a survey response"
ON public.survey_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);