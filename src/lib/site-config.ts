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
  // ══════════════════════════════════════════════════════════════════════════
  // HEADER & BRANDING
  // ══════════════════════════════════════════════════════════════════════════
  siteTitle: string;
  siteSubtitle: string;
  headerBadge: string;
  headerDescription: string;
  logoUrl?: string; // Custom logo URL
  faviconUrl?: string; // Custom favicon URL

  // ══════════════════════════════════════════════════════════════════════════
  // PRIZE BANNER
  // ══════════════════════════════════════════════════════════════════════════
  prizeEnabled: boolean;
  prizeEmoji: string;
  prizeTitle: string;
  prizeDescription: string;
  prizeBackgroundColor?: string; // Custom background color
  prizeTextColor?: string; // Custom text color

  // ══════════════════════════════════════════════════════════════════════════
  // SUBMIT BUTTON & FORM BEHAVIOR
  // ══════════════════════════════════════════════════════════════════════════
  submitButtonText: string;
  submitDisclaimer: string;
  submitButtonColor?: string; // Custom button color
  allowMultipleSubmissions: boolean; // Allow same user to submit multiple times
  showProgressBar: boolean; // Show progress indicator
  enableAutoSave: boolean; // Auto-save progress to localStorage
  requiredFieldsIndicator: string; // Text for required fields (e.g., "*" or "Required")

  // ══════════════════════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  successTitle: string;
  successMessage: string;
  successButtonText: string;
  successConfettiEnabled: boolean; // Show confetti animation
  successRedirectUrl?: string; // Redirect after success
  successRedirectDelay: number; // Seconds before redirect (0 = no redirect)
  successShowSocialShare: boolean; // Show social share buttons

  // ══════════════════════════════════════════════════════════════════════════
  // FOOTER & LEGAL
  // ══════════════════════════════════════════════════════════════════════════
  footerText: string;
  privacyPolicyUrl?: string; // Link to privacy policy
  termsOfServiceUrl?: string; // Link to terms
  contactEmail?: string; // Support email
  showPoweredByBranding: boolean; // Show "Powered by" text

  // ══════════════════════════════════════════════════════════════════════════
  // APPEARANCE & THEME
  // ══════════════════════════════════════════════════════════════════════════
  primaryColor: string; // Main brand color
  backgroundStyle: "gradient" | "solid" | "image"; // Background type
  customBackgroundImage?: string; // Custom background image URL
  customBackgroundColor?: string; // Solid background color
  fontFamily: "default" | "modern" | "playful" | "professional"; // Font style
  borderRadius: "sharp" | "rounded" | "pill"; // UI corner style
  cardOpacity: number; // Card background opacity (0-100)
  enableAnimations: boolean; // Enable/disable animations
  enableGlassmorphism: boolean; // Glassmorphic effect on cards

  // ══════════════════════════════════════════════════════════════════════════
  // SURVEY BEHAVIOR
  // ══════════════════════════════════════════════════════════════════════════
  surveyMode: "multi-step" | "single-page" | "conversational"; // Display mode
  questionsPerPage: number; // For multi-step mode
  showQuestionNumbers: boolean; // Display question numbers
  randomizeQuestions: boolean; // Randomize question order
  enableQuestionSkip: boolean; // Allow skipping optional questions
  showHintsByDefault: boolean; // Expand hints automatically
  validationMode: "instant" | "on-submit" | "on-blur"; // When to validate

  // ══════════════════════════════════════════════════════════════════════════
  // DATA COLLECTION & PRIVACY
  // ══════════════════════════════════════════════════════════════════════════
  collectIPAddress: boolean; // Store IP addresses
  collectBrowserInfo: boolean; // Store browser/device info
  collectGeoLocation: boolean; // Request geolocation
  enableGDPRMode: boolean; // Show GDPR consent banner
  dataRetentionDays: number; // How long to keep responses (0 = forever)
  anonymizeResponses: boolean; // Remove identifying information

  // ══════════════════════════════════════════════════════════════════════════
  // ANALYTICS & TRACKING
  // ══════════════════════════════════════════════════════════════════════════
  googleAnalyticsId?: string; // GA tracking ID
  facebookPixelId?: string; // Facebook Pixel
  enableHotjar: boolean; // Enable Hotjar tracking
  trackAbandonmentRate: boolean; // Track incomplete submissions
  enableABTesting: boolean; // Enable A/B testing variants

  // ══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS & INTEGRATIONS
  // ══════════════════════════════════════════════════════════════════════════
  enableEmailNotifications: boolean; // Email on new response
  notificationEmail?: string; // Email to send notifications
  webhookUrl?: string; // Webhook for new responses
  slackWebhookUrl?: string; // Slack integration
  discordWebhookUrl?: string; // Discord integration

  // ══════════════════════════════════════════════════════════════════════════
  // RESPONSE LIMITS & SCHEDULING
  // ══════════════════════════════════════════════════════════════════════════
  maxResponses: number; // Maximum responses (0 = unlimited)
  responseLimit: number; // Responses per user (0 = unlimited)
  surveyStartDate?: string; // Survey opens (ISO date)
  surveyEndDate?: string; // Survey closes (ISO date)
  closedMessage: string; // Message when survey is closed
  maintenanceMode: boolean; // Show maintenance message
  maintenanceMessage: string; // Maintenance mode text

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN PANEL SETTINGS
  // ══════════════════════════════════════════════════════════════════════════
  adminPassword: string; // Admin access password
  enableAdminNotifications: boolean; // Real-time admin alerts
  adminDashboardTheme: "dark" | "light" | "auto"; // Admin panel theme
  showDemoDataBanner: boolean; // Show "using demo data" banner
  autoRefreshInterval: number; // Auto-refresh data (seconds, 0 = off)

  // ══════════════════════════════════════════════════════════════════════════
  // SURVEY QUESTIONS
  // ══════════════════════════════════════════════════════════════════════════
  questions: SurveyQuestion[];
}

