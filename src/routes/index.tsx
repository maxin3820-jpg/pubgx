import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import heroDrop from "@/assets/hero-drop.jpg";
import { useSiteConfig } from "@/hooks/use-site-config";
import type { SurveyQuestion } from "@/lib/site-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PUBG Mobile Player Survey | Drop Zone Intel" },
      { name: "description", content: "PUBG Mobile player survey." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SurveyPage,
});

// ── UI helpers ──────────────────────────────────────────────────────────────
function Field({
  step, label, hint, error, children, showNumbers, totalQuestions,
}: {
  step: number; label: string; hint?: string; error?: string; children: React.ReactNode;
  showNumbers?: boolean; totalQuestions?: number;
}) {
  return (
    <section className="glass rounded-2xl p-5 transition-colors duration-300 hover:border-primary/40 sm:p-7">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:gap-4">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-hairline bg-surface-2 text-xs font-semibold text-muted-foreground">
          {String(step).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            {label}
            {showNumbers && totalQuestions && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                (Question {step} of {totalQuestions})
              </span>
            )}
          </h2>
          {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}

function Chips({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-2.5">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button key={opt} type="button" aria-pressed={active} onClick={() => onChange(opt)}
            className={`rounded-full border px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.97] min-h-[44px] ${active
              ? "border-primary/70 bg-primary/15 text-foreground shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
              : "border-hairline bg-surface-2/60 text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
function SurveyPage() {
  const { config } = useSiteConfig();
  
  // Check if survey is closed or in maintenance mode
  const now = new Date();
  const startDate = config.surveyStartDate ? new Date(config.surveyStartDate) : null;
  const endDate = config.surveyEndDate ? new Date(config.surveyEndDate) : null;
  const isClosed = (startDate && now < startDate) || (endDate && now > endDate);
  const isMaintenanceMode = config.maintenanceMode;

  // Randomize questions if enabled
  const activeQuestions = useMemo(() => {
    const enabled = config.questions.filter((q) => q.enabled);
    if (config.randomizeQuestions) {
      return [...enabled].sort(() => Math.random() - 0.5);
    }
    return enabled;
  }, [config.questions, config.randomizeQuestions]);

  // Dynamic form state keyed by question id
  const [form, setForm] = useState<Record<string, string | number>>(() => {
    // Load from localStorage if autoSave enabled
    if (config.enableAutoSave && typeof window !== "undefined") {
      const saved = localStorage.getItem("survey-autosave");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    const init: Record<string, string | number> = {};
    config.questions.forEach((q) => {
      init[q.id] = q.type === "range" ? (q.min ?? 0) : "";
    });
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showGDPR, setShowGDPR] = useState(false);
  const [gdprAccepted, setGdprAccepted] = useState(false);

  // Auto-save form to localStorage
  useEffect(() => {
    if (config.enableAutoSave && typeof window !== "undefined") {
      localStorage.setItem("survey-autosave", JSON.stringify(form));
    }
  }, [form, config.enableAutoSave]);

  // Show GDPR banner
  useEffect(() => {
    if (config.enableGDPRMode && typeof window !== "undefined") {
      const accepted = localStorage.getItem("gdpr-accepted");
      if (!accepted) {
        setShowGDPR(true);
      } else {
        setGdprAccepted(true);
      }
    } else {
      setGdprAccepted(true);
    }
  }, [config.enableGDPRMode]);

  const handleGDPRAccept = () => {
    localStorage.setItem("gdpr-accepted", "true");
    setGdprAccepted(true);
    setShowGDPR(false);
  };

  const setField = (id: string, val: string | number) =>
    setForm((f) => ({ ...f, [id]: val }));

  // Progress = required enabled fields that have a value
  const progress = useMemo(() => {
    if (!config.showProgressBar) return 0;
    const required = activeQuestions.filter((q) => q.required);
    if (!required.length) return 100;
    const filled = required.filter((q) => {
      const v = form[q.id];
      if (q.type === "range") return Number(v) > (q.min ?? 0);
      return v !== "" && v !== undefined;
    }).length;
    return Math.round((filled / required.length) * 100);
  }, [form, activeQuestions, config.showProgressBar]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Build zod schema dynamically from active questions
    const shape: Record<string, z.ZodTypeAny> = {};
    activeQuestions.forEach((q) => {
      let s: z.ZodTypeAny;
      if (q.type === "chips" || q.type === "text" || q.type === "textarea") {
        s = z.string();
        if (q.required) s = (s as z.ZodString).min(1, "Required");
        else s = (s as z.ZodString).optional();
        if (q.maxLength) s = (s as z.ZodString).max(q.maxLength);
      } else if (q.type === "number") {
        s = z.number().min(q.min ?? 1).max(q.max ?? 9999);
        if (!q.required) s = s.optional();
      } else {
        s = z.number().min(q.min ?? 0).max(q.max ?? 120);
      }
      shape[q.id] = s;
    });

    const payload: Record<string, unknown> = {};
    activeQuestions.forEach((q) => {
      const raw = form[q.id];
      if (q.type === "number") {
        payload[q.id] = raw !== "" ? Number(raw) : undefined;
      } else if (q.type === "range") {
        payload[q.id] = Number(raw);
      } else {
        payload[q.id] = raw || undefined;
      }
    });

    const parsed = z.object(shape).safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    // TODO: replace with Supabase insert when backend is connected
    await new Promise((res) => setTimeout(res, 800));
    setSubmitting(false);
    setDone(true);
    
    // Clear autosave
    if (config.enableAutoSave && typeof window !== "undefined") {
      localStorage.removeItem("survey-autosave");
    }
    
    // Show confetti
    if (config.successConfettiEnabled) {
      triggerConfetti();
    }
    
    // Redirect if configured
    if (config.successRedirectUrl && config.successRedirectDelay >= 0) {
      if (config.successRedirectDelay === 0) {
        window.location.href = config.successRedirectUrl;
      } else {
        setTimeout(() => {
          window.location.href = config.successRedirectUrl!;
        }, config.successRedirectDelay * 1000);
      }
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function triggerConfetti() {
    // Simple confetti effect using particles
    const colors = ['#e8b23a', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        top: -10px;
        left: ${Math.random() * 100}%;
        width: ${Math.random() * 10 + 5}px;
        height: ${Math.random() * 10 + 5}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        opacity: 0.8;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        pointer-events: none;
        z-index: 9999;
        animation: confetti-fall ${Math.random() * 2 + 2}s linear forwards;
      `;
      document.body.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 4000);
    }
    
    // Add animation if not exists
    if (!document.getElementById('confetti-style')) {
      const style = document.createElement('style');
      style.id = 'confetti-style';
      style.textContent = `
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function renderQuestion(q: SurveyQuestion, step: number) {
    const val = form[q.id] ?? "";
    const err = errors[q.id];
    const showNumbers = config.showQuestionNumbers;
    const totalQuestions = activeQuestions.length;

    if (q.type === "text") {
      return (
        <Field key={q.id} step={step} label={q.label} hint={q.hint} error={err} showNumbers={showNumbers} totalQuestions={totalQuestions}>
          <div className="form-shell">
            <input value={String(val)} onChange={(e) => setField(q.id, e.target.value)}
              maxLength={q.maxLength} placeholder={q.placeholder ?? ""}
              className="w-full bg-transparent px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground/60" />
          </div>
        </Field>
      );
    }
    if (q.type === "number") {
      return (
        <Field key={q.id} step={step} label={q.label} hint={q.hint} error={err} showNumbers={showNumbers} totalQuestions={totalQuestions}>
          <div className="form-shell flex items-center gap-3 px-4 py-3">
            <span className="text-xl">🎖️</span>
            <input type="number" value={String(val)} onChange={(e) => setField(q.id, e.target.value)}
              min={q.min} max={q.max} placeholder={q.placeholder ?? ""}
              className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            {val !== "" && (
                  <span className="hidden xs:inline-flex shrink-0 rounded-lg bg-primary/15 px-3 py-1 text-sm font-semibold text-primary tabular-nums">
                    Lv. {val}
                  </span>
                )}
          </div>
        </Field>
      );
    }
    if (q.type === "chips") {
      return (
        <Field key={q.id} step={step} label={q.label} hint={q.hint} error={err} showNumbers={showNumbers} totalQuestions={totalQuestions}>
          <Chips options={q.options ?? []} value={String(val)} onChange={(v) => setField(q.id, v)} />
        </Field>
      );
    }
    if (q.type === "range") {
      const pct = ((Number(val) - (q.min ?? 0)) / ((q.max ?? 120) - (q.min ?? 0))) * 100;
      return (
        <Field key={q.id} step={step} label={q.label} hint={q.hint} error={err} showNumbers={showNumbers} totalQuestions={totalQuestions}>
          <div className="flex items-center gap-2 sm:gap-4">
            <input type="range" aria-label={q.label} min={q.min ?? 0} max={q.max ?? 120}
              step={q.step ?? 1} value={Number(val)}
              onChange={(e) => setField(q.id, Number(e.target.value))}
              className="range-slim min-w-0 flex-1"
              style={{ ["--track" as string]: `linear-gradient(to right, var(--primary) ${pct}%, var(--surface-2) ${pct}%)` }} />
            <span className="w-14 shrink-0 rounded-lg border border-hairline bg-surface-2/60 py-1.5 text-center text-sm font-semibold text-foreground tabular-nums">
              {val}{q.unit ?? ""}
            </span>
          </div>
        </Field>
      );
    }
    if (q.type === "textarea") {
      const strVal = String(val);
      return (
        <Field key={q.id} step={step} label={q.label} hint={q.hint} error={err} showNumbers={showNumbers} totalQuestions={totalQuestions}>
          <div className="form-shell">
            <textarea value={strVal} onChange={(e) => setField(q.id, e.target.value)}
              maxLength={q.maxLength} rows={4} placeholder={q.placeholder ?? ""}
              className="w-full resize-none bg-transparent px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground/60" />
          </div>
          {q.maxLength && (
            <p className="mt-2 text-right text-xs text-muted-foreground">{strVal.length}/{q.maxLength}</p>
          )}
        </Field>
      );
    }
    return null;
  }

  // Dynamic styles based on config
  const primaryColor = config.primaryColor || '#e8b23a';
  const borderRadiusValue = config.borderRadius === 'sharp' ? '0px' : config.borderRadius === 'pill' ? '999px' : '12px';
  const fontFamilyValue = 
    config.fontFamily === 'modern' ? 'system-ui, -apple-system, sans-serif' :
    config.fontFamily === 'playful' ? 'Comic Sans MS, cursive' :
    config.fontFamily === 'professional' ? 'Georgia, serif' :
    'inherit';
  const backgroundImageUrl = config.customBackgroundImage || heroDrop;
  const backgroundColor = config.customBackgroundColor || '#0a0e17';

  // Apply dynamic CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--border-radius', borderRadiusValue);
    if (config.fontFamily !== 'default') {
      document.documentElement.style.setProperty('--font-family', fontFamilyValue);
    }
  }, [primaryColor, borderRadiusValue, fontFamilyValue, config.fontFamily]);

  // Load analytics scripts
  useEffect(() => {
    // Google Analytics
    if (config.googleAnalyticsId && typeof window !== "undefined") {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`;
      document.head.appendChild(script1);
      
      const script2 = document.createElement('script');
      script2.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.googleAnalyticsId}');
      `;
      document.head.appendChild(script2);
    }
    
    // Facebook Pixel
    if (config.facebookPixelId && typeof window !== "undefined") {
      const script = document.createElement('script');
      script.textContent = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${config.facebookPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }
  }, [config.googleAnalyticsId, config.facebookPixelId]);

  // Maintenance mode
  if (isMaintenanceMode) {
    return (
      <main className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6">🔧</div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Maintenance Mode</h1>
          <p className="text-muted-foreground">{config.maintenanceMessage}</p>
        </div>
      </main>
    );
  }

  // Survey closed
  if (isClosed) {
    return (
      <main className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Survey Closed</h1>
          <p className="text-muted-foreground">{config.closedMessage}</p>
          {startDate && now < startDate && (
            <p className="text-sm text-muted-foreground mt-2">
              Opens: {startDate.toLocaleDateString()}
            </p>
          )}
          {endDate && now > endDate && (
            <p className="text-sm text-muted-foreground mt-2">
              Closed: {endDate.toLocaleDateString()}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen" style={{ fontFamily: config.fontFamily !== 'default' ? fontFamilyValue : undefined }}>
      {/* GDPR Banner */}
      {showGDPR && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-hairline bg-background/95 backdrop-blur-xl p-4 shadow-2xl">
          <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center gap-4">
            <p className="text-sm text-muted-foreground flex-1">
              🍪 We use cookies and collect data to improve your experience. By continuing, you agree to our data practices.
              {config.privacyPolicyUrl && (
                <a href={config.privacyPolicyUrl} target="_blank" rel="noopener" className="ml-2 underline hover:text-foreground">
                  Privacy Policy
                </a>
              )}
            </p>
            <button onClick={handleGDPRAccept} className="shrink-0 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {config.backgroundStyle === 'image' && (
          <img src={backgroundImageUrl} alt="" width={1920} height={960}
            className="absolute inset-x-0 top-0 h-[75vh] w-full object-cover opacity-70 brightness-[1.45] contrast-[1.05] saturate-[0.9]" />
        )}
        {config.backgroundStyle === 'solid' && (
          <div className="absolute inset-0" style={{ backgroundColor }} />
        )}
        {config.backgroundStyle === 'gradient' && (
          <>
            <img src={heroDrop} alt="" width={1920} height={960}
              className="absolute inset-x-0 top-0 h-[75vh] w-full object-cover opacity-70 brightness-[1.45] contrast-[1.05] saturate-[0.9]" />
            <div className="absolute inset-x-0 top-0 h-[75vh] bg-gradient-to-b from-background/35 via-background/80 to-background" />
          </>
        )}
        {config.enableGlassmorphism && (
          <>
            <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            <div className="absolute -bottom-52 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-[150px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--hairline)_35%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--hairline)_35%,transparent)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />
          </>
        )}
      </div>

      {/* Progress bar */}
      {config.showProgressBar && (
        <div className="sticky top-0 z-20 border-b border-hairline/70 bg-background/70 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
            <span className="stencil shrink-0 text-[11px] text-muted-foreground">Zone</span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                style={{ width: `${done ? 100 : progress}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-semibold text-muted-foreground tabular-nums">
              {done ? 100 : progress}%
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 sm:pt-20">
        {/* Header */}
        <header className="text-center">
          {config.logoUrl && (
            <img src={config.logoUrl} alt="Logo" className="mx-auto mb-4 h-16 object-contain" />
          )}
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-2/60 px-3 py-1 text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {config.headerBadge}
          </span>
          <h1 className="mt-5 text-3xl leading-[1.1] font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {config.siteTitle}
            <span className="block text-muted-foreground">{config.siteSubtitle}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
            {config.headerDescription}
          </p>
          {config.prizeEnabled && (
            <div 
              className="glass mx-auto mt-6 inline-flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-left"
              style={{ 
                backgroundColor: config.prizeBackgroundColor || undefined,
                color: config.prizeTextColor || undefined,
              }}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-lg text-primary">
                {config.prizeEmoji}
              </span>
              <div>
                <p className="text-sm font-semibold" style={{ color: config.prizeTextColor || undefined }}>
                  {config.prizeTitle}
                </p>
                <p className="text-xs opacity-80">{config.prizeDescription}</p>
              </div>
            </div>
          )}
        </header>

        {done ? (
          <div className="glass animate-fade-in mt-12 rounded-2xl p-8 text-center sm:p-12">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">✓</div>
            <h2 className="mt-5 text-2xl font-semibold text-foreground sm:text-3xl">{config.successTitle}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{config.successMessage}</p>
            
            {config.successShowSocialShare && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(config.siteTitle + ' - ' + config.siteSubtitle)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="rounded-lg border border-hairline bg-surface-2/60 px-4 py-2 text-sm hover:border-primary/60 transition-colors">
                  Share on Twitter
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="rounded-lg border border-hairline bg-surface-2/60 px-4 py-2 text-sm hover:border-primary/60 transition-colors">
                  Share on Facebook
                </a>
              </div>
            )}
            
            {!config.successRedirectUrl && (
              <button type="button" onClick={() => { 
                setForm({});
                setDone(false);
                // Reset autosave
                if (config.enableAutoSave && typeof window !== "undefined") {
                  const init: Record<string, string | number> = {};
                  config.questions.forEach((q) => {
                    init[q.id] = q.type === "range" ? (q.min ?? 0) : "";
                  });
                  localStorage.setItem("survey-autosave", JSON.stringify(init));
                }
              }}
                className="mt-7 rounded-xl border border-hairline bg-surface-2/60 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/60">
                {config.successButtonText}
              </button>
            )}
            
            {config.successRedirectUrl && config.successRedirectDelay > 0 && (
              <p className="mt-4 text-xs text-muted-foreground">
                Redirecting in {config.successRedirectDelay} seconds...
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-12 space-y-4 sm:space-y-5">
            {activeQuestions.map((q, i) => renderQuestion(q, i + 1))}

            {errors.form && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errors.form}
              </p>
            )}

            <button type="submit" disabled={submitting || (config.enableGDPRMode && !gdprAccepted)}
              style={{ backgroundColor: config.submitButtonColor || undefined }}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_10px_40px_-12px_color-mix(in_oklab,var(--primary)_70%,transparent)] active:scale-[0.99] disabled:opacity-60">
              {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />}
              {submitting ? "Transmitting..." : config.submitButtonText}
            </button>
            <p className="text-center text-xs text-muted-foreground">{config.submitDisclaimer}</p>
            {config.enableGDPRMode && !gdprAccepted && (
              <p className="text-center text-xs text-destructive mt-2">
                Please accept cookies to submit the survey
              </p>
            )}
          </form>
        )}
      </div>

      <footer className="border-t border-hairline/70">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-5 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">{config.footerText}</p>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              {config.privacyPolicyUrl && (
                <a href={config.privacyPolicyUrl} target="_blank" rel="noopener" className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                  Privacy Policy
                </a>
              )}
              {config.termsOfServiceUrl && (
                <a href={config.termsOfServiceUrl} target="_blank" rel="noopener" className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                  Terms of Service
                </a>
              )}
              {config.contactEmail && (
                <a href={`mailto:${config.contactEmail}`} className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                  Contact
                </a>
              )}
            </div>
          </div>
          <Link to="/admin" className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">
            Admin panel
          </Link>
        </div>
      </footer>
    </main>
  );
}
