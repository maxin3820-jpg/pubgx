/**
 * Site Config Store
 * Persisted to localStorage so admin edits survive page refreshes.
 * The survey page reads from this; the admin Controls tab writes to it.
 */

export type QuestionType = "text" | "chips" | "number" | "range" | "textarea";

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  label: string;
  hint?: string;
  required: boolean;
  enabled: boolean;
  // For chips questions
  options?: string[];
  // For range questions
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  // For text / number / textarea
  placeholder?: string;
  maxLength?: number;
}

export interface SiteConfig {
  // ── Header ──────────────────────────────────────────────────────────
  siteTitle: string;
  siteSubtitle: string;
  headerBadge: string;
  headerDescription: string;

  // ── Prize banner ─────────────────────────────────────────────────────
  prizeEnabled: boolean;
  prizeEmoji: string;
  prizeTitle: string;
  prizeDescription: string;

  // ── Submit button ─────────────────────────────────────────────────────
  submitButtonText: string;
  submitDisclaimer: string;

  // ── Success screen ────────────────────────────────────────────────────
  successTitle: string;
  successMessage: string;
  successButtonText: string;

  // ── Footer ────────────────────────────────────────────────────────────
  footerText: string;

  // ── Survey questions ──────────────────────────────────────────────────
  questions: SurveyQuestion[];
}

export const DEFAULT_CONFIG: SiteConfig = {
  siteTitle: "PUBG Mobile",
  siteSubtitle: "Player Survey",
  headerBadge: "Drop zone intel · Season survey",
  headerDescription:
    "Nine quick questions from the drop zone. Your answers shape which map, weapon and mode the squad focuses on next.",

  prizeEnabled: true,
  prizeEmoji: "🎁",
  prizeTitle: "Win 700 UC",
  prizeDescription: "Submit your intel for a chance to win 700 PUBG Mobile UC.",

  submitButtonText: "Submit intel",
  submitDisclaimer: "Responses are stored securely and used only for this survey.",

  successTitle: "Winner Winner, Chicken Dinner",
  successMessage: "Intel received, soldier. Your response has been logged in the crate.",
  successButtonText: "Submit another response",

  footerText: "Drop Zone Intel · community-run PUBG Mobile survey, not affiliated with Krafton.",

  questions: [
    {
      id: "player_name",
      type: "text",
      label: "Your name",
      hint: "How should we credit you?",
      placeholder: "e.g. Ghost",
      maxLength: 60,
      required: true,
      enabled: true,
    },
    {
      id: "ign_id",
      type: "text",
      label: "In-game ID",
      hint: "Optional — your numeric UID",
      placeholder: "e.g. 512340987",
      maxLength: 40,
      required: false,
      enabled: true,
    },
    {
      id: "pubg_level",
      type: "number",
      label: "Your PUBG Mobile level",
      hint: "What is your current player level? (1 – 9999)",
      placeholder: "e.g. 75",
      min: 1,
      max: 9999,
      required: false,
      enabled: true,
    },
    {
      id: "favorite_map",
      type: "chips",
      label: "Favourite map",
      options: ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Karakin"],
      required: true,
      enabled: true,
    },
    {
      id: "favorite_weapon",
      type: "chips",
      label: "Go-to weapon",
      options: ["M416", "AKM", "Groza", "AWM", "DP-28", "UMP45", "M24", "Vector"],
      required: true,
      enabled: true,
    },
    {
      id: "preferred_mode",
      type: "chips",
      label: "Preferred mode",
      options: ["Classic Solo", "Duo", "Squad", "TDM", "Payload", "Arena Training"],
      required: true,
      enabled: true,
    },
    {
      id: "rank_tier",
      type: "chips",
      label: "Current rank",
      options: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Crown", "Ace", "Conqueror"],
      required: true,
      enabled: true,
    },
    {
      id: "hours_per_week",
      type: "range",
      label: "Hours played per week",
      min: 0,
      max: 120,
      step: 1,
      unit: "h",
      required: true,
      enabled: true,
    },
    {
      id: "feedback",
      type: "textarea",
      label: "Anything else?",
      hint: "What would you buff, nerf or change?",
      placeholder: "Tell us what would make your next match better...",
      maxLength: 600,
      required: false,
      enabled: true,
    },
  ],
};

const STORAGE_KEY = "pubg-survey-site-config";

function isClient() {
  return typeof window !== "undefined";
}

export function loadConfig(): SiteConfig {
  if (!isClient()) return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<SiteConfig>;
    // Deep merge: keep default questions if stored ones are missing/corrupt
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      questions:
        parsed.questions && parsed.questions.length > 0
          ? parsed.questions
          : DEFAULT_CONFIG.questions,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(cfg: SiteConfig): void {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  // Dispatch event so other tabs/components can react
  window.dispatchEvent(new CustomEvent("site-config-changed", { detail: cfg }));
}

export function resetConfig(): SiteConfig {
  if (isClient()) localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("site-config-changed", { detail: DEFAULT_CONFIG }));
  return DEFAULT_CONFIG;
}

export function generateQuestionId(): string {
  return "q_" + Math.random().toString(36).slice(2, 9);
}