export const DEFAULT_CONFIG: SiteConfig = {
  // ══════════════════════════════════════════════════════════════════════════
  // HEADER & BRANDING
  // ══════════════════════════════════════════════════════════════════════════
  siteTitle: "PUBG Mobile",
  siteSubtitle: "Player Survey",
  headerBadge: "Drop zone intel · Season survey",
  headerDescription:
    "Nine quick questions from the drop zone. Your answers shape which map, weapon and mode the squad focuses on next.",
  logoUrl: "",
  faviconUrl: "",

  // ══════════════════════════════════════════════════════════════════════════
  // PRIZE BANNER
  // ══════════════════════════════════════════════════════════════════════════
  prizeEnabled: true,
  prizeEmoji: "🎁",
  prizeTitle: "Win 700 UC",
  prizeDescription: "Submit your intel for a chance to win 700 PUBG Mobile UC.",
  prizeBackgroundColor: "",
  prizeTextColor: "",

  // ══════════════════════════════════════════════════════════════════════════
  // SUBMIT BUTTON & FORM BEHAVIOR
  // ══════════════════════════════════════════════════════════════════════════
  submitButtonText: "Submit intel",
  submitDisclaimer: "Responses are stored securely and used only for this survey.",
  submitButtonColor: "",
  allowMultipleSubmissions: true,
  showProgressBar: true,
  enableAutoSave: false,
  requiredFieldsIndicator: "*",

  // ══════════════════════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  successTitle: "Winner Winner, Chicken Dinner",
  successMessage: "Intel received, soldier. Your response has been logged in the crate.",
  successButtonText: "Submit another response",
  successConfettiEnabled: true,
  successRedirectUrl: "",
  successRedirectDelay: 0,
  successShowSocialShare: false,

  // ══════════════════════════════════════════════════════════════════════════
  // FOOTER & LEGAL
  // ══════════════════════════════════════════════════════════════════════════
  footerText: "Drop Zone Intel · community-run PUBG Mobile survey, not affiliated with Krafton.",
  privacyPolicyUrl: "",
  termsOfServiceUrl: "",
  contactEmail: "",
  showPoweredByBranding: true,

  // ══════════════════════════════════════════════════════════════════════════
  // APPEARANCE & THEME
  // ══════════════════════════════════════════════════════════════════════════
  primaryColor: "#e8b23a",
  backgroundStyle: "gradient",
  customBackgroundImage: "",
  customBackgroundColor: "#0a0e17",
  fontFamily: "default",
  borderRadius: "rounded",
  cardOpacity: 80,
  enableAnimations: true,
  enableGlassmorphism: true,

  // ══════════════════════════════════════════════════════════════════════════
  // SURVEY BEHAVIOR
  // ══════════════════════════════════════════════════════════════════════════
  surveyMode: "multi-step",
  questionsPerPage: 1,
  showQuestionNumbers: true,
  randomizeQuestions: false,
  enableQuestionSkip: false,
  showHintsByDefault: true,
  validationMode: "instant",

  // ══════════════════════════════════════════════════════════════════════════
  // DATA COLLECTION & PRIVACY
  // ══════════════════════════════════════════════════════════════════════════
  collectIPAddress: false,
  collectBrowserInfo: false,
  collectGeoLocation: false,
  enableGDPRMode: false,
  dataRetentionDays: 0,
  anonymizeResponses: false,

  // ══════════════════════════════════════════════════════════════════════════
  // ANALYTICS & TRACKING
  // ══════════════════════════════════════════════════════════════════════════
  googleAnalyticsId: "",
  facebookPixelId: "",
  enableHotjar: false,
  trackAbandonmentRate: false,
  enableABTesting: false,

  // ══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS & INTEGRATIONS
  // ══════════════════════════════════════════════════════════════════════════
  enableEmailNotifications: false,
  notificationEmail: "",
  webhookUrl: "",
  slackWebhookUrl: "",
  discordWebhookUrl: "",

  // ══════════════════════════════════════════════════════════════════════════
  // RESPONSE LIMITS & SCHEDULING
  // ══════════════════════════════════════════════════════════════════════════
  maxResponses: 0,
  responseLimit: 0,
  surveyStartDate: "",
  surveyEndDate: "",
  closedMessage: "This survey is currently closed. Thank you for your interest!",
  maintenanceMode: false,
  maintenanceMessage: "We're performing maintenance. Please check back soon!",

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN PANEL SETTINGS
  // ══════════════════════════════════════════════════════════════════════════
  adminPassword: "Doodle",
  enableAdminNotifications: true,
  adminDashboardTheme: "dark",
  showDemoDataBanner: true,
  autoRefreshInterval: 60,

  // ══════════════════════════════════════════════════════════════════════════
  // SURVEY QUESTIONS
  // ══════════════════════════════════════════════════════════════════════════
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
