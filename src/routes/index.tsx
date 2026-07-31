import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  step, label, hint, error, children,
}: {
  step: number; label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-5 transition-colors duration-300 hover:border-primary/40 sm:p-7">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:gap-4">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-hairline bg-surface-2 text-xs font-semibold text-muted-foreground">
          {String(step).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">{label}</h2>
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
  const activeQuestions = config.questions.filter((q) => q.enabled);

  // Dynamic form state keyed by question id
  const [form, setForm] = useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {};
    config.questions.forEach((q) => {
      init[q.id] = q.type === "range" ? (q.min ?? 0) : "";
    });
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const setField = (id: string, val: string | number) =>
    setForm((f) => ({ ...f, [id]: val }));

  // Progress = required enabled fields that have a value
  const progress = useMemo(() => {
    const required = activeQuestions.filter((q) => q.required);
    if (!required.length) return 100;
    const filled = required.filter((q) => {
      const v = form[q.id];
      if (q.type === "range") return Number(v) > (q.min ?? 0);
      return v !== "" && v !== undefined;
    }).length;
    return Math.round((filled / required.length) * 100);
  }, [form, activeQuestions]);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderQuestion(q: SurveyQuestion, step: number) {
    const val = form[q.id] ?? "";
    const err = errors[q.id];

    if (q.type === "text") {
      return (
        <Field key={q.id} step={step} label={q.label} hint={q.hint} error={err}>
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
        <Field key={q.id} step={step} label={q.label} hint={q.hint} error={err}>
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
        <Field key={q.id} step={step} label={q.label} hint={q.hint} error={err}>
          <Chips options={q.options ?? []} value={String(val)} onChange={(v) => setField(q.id, v)} />
        </Field>
      );
    }
    if (q.type === "range") {
      const pct = ((Number(val) - (q.min ?? 0)) / ((q.max ?? 120) - (q.min ?? 0))) * 100;
      return (
        <Field key={q.id} step={step} label={q.label} hint={q.hint} error={err}>
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
        <Field key={q.id} step={step} label={q.label} hint={q.hint} error={err}>
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

  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <img src={heroDrop} alt="" width={1920} height={960}
          className="absolute inset-x-0 top-0 h-[75vh] w-full object-cover opacity-70 brightness-[1.45] contrast-[1.05] saturate-[0.9]" />
        <div className="absolute inset-x-0 top-0 h-[75vh] bg-gradient-to-b from-background/35 via-background/80 to-background" />
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute -bottom-52 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--hairline)_35%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--hairline)_35%,transparent)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />
      </div>

      {/* Progress bar */}
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

      <div className="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 sm:pt-20">
        {/* Header */}
        <header className="text-center">
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
            <div className="glass mx-auto mt-6 inline-flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-left">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-lg text-primary">
                {config.prizeEmoji}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{config.prizeTitle}</p>
                <p className="text-xs text-muted-foreground">{config.prizeDescription}</p>
              </div>
            </div>
          )}
        </header>

        {done ? (
          <div className="glass animate-fade-in mt-12 rounded-2xl p-8 text-center sm:p-12">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">✓</div>
            <h2 className="mt-5 text-2xl font-semibold text-foreground sm:text-3xl">{config.successTitle}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{config.successMessage}</p>
            <button type="button" onClick={() => { setForm({}); setDone(false); }}
              className="mt-7 rounded-xl border border-hairline bg-surface-2/60 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/60">
              {config.successButtonText}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-12 space-y-4 sm:space-y-5">
            {activeQuestions.map((q, i) => renderQuestion(q, i + 1))}

            {errors.form && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errors.form}
              </p>
            )}

            <button type="submit" disabled={submitting}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_10px_40px_-12px_color-mix(in_oklab,var(--primary)_70%,transparent)] active:scale-[0.99] disabled:opacity-60">
              {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />}
              {submitting ? "Transmitting..." : config.submitButtonText}
            </button>
            <p className="text-center text-xs text-muted-foreground">{config.submitDisclaimer}</p>
          </form>
        )}
      </div>

      <footer className="border-t border-hairline/70">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-5 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-muted-foreground">{config.footerText}</p>
          <Link to="/admin" className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">
            Admin panel
          </Link>
        </div>
      </footer>
    </main>
  );
}
