import { useMemo, useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Area, AreaChart,
} from "recharts";
import {
  Users, Clock, MapPin, MessageSquare, TrendingUp, Trophy,
  Target, Crosshair, Zap, Download, RefreshCw, BarChart2,
  List, Activity, Star, Calendar, Search, ChevronUp,
  ChevronDown, Award, Flame, Shield, Eye, X, Settings,
  Plus, Trash2, GripVertical, ToggleLeft, ToggleRight,
  Type, Hash, SlidersHorizontal, AlignLeft, ChevronRight,
  RotateCcw, Save, AlertTriangle, CheckCircle,
} from "lucide-react";
import { getSurveyResponses, type SurveyRow } from "@/lib/admin.functions";
import { useSiteConfig } from "@/hooks/use-site-config";
import {
  type SurveyQuestion, type QuestionType,
  generateQuestionId, DEFAULT_CONFIG,
} from "@/lib/site-config";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — PUBG Mobile Survey Results" },
      { name: "description", content: "Full analytics dashboard for PUBG Mobile player survey." },
    ],
  }),
  component: AdminPanel,
});

// ─── Constants ─────────────────────────────────────────────────────────────
const RANK_ORDER = ["Bronze","Silver","Gold","Platinum","Diamond","Crown","Ace","Conqueror"];
const COLORS = ["hsl(var(--primary))","#e8b23a","#7f9f6a","#c96a3c","#6d8ea0","#a2795c","#8f7fa8","#c9b84a"];
const RANK_COLORS: Record<string,string> = {
  Bronze:"#cd7f32", Silver:"#a8a9ad", Gold:"#ffd700",
  Platinum:"#00b4d8", Diamond:"#b9f2ff", Crown:"#ff6b6b",
  Ace:"#f72585", Conqueror:"#7209b7",
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function countBy(rows: SurveyRow[], key: keyof SurveyRow) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const v = String(r[key] ?? "—");
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function pct(n: number, total: number) {
  if (!total) return "0%";
  return ((n / total) * 100).toFixed(1) + "%";
}

function avgOf(rows: SurveyRow[], key: keyof SurveyRow) {
  if (!rows.length) return 0;
  return rows.reduce((s, r) => s + Number(r[key] ?? 0), 0) / rows.length;
}

type SortDir = "asc" | "desc";
type TabId = "overview" | "analytics" | "leaderboard" | "responses" | "insights" | "controls";

// ─── Sub-components ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="crate border border-border bg-card p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
      <div className="mt-0.5 grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="stencil mt-1 text-xl sm:text-2xl text-foreground truncate">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, span2 = false }: {
  title: string; subtitle?: string;
  children: React.ReactElement; span2?: boolean;
}) {
  return (
    <div className={`crate border border-border bg-card p-4 sm:p-5 ${span2 ? "lg:col-span-2" : ""}`}>
      <div className="mb-3 sm:mb-4">
        <h3 className="stencil text-base sm:text-lg text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="h-52 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Tab({ id, active, icon: Icon, label, onClick }: {
  id: string; active: boolean; icon: React.ElementType; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 min-h-[44px] whitespace-nowrap ${
        active
          ? "bg-primary/15 text-foreground border border-primary/40"
          : "text-muted-foreground hover:text-foreground hover:bg-surface-2/60"
      }`}
    >
      <Icon size={15} />
      <span className="hidden xs:inline sm:inline">{label}</span>
    </button>
  );
}

// ─── Progress Bar Row ──────────────────────────────────────────────────────
function ProgressRow({ name, value, total, color }: {
  name: string; value: number; total: number; color?: string;
}) {
  const w = total ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-muted-foreground truncate">{name}</span>
      <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${w}%`, background: color ?? "hsl(var(--primary))" }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-semibold text-foreground">{value}</span>
      <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">{pct(value, total)}</span>
    </div>
  );
}

// ─── Feedback Modal ────────────────────────────────────────────────────────
function FeedbackModal({ row, onClose }: { row: SurveyRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative glass rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2">
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary font-bold text-lg">
            {row.player_name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground">{row.player_name}</p>
            <p className="text-xs text-muted-foreground">{row.ign_id ?? "No IGN"} · {row.rank_tier}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          {[
            ["Map", row.favorite_map], ["Weapon", row.favorite_weapon],
            ["Mode", row.preferred_mode], ["Hrs/Week", row.hours_per_week],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-lg bg-surface-2/60 px-3 py-2">
              <p className="text-muted-foreground">{k}</p>
              <p className="font-medium text-foreground">{v}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-surface-2/60 p-3">
          <p className="text-xs text-muted-foreground mb-1">Feedback</p>
          <p className="text-sm text-foreground">{row.feedback || "No feedback provided."}</p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground text-right">
          {new Date(row.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
function AdminPanel() {
  const fetchRows = useServerFn(getSurveyResponses);
  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["survey-responses"],
    queryFn: () => fetchRows(),
    refetchInterval: 60_000,
  });

  const rows = useMemo(() => data ?? [], [data]);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // ── Site Config (Controls tab) ────────────────────────────────────────
  const { config, update, reset } = useSiteConfig();
  const [saveToast, setSaveToast] = useState(false);

  const handleSave = useCallback(() => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  }, []);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof SurveyRow>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterMap, setFilterMap] = useState("");
  const [filterRank, setFilterRank] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [selectedRow, setSelectedRow] = useState<SurveyRow | null>(null);

  // ── Derived stats ──────────────────────────────────────────────────────
  const maps    = useMemo(() => countBy(rows, "favorite_map"), [rows]);
  const weapons = useMemo(() => countBy(rows, "favorite_weapon"), [rows]);
  const modes   = useMemo(() => countBy(rows, "preferred_mode"), [rows]);
  const ranks   = useMemo(() => countBy(rows, "rank_tier"), [rows]);

  const totalResponses = rows.length;
  const avgHours       = avgOf(rows, "hours_per_week");
  const withFeedback   = rows.filter(r => r.feedback?.trim()).length;
  const withIgn        = rows.filter(r => r.ign_id).length;
  const maxHours       = Math.max(...rows.map(r => r.hours_per_week ?? 0), 0);
  const topPlayer      = rows.find(r => r.hours_per_week === maxHours);

  // ── Timeline ──────────────────────────────────────────────────────────
  const timeline = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    return [...map.entries()].sort().map(([date, count]) => ({ date, count }));
  }, [rows]);

  // Cumulative timeline
  const cumulativeTimeline = useMemo(() => {
    let acc = 0;
    return timeline.map(({ date, count }) => { acc += count; return { date, count, total: acc }; });
  }, [timeline]);

  // ── Hours distribution buckets ────────────────────────────────────────
  const hoursBuckets = useMemo(() => {
    const buckets = [
      { label: "0–5h", min: 0, max: 5 }, { label: "6–10h", min: 6, max: 10 },
      { label: "11–20h", min: 11, max: 20 }, { label: "21–40h", min: 21, max: 40 },
      { label: "40h+", min: 41, max: Infinity },
    ];
    return buckets.map(b => ({
      label: b.label,
      value: rows.filter(r => r.hours_per_week >= b.min && r.hours_per_week <= b.max).length,
    }));
  }, [rows]);

  // ── Rank radar data (indexed by rank order) ────────────────────────────
  const rankRadar = useMemo(() => {
    const map = new Map(ranks.map(r => [r.name, r.value]));
    return RANK_ORDER.map(name => ({ name, value: map.get(name) ?? 0 }));
  }, [ranks]);

  // ── Cross-tab: map vs avg hours ────────────────────────────────────────
  const mapHours = useMemo(() => {
    const mapData = new Map<string, number[]>();
    rows.forEach(r => {
      if (!mapData.has(r.favorite_map)) mapData.set(r.favorite_map, []);
      mapData.get(r.favorite_map)!.push(r.hours_per_week ?? 0);
    });
    return [...mapData.entries()].map(([name, hrs]) => ({
      name, avg: +(hrs.reduce((a, b) => a + b, 0) / hrs.length).toFixed(1),
    })).sort((a, b) => b.avg - a.avg);
  }, [rows]);

  // ── Today's submissions ────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = rows.filter(r => r.created_at.startsWith(today)).length;
  const yesterdayCount = rows.filter(r => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    return r.created_at.startsWith(y.toISOString().slice(0, 10));
  }).length;

  // ── Level stats (safe — no Math.max spread on large arrays) ───────────
  const rowsWithLevel = useMemo(() => rows.filter(r => r.pubg_level), [rows]);
  const maxLevel = useMemo(() => rowsWithLevel.reduce((m, r) => Math.max(m, r.pubg_level ?? 0), 0), [rowsWithLevel]);
  const avgLevel = useMemo(() => rowsWithLevel.length ? Math.round(rowsWithLevel.reduce((s, r) => s + (r.pubg_level ?? 0), 0) / rowsWithLevel.length) : 0, [rowsWithLevel]);
  const topLevelPlayer = useMemo(() => rowsWithLevel.find(r => r.pubg_level === maxLevel), [rowsWithLevel, maxLevel]);
  const lvlBuckets = useMemo(() => [
    { label: "1–25",   min: 1,   max: 25   },
    { label: "26–50",  min: 26,  max: 50   },
    { label: "51–75",  min: 51,  max: 75   },
    { label: "76–100", min: 76,  max: 100  },
    { label: "101+",   min: 101, max: 9999 },
  ].map(b => ({
    label: b.label,
    value: rowsWithLevel.filter(r => (r.pubg_level ?? 0) >= b.min && (r.pubg_level ?? 0) <= b.max).length,
  })), [rowsWithLevel]);

  // ── Filtered + sorted table rows ─────────────────────────────────────
  const filteredRows = useMemo(() => {
    let r = [...rows];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        x.player_name.toLowerCase().includes(q) ||
        (x.ign_id ?? "").toLowerCase().includes(q) ||
        (x.feedback ?? "").toLowerCase().includes(q)
      );
    }
    if (filterMap)  r = r.filter(x => x.favorite_map === filterMap);
    if (filterRank) r = r.filter(x => x.rank_tier === filterRank);
    if (filterMode) r = r.filter(x => x.preferred_mode === filterMode);
    r.sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (av == null) return 1; if (bv == null) return -1;
      const cmp = String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [rows, search, filterMap, filterRank, filterMode, sortKey, sortDir]);

  function toggleSort(key: keyof SurveyRow) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  // ── Export CSV ─────────────────────────────────────────────────────────
  function exportCsv() {
    const headers = ["created_at","player_name","ign_id","pubg_level","favorite_map","favorite_weapon","preferred_mode","rank_tier","hours_per_week","feedback"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...filteredRows.map(r => headers.map(h => esc(r[h as keyof SurveyRow])).join(","))].join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: "pubg-survey.csv" });
    a.click(); URL.revokeObjectURL(a.href);
  }

  const uniqueMaps  = [...new Set(rows.map(r => r.favorite_map))].sort();
  const uniqueRanks = RANK_ORDER.filter(r => rows.some(x => x.rank_tier === r));
  const uniqueModes = [...new Set(rows.map(r => r.preferred_mode))].sort();
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  return (
    <main className="min-h-screen bg-background">
      {selectedRow && <FeedbackModal row={selectedRow} onClose={() => setSelectedRow(null)} />}

      {/* Save toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-3 shadow-2xl text-sm text-foreground animate-fade-in">
          <CheckCircle size={16} className="text-green-400 shrink-0" />
          Changes saved — survey updated live!
        </div>
      )}

      {/* ── Top Header ──────────────────────────────────────────────── */}
      <div className="border-b border-border/70 bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="stencil text-2xl sm:text-3xl text-foreground">Command Center</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalResponses} responses · Updated {lastUpdated}
              {todayCount > 0 && <span className="ml-2 text-primary">+{todayCount} today</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/" className="crate border border-border px-3 py-2.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1.5 min-h-[44px]">
              <Eye size={13} /> <span className="hidden sm:inline">Survey</span>
            </Link>
            <button onClick={exportCsv} disabled={!rows.length} className="crate border border-border px-3 py-2.5 text-xs uppercase tracking-widest text-foreground disabled:opacity-40 flex items-center gap-1.5 min-h-[44px]">
              <Download size={13} /> <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button onClick={() => refetch()} className="crate bg-primary px-3 py-2.5 text-xs uppercase tracking-widest text-primary-foreground flex items-center gap-1.5 min-h-[44px]">
              <RefreshCw size={13} /> <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-1.5 min-w-max">
          {([
            ["overview",    BarChart2,   "Overview"],
            ["analytics",   Activity,    "Analytics"],
            ["leaderboard", Trophy,      "Leaderboard"],
            ["responses",   List,        "Responses"],
            ["insights",    Flame,       "Insights"],
            ["controls",    Settings,    "Controls"],
          ] as [TabId, React.ElementType, string][]).map(([id, Icon, label]) => (
            <Tab key={id} id={id} active={activeTab === id} icon={Icon} label={label} onClick={() => setActiveTab(id)} />
          ))}
          </div>
        </div>
      </div>

      {/* Demo banner */}
      {rows.length > 0 && rows[0]?.id?.startsWith("demo-") && (
        <div className="border-b border-yellow-500/30 bg-yellow-500/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 flex items-center gap-2 text-xs text-yellow-400">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
            <span>
              <strong>Demo Mode</strong> — Showing sample data. Connect Supabase in your{" "}
              <code className="rounded bg-yellow-500/20 px-1">.env</code> file to see real responses.
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {isLoading && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
            Loading intel...
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* ══════════════════════════════════════════════════════
                TAB: OVERVIEW
            ══════════════════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={Users}       label="Total Responses"  value={totalResponses}          sub={`+${todayCount} today, +${yesterdayCount} yesterday`} />
                  <StatCard icon={Clock}       label="Avg Hours / Week" value={avgHours.toFixed(1)+"h"} sub={`Max: ${maxHours}h by ${topPlayer?.player_name ?? "—"}`} />
                  <StatCard icon={MessageSquare} label="With Feedback"  value={withFeedback}            sub={pct(withFeedback, totalResponses) + " of total"} />
                  <StatCard icon={Target}      label="With IGN ID"      value={withIgn}                 sub={pct(withIgn, totalResponses) + " provided ID"} />
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={MapPin}       label="Top Map"          value={maps[0]?.name ?? "—"}    sub={`${maps[0]?.value ?? 0} votes · ${pct(maps[0]?.value ?? 0, totalResponses)}`} />
                  <StatCard icon={Crosshair}   label="Top Weapon"       value={weapons[0]?.name ?? "—"} sub={`${weapons[0]?.value ?? 0} votes`} />
                  <StatCard icon={Zap}         label="Top Mode"         value={modes[0]?.name ?? "—"}   sub={`${modes[0]?.value ?? 0} votes`} />
                  <StatCard icon={Award}       label="Top Rank"         value={ranks[0]?.name ?? "—"}   sub={`${ranks[0]?.value ?? 0} players`} />
                </div>

                {/* Mini distribution rows */}
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <div className="crate border border-border bg-card p-5 space-y-3">
                    <h3 className="stencil text-lg text-foreground">Map Votes</h3>
                    {maps.map(m => <ProgressRow key={m.name} name={m.name} value={m.value} total={totalResponses} />)}
                  </div>
                  <div className="crate border border-border bg-card p-5 space-y-3">
                    <h3 className="stencil text-lg text-foreground">Weapon Votes</h3>
                    {weapons.map(w => <ProgressRow key={w.name} name={w.name} value={w.value} total={totalResponses} color="#e8b23a" />)}
                  </div>
                  <div className="crate border border-border bg-card p-5 space-y-3">
                    <h3 className="stencil text-lg text-foreground">Mode Votes</h3>
                    {modes.map(m => <ProgressRow key={m.name} name={m.name} value={m.value} total={totalResponses} color="#7f9f6a" />)}
                  </div>
                  <div className="crate border border-border bg-card p-5 space-y-3">
                    <h3 className="stencil text-lg text-foreground">Rank Spread</h3>
                    {RANK_ORDER.filter(r => ranks.find(x => x.name === r)).map(name => {
                      const v = ranks.find(x => x.name === name)?.value ?? 0;
                      return <ProgressRow key={name} name={name} value={v} total={totalResponses} color={RANK_COLORS[name]} />;
                    })}
                  </div>
                </div>

                {/* Submissions over time */}
                <ChartCard title="Cumulative Submissions" subtitle="Total survey responses over time" span2>
                  <AreaChart data={cumulativeTimeline}>
                    <defs>
                      <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#fillTotal)" name="Total" />
                    <Area type="monotone" dataKey="count" stroke="#e8b23a" strokeWidth={2} fill="none" name="Daily" strokeDasharray="4 4" />
                  </AreaChart>
                </ChartCard>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB: ANALYTICS
            ══════════════════════════════════════════════════════ */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <ChartCard title="Favorite Maps" subtitle="Vote count per map">
                    <BarChart data={maps}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:12 }} />
                      <Bar dataKey="value" name="Votes" radius={[6,6,0,0]}>
                        {maps.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ChartCard>

                  <ChartCard title="Preferred Modes" subtitle="Pie distribution of game modes">
                    <PieChart>
                      <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:12 }} />
                      <Legend />
                      <Pie data={modes} dataKey="value" nameKey="name" outerRadius={95} innerRadius={40} paddingAngle={3}>
                        {modes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ChartCard>

                  <ChartCard title="Weapons of Choice" subtitle="Most popular weapons (horizontal)">
                    <BarChart data={weapons} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis type="category" dataKey="name" width={60} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:12 }} />
                      <Bar dataKey="value" name="Votes" fill="#e8b23a" radius={[0,6,6,0]} />
                    </BarChart>
                  </ChartCard>

                  <ChartCard title="Rank Distribution" subtitle="Player rank spread">
                    <BarChart data={RANK_ORDER.map(n => ({ name: n, value: ranks.find(r => r.name === n)?.value ?? 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-35} textAnchor="end" interval={0} height={50} />
                      <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:12 }} />
                      <Bar dataKey="value" name="Players" radius={[6,6,0,0]}>
                        {RANK_ORDER.map(n => <Cell key={n} fill={RANK_COLORS[n] ?? "#888"} />)}
                      </Bar>
                    </BarChart>
                  </ChartCard>

                  <ChartCard title="Hours Played Distribution" subtitle="How many hours per week players grind">
                    <BarChart data={hoursBuckets}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:12 }} />
                      <Bar dataKey="value" name="Players" fill="#6d8ea0" radius={[6,6,0,0]} />
                    </BarChart>
                  </ChartCard>

                  <ChartCard title="Rank Radar" subtitle="Radar view of rank popularity">
                    <RadarChart data={rankRadar}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Radar name="Players" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                      <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:12 }} />
                    </RadarChart>
                  </ChartCard>

                  <ChartCard title="Avg Hours by Favourite Map" subtitle="Which map players spend most time playing" span2>
                    <BarChart data={mapHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:12 }} formatter={(v) => [v + "h", "Avg Hours"]} />
                      <Bar dataKey="avg" name="Avg Hours" fill="#7f9f6a" radius={[6,6,0,0]}>
                        {mapHours.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ChartCard>

                  <ChartCard title="Daily Submissions" subtitle="New responses per day" span2>
                    <LineChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:12 }} />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r:4, fill:"hsl(var(--primary))" }} name="Submissions" />
                    </LineChart>
                  </ChartCard>

                  {/* Level distribution */}
                  {rowsWithLevel.length > 0 && (
                    <ChartCard title="PUBG Level Distribution" subtitle={`Avg level: ${avgLevel} across ${rowsWithLevel.length} players`} span2>
                      <BarChart data={lvlBuckets}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:12 }} />
                        <Bar dataKey="value" name="Players" radius={[6,6,0,0]}>
                          {lvlBuckets.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ChartCard>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB: LEADERBOARD
            ══════════════════════════════════════════════════════ */}
            {activeTab === "leaderboard" && (
              <div className="space-y-6">
                {/* Top Grinders */}
                <div className="crate border border-border bg-card p-5">
                  <h3 className="stencil text-xl text-foreground mb-4 flex items-center gap-2">
                    <Flame size={18} className="text-primary" /> Top Grinders (Hours / Week)
                  </h3>
                  <div className="space-y-2">
                    {[...rows].sort((a,b)=>(b.hours_per_week??0)-(a.hours_per_week??0)).slice(0,10).map((r,i)=>(
                      <div key={r.id} className="flex items-center gap-4 rounded-xl px-4 py-3 bg-surface-2/40 hover:bg-surface-2/80 transition-colors cursor-pointer" onClick={()=>setSelectedRow(r)}>
                        <span className={`w-7 text-center font-bold text-sm ${i===0?"text-yellow-400":i===1?"text-slate-300":i===2?"text-amber-600":"text-muted-foreground"}`}>{i+1}</span>
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary font-bold shrink-0">
                          {r.player_name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{r.player_name}</p>
                          <p className="text-xs text-muted-foreground">{r.rank_tier} · {r.favorite_map} · {r.favorite_weapon}</p>
                        </div>
                        <span className="stencil text-base sm:text-xl text-primary shrink-0">{r.hours_per_week}h</span>
                      </div>
                    ))}
                    {!rows.length && <p className="text-muted-foreground text-sm py-4 text-center">No data yet.</p>}
                  </div>
                </div>

                {/* Top Conquerors */}
                <div className="crate border border-border bg-card p-5">
                  <h3 className="stencil text-xl text-foreground mb-4 flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-400" /> Conquerors & Aces
                  </h3>
                  <div className="space-y-2">
                    {rows.filter(r=>r.rank_tier==="Conqueror"||r.rank_tier==="Ace").slice(0,10).map((r,i)=>(
                      <div key={r.id} className="flex items-center gap-4 rounded-xl px-4 py-3 bg-surface-2/40 hover:bg-surface-2/80 transition-colors cursor-pointer" onClick={()=>setSelectedRow(r)}>
                        <span className="w-7 text-center font-bold text-sm text-muted-foreground">{i+1}</span>
                        <div className="grid h-9 w-9 place-items-center rounded-xl shrink-0 font-bold" style={{background:`${RANK_COLORS[r.rank_tier]}22`,color:RANK_COLORS[r.rank_tier]}}>
                          {r.player_name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{r.player_name}</p>
                          <p className="text-xs text-muted-foreground">{r.ign_id ?? "No IGN"} · {r.preferred_mode} · {r.hours_per_week}h/wk</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{background:`${RANK_COLORS[r.rank_tier]}22`,color:RANK_COLORS[r.rank_tier]}}>
                          {r.rank_tier}
                        </span>
                      </div>
                    ))}
                    {rows.filter(r=>r.rank_tier==="Conqueror"||r.rank_tier==="Ace").length===0 && (
                      <p className="text-muted-foreground text-sm py-4 text-center">No Conquerors or Aces yet.</p>
                    )}
                  </div>
                </div>

                {/* Top Level Players */}
                {rowsWithLevel.length > 0 && (
                  <div className="crate border border-border bg-card p-5">
                    <h3 className="stencil text-xl text-foreground mb-4 flex items-center gap-2">
                      <Star size={18} className="text-yellow-400" /> Highest Level Players
                    </h3>
                    <div className="space-y-2">
                      {[...rows].filter(r => r.pubg_level).sort((a,b) => (b.pubg_level ?? 0) - (a.pubg_level ?? 0)).slice(0, 10).map((r, i) => (
                        <div key={r.id} className="flex items-center gap-4 rounded-xl px-4 py-3 bg-surface-2/40 hover:bg-surface-2/80 transition-colors cursor-pointer" onClick={() => setSelectedRow(r)}>
                          <span className={`w-7 text-center font-bold text-sm ${i===0?"text-yellow-400":i===1?"text-slate-300":i===2?"text-amber-600":"text-muted-foreground"}`}>{i+1}</span>
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary font-bold shrink-0">
                            {r.player_name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{r.player_name}</p>
                            <p className="text-xs text-muted-foreground">{r.rank_tier} · {r.hours_per_week}h/wk</p>
                          </div>
                          <span className="stencil text-base sm:text-xl text-primary shrink-0">Lv.{r.pubg_level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback Champions */}
                <div className="crate border border-border bg-card p-5">                  <h3 className="stencil text-xl text-foreground mb-4 flex items-center gap-2">
                    <MessageSquare size={18} className="text-primary" /> Feedback Champions (Longest Feedback)
                  </h3>
                  <div className="space-y-2">
                    {[...rows].filter(r=>r.feedback?.trim()).sort((a,b)=>(b.feedback?.length??0)-(a.feedback?.length??0)).slice(0,5).map((r,i)=>(
                      <div key={r.id} className="rounded-xl px-4 py-3 bg-surface-2/40 hover:bg-surface-2/80 transition-colors cursor-pointer" onClick={()=>setSelectedRow(r)}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs text-muted-foreground">#{i+1}</span>
                          <span className="font-semibold text-foreground">{r.player_name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{r.feedback?.length} chars</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">"{r.feedback}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB: RESPONSES
            ══════════════════════════════════════════════════════ */}
            {activeTab === "responses" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={search} onChange={e=>setSearch(e.target.value)}
                      placeholder="Search player, IGN, feedback..."
                      className="w-full rounded-xl border border-border bg-surface-2/60 pl-9 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary min-h-[44px]"
                    />
                    {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={13}/></button>}
                  </div>
                  <div className="flex gap-2 flex-wrap w-full sm:w-auto sm:flex-nowrap">
                  <select value={filterMap} onChange={e=>setFilterMap(e.target.value)} className="flex-1 min-w-[100px] rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary min-h-[44px]">
                    <option value="">All Maps</option>
                    {uniqueMaps.map(m=><option key={m}>{m}</option>)}
                  </select>
                  <select value={filterRank} onChange={e=>setFilterRank(e.target.value)} className="flex-1 min-w-[100px] rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary min-h-[44px]">
                    <option value="">All Ranks</option>
                    {uniqueRanks.map(r=><option key={r}>{r}</option>)}
                  </select>
                  <select value={filterMode} onChange={e=>setFilterMode(e.target.value)} className="flex-1 min-w-[100px] rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary min-h-[44px]">
                    <option value="">All Modes</option>
                    {uniqueModes.map(m=><option key={m}>{m}</option>)}
                  </select>
                  </div>
                  {(search||filterMap||filterRank||filterMode) && (
                    <button onClick={()=>{setSearch("");setFilterMap("");setFilterRank("");setFilterMode("");}} className="flex items-center gap-1 text-xs text-destructive hover:text-foreground min-h-[44px] px-2">
                      <X size={13}/> Clear
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{filteredRows.length}/{totalResponses}</span>
                </div>

                {/* Table with scroll shadow */}
                <div className="relative">
                  <div className="crate overflow-x-auto border border-border bg-card [scrollbar-width:thin]">
                  <table className="w-full min-w-[1000px] text-left text-sm">
                    <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-widest text-muted-foreground">
                      <tr>
                        {([
                          ["created_at","Date"],["player_name","Player"],["ign_id","IGN ID"],
                          ["pubg_level","Level"],
                          ["favorite_map","Map"],["favorite_weapon","Weapon"],["preferred_mode","Mode"],
                          ["rank_tier","Rank"],["hours_per_week","Hrs"],["feedback","Feedback"],
                        ] as [keyof SurveyRow, string][]).map(([key,label])=>(
                          <th key={key} className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={()=>toggleSort(key)}>
                            <span className="flex items-center gap-1">
                              {label}
                              {sortKey===key ? (sortDir==="asc"?<ChevronUp size={12}/>:<ChevronDown size={12}/>) : null}
                            </span>
                          </th>
                        ))}
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map(r=>(
                        <tr key={r.id} className="border-t border-border/40 hover:bg-surface-2/30 transition-colors align-top">
                          <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}<br/><span className="text-[10px]">{new Date(r.created_at).toLocaleTimeString()}</span></td>
                          <td className="px-4 py-3 font-medium text-foreground">{r.player_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.ign_id || "—"}</td>
                          <td className="px-4 py-3 tabular-nums">
                            {r.pubg_level ? (
                              <span className="rounded-lg bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">Lv.{r.pubg_level}</span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3">{r.favorite_map}</td>
                          <td className="px-4 py-3">{r.favorite_weapon}</td>
                          <td className="px-4 py-3">{r.preferred_mode}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{background:`${RANK_COLORS[r.rank_tier]}22`,color:RANK_COLORS[r.rank_tier]??'inherit'}}>
                              {r.rank_tier}
                            </span>
                          </td>
                          <td className="px-4 py-3 tabular-nums">{r.hours_per_week}h</td>
                          <td className="max-w-[160px] px-4 py-3 text-muted-foreground text-xs truncate">{r.feedback || "—"}</td>
                          <td className="px-4 py-3">
                            <button onClick={()=>setSelectedRow(r)} className="text-xs text-primary hover:underline"><Eye size={14}/></button>
                          </td>
                        </tr>
                      ))}
                      {!filteredRows.length && (
                        <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">No responses match your filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB: INSIGHTS
            ══════════════════════════════════════════════════════ */}
            {activeTab === "insights" && (
              <div className="space-y-6">
                {/* Key Insights Grid */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      icon: Star, title: "Most Popular Combo",
                      value: `${maps[0]?.name ?? "—"} + ${weapons[0]?.name ?? "—"}`,
                      desc: "The most chosen map & weapon combination.",
                    },
                    {
                      icon: TrendingUp, title: "Peak Submission Day",
                      value: timeline.slice().sort((a,b)=>b.count-a.count)[0]?.date ?? "—",
                      desc: `${timeline.slice().sort((a,b)=>b.count-a.count)[0]?.count ?? 0} submissions in a single day`,
                    },
                    {
                      icon: Shield, title: "Competitive Players",
                      value: rows.filter(r=>["Diamond","Crown","Ace","Conqueror"].includes(r.rank_tier)).length,
                      desc: `${pct(rows.filter(r=>["Diamond","Crown","Ace","Conqueror"].includes(r.rank_tier)).length, totalResponses)} are Diamond+`,
                    },
                    {
                      icon: Clock, title: "Hardcore Grinders",
                      value: rows.filter(r=>(r.hours_per_week??0)>=20).length,
                      desc: `${pct(rows.filter(r=>(r.hours_per_week??0)>=20).length, totalResponses)} play 20+ hrs/week`,
                    },
                    {
                      icon: Calendar, title: "Avg Submissions / Day",
                      value: timeline.length ? (totalResponses / timeline.length).toFixed(1) : "0",
                      desc: `Across ${timeline.length} active days`,
                    },
                    {
                      icon: MessageSquare, title: "Feedback Rate",
                      value: pct(withFeedback, totalResponses),
                      desc: `${withFeedback} players left written feedback`,
                    },
                  ].map(({icon:Icon,title,value,desc})=>(
                    <div key={title} className="crate border border-border bg-card p-5 flex gap-4 items-start">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                        <Icon size={18}/>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
                        <p className="stencil text-xl text-foreground mt-1">{value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback Feed */}
                <div className="crate border border-border bg-card p-5">
                  <h3 className="stencil text-xl text-foreground mb-4 flex items-center gap-2">
                    <MessageSquare size={18} className="text-primary" /> Player Feedback Feed
                  </h3>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {rows.filter(r=>r.feedback?.trim()).map(r=>(
                      <div key={r.id} className="rounded-xl bg-surface-2/40 p-4 cursor-pointer hover:bg-surface-2/80 transition-colors" onClick={()=>setSelectedRow(r)}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary font-bold text-sm shrink-0">
                            {r.player_name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{r.player_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span style={{color:RANK_COLORS[r.rank_tier]}}>{r.rank_tier}</span>
                              <span>·</span>
                              <span>{r.favorite_map}</span>
                              <span>·</span>
                              <span>{r.hours_per_week}h/wk</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">"{r.feedback}"</p>
                      </div>
                    ))}
                    {rows.filter(r=>r.feedback?.trim()).length===0 && (
                      <p className="text-center text-muted-foreground py-8">No feedback submitted yet.</p>
                    )}
                  </div>
                </div>

                {/* Summary Table */}
                <div className="crate border border-border bg-card p-5">
                  <h3 className="stencil text-xl text-foreground mb-4">Full Survey Summary</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                        <tr>
                          <th className="pb-3 text-left font-medium">Metric</th>
                          <th className="pb-3 text-right font-medium">Value</th>
                          <th className="pb-3 text-right font-medium hidden sm:table-cell">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {[
                          ["Total Responses", totalResponses, "All submissions"],
                          ["Responses Today", todayCount, `vs ${yesterdayCount} yesterday`],
                          ["Average Hours/Week", avgHours.toFixed(1)+"h", `Max ${maxHours}h`],
                          ["Feedback Rate", pct(withFeedback,totalResponses), `${withFeedback} of ${totalResponses}`],
                          ["IGN Provided", pct(withIgn,totalResponses), `${withIgn} of ${totalResponses}`],
                          ["Top Map", maps[0]?.name??"—", `${maps[0]?.value??0} votes`],
                          ["Top Weapon", weapons[0]?.name??"—", `${weapons[0]?.value??0} votes`],
                          ["Top Mode", modes[0]?.name??"—", `${modes[0]?.value??0} votes`],
                          ["Top Rank", ranks[0]?.name??"—", `${ranks[0]?.value??0} players`],
                          ["Diamond+ Players", rows.filter(r=>["Diamond","Crown","Ace","Conqueror"].includes(r.rank_tier)).length, pct(rows.filter(r=>["Diamond","Crown","Ace","Conqueror"].includes(r.rank_tier)).length,totalResponses)],
                          ["Hardcore (20h+)", rows.filter(r=>(r.hours_per_week??0)>=20).length, pct(rows.filter(r=>(r.hours_per_week??0)>=20).length,totalResponses)],
                          ["Active Days", timeline.length, `First: ${timeline[0]?.date??"—"}`],
                          ["Avg PUBG Level", rowsWithLevel.length ? avgLevel : "—", `${rowsWithLevel.length} players reported`],
                          ["Highest Level", rowsWithLevel.length ? maxLevel : "—", topLevelPlayer?.player_name ?? ""],
                        ].map(([label,value,detail])=>(
                          <tr key={String(label)}>
                            <td className="py-3 text-muted-foreground">{label}</td>
                            <td className="py-3 text-right font-semibold text-foreground tabular-nums">{value}</td>
                            <td className="py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">{detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {/* ══════════════════════════════════════════════════════
                TAB: CONTROLS
            ══════════════════════════════════════════════════════ */}
            {activeTab === "controls" && (
              <ControlsTab config={config} update={update} reset={reset} onSave={handleSave} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CONTROLS TAB
// ══════════════════════════════════════════════════════════════════════════

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: "Text input",
  number: "Number input",
  chips: "Chip selector",
  range: "Range slider",
  textarea: "Text area",
};
const QUESTION_TYPE_ICONS: Record<QuestionType, React.ElementType> = {
  text: Type,
  number: Hash,
  chips: ChevronRight,
  range: SlidersHorizontal,
  textarea: AlignLeft,
};

function CtrlSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="crate border border-border bg-card p-4 sm:p-5 space-y-4">
      <h3 className="stencil text-base sm:text-lg text-foreground border-b border-border/60 pb-3">{title}</h3>
      {children}
    </div>
  );
}

function CtrlField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-foreground uppercase tracking-widest">{label}</label>
      {hint && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}
      {children}
    </div>
  );
}

function CtrlInput({ value, onChange, multiline = false, placeholder = "" }: {
  value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  const cls = "w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50 transition-colors";
  return multiline
    ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder} className={cls + " resize-none"} />
    : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />;
}

function CtrlToggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
      {value
        ? <ToggleRight size={22} className="text-primary shrink-0" />
        : <ToggleLeft size={22} className="text-muted-foreground shrink-0" />}
      {label}
    </button>
  );
}

// ── Question Editor Card ─────────────────────────────────────────────────
function QuestionCard({
  q, index, total,
  onChange, onDelete, onMoveUp, onMoveDown,
}: {
  q: SurveyQuestion; index: number; total: number;
  onChange: (q: SurveyQuestion) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = QUESTION_TYPE_ICONS[q.type];

  const set = (patch: Partial<SurveyQuestion>) => onChange({ ...q, ...patch });

  return (
    <div className={`rounded-xl border transition-colors ${q.enabled ? "border-border bg-card" : "border-border/40 bg-card/40 opacity-60"}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical size={15} className="text-muted-foreground/40 shrink-0" />
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary text-xs font-bold">
          {index + 1}
        </span>
        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground bg-surface-2/60 rounded-lg px-2 py-1 hidden sm:flex">
          <Icon size={11} />
          {QUESTION_TYPE_LABELS[q.type]}
        </div>
        <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">{q.label}</p>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onMoveUp()} disabled={index === 0}
            className="p-1.5 rounded-lg hover:bg-surface-2 disabled:opacity-20 text-muted-foreground" title="Move up">
            <ChevronUp size={13} />
          </button>
          <button onClick={() => onMoveDown()} disabled={index === total - 1}
            className="p-1.5 rounded-lg hover:bg-surface-2 disabled:opacity-20 text-muted-foreground" title="Move down">
            <ChevronDown size={13} />
          </button>
          <button onClick={() => set({ enabled: !q.enabled })}
            className={`p-1.5 rounded-lg hover:bg-surface-2 ${q.enabled ? "text-primary" : "text-muted-foreground"}`} title="Toggle visibility">
            {q.enabled ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
          </button>
          <button onClick={() => setExpanded(x => !x)}
            className="p-1.5 rounded-lg hover:bg-surface-2 text-muted-foreground" title="Edit">
            <Settings size={13} className={expanded ? "text-primary" : ""} />
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/20 text-destructive/60 hover:text-destructive" title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-border/60 px-4 py-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <CtrlField label="Question label">
              <CtrlInput value={q.label} onChange={v => set({ label: v })} placeholder="e.g. Your name" />
            </CtrlField>
            <CtrlField label="Hint text" hint="Shown below the label">
              <CtrlInput value={q.hint ?? ""} onChange={v => set({ hint: v })} placeholder="Optional hint..." />
            </CtrlField>
          </div>

          {(q.type === "text" || q.type === "textarea") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <CtrlField label="Placeholder">
                <CtrlInput value={q.placeholder ?? ""} onChange={v => set({ placeholder: v })} placeholder="e.g. Ghost" />
              </CtrlField>
              <CtrlField label="Max length">
                <input type="number" value={q.maxLength ?? ""} onChange={e => set({ maxLength: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
              </CtrlField>
            </div>
          )}

          {q.type === "number" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <CtrlField label="Placeholder">
                <CtrlInput value={q.placeholder ?? ""} onChange={v => set({ placeholder: v })} placeholder="e.g. 75" />
              </CtrlField>
              <CtrlField label="Min value">
                <input type="number" value={q.min ?? ""} onChange={e => set({ min: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
              </CtrlField>
              <CtrlField label="Max value">
                <input type="number" value={q.max ?? ""} onChange={e => set({ max: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
              </CtrlField>
            </div>
          )}

          {q.type === "range" && (
            <div className="grid gap-4 sm:grid-cols-4">
              <CtrlField label="Min"><input type="number" value={q.min ?? 0} onChange={e => set({ min: Number(e.target.value) })} className="w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary" /></CtrlField>
              <CtrlField label="Max"><input type="number" value={q.max ?? 120} onChange={e => set({ max: Number(e.target.value) })} className="w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary" /></CtrlField>
              <CtrlField label="Step"><input type="number" value={q.step ?? 1} onChange={e => set({ step: Number(e.target.value) })} className="w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary" /></CtrlField>
              <CtrlField label="Unit (e.g. h)"><CtrlInput value={q.unit ?? ""} onChange={v => set({ unit: v })} placeholder="h" /></CtrlField>
            </div>
          )}

          {q.type === "chips" && (
            <CtrlField label="Options" hint="One option per line">
              <textarea
                value={(q.options ?? []).join("\n")}
                onChange={e => set({ options: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })}
                rows={5}
                className="w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none font-mono"
                placeholder={"Erangel\nMiramar\nSanhok"} />
              <p className="text-xs text-muted-foreground">{(q.options ?? []).length} options</p>
            </CtrlField>
          )}

          <div className="flex items-center gap-6 pt-1">
            <CtrlToggle value={q.required} onChange={v => set({ required: v })} label="Required field" />
            <CtrlToggle value={q.enabled} onChange={v => set({ enabled: v })} label="Visible on survey" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Question Modal ───────────────────────────────────────────────────
function AddQuestionModal({ onAdd, onClose }: {
  onAdd: (q: SurveyQuestion) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<QuestionType>("text");
  const [label, setLabel] = useState("");

  function handleAdd() {
    if (!label.trim()) return;
    const base: SurveyQuestion = {
      id: generateQuestionId(),
      type,
      label: label.trim(),
      required: false,
      enabled: true,
    };
    if (type === "chips") base.options = ["Option 1", "Option 2", "Option 3"];
    if (type === "range") { base.min = 0; base.max = 100; base.step = 1; base.unit = ""; }
    if (type === "number") { base.min = 1; base.max = 9999; base.placeholder = "e.g. 10"; }
    if (type === "text" || type === "textarea") { base.placeholder = "Your answer..."; base.maxLength = 300; }
    onAdd(base);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative glass rounded-2xl p-4 sm:p-6 max-w-sm w-full space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="stencil text-lg text-foreground">Add Question</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <CtrlField label="Question type">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map(t => {
              const Icon = QUESTION_TYPE_ICONS[t];
              return (
                <button key={t} onClick={() => setType(t)} type="button"
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all ${type === t ? "border-primary/60 bg-primary/15 text-foreground" : "border-border bg-surface-2/40 text-muted-foreground hover:text-foreground"}`}>
                  <Icon size={14} className="shrink-0" />
                  {QUESTION_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </CtrlField>

        <CtrlField label="Question label">
          <CtrlInput value={label} onChange={setLabel} placeholder="e.g. Your favourite weapon" />
        </CtrlField>

        <button onClick={handleAdd} disabled={!label.trim()}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
          <Plus size={15} /> Add Question
        </button>
      </div>
    </div>
  );
}

// ── Main Controls Tab ────────────────────────────────────────────────────
function ControlsTab({ config, update, reset, onSave }: {
  config: ReturnType<typeof import("@/lib/site-config").loadConfig>;
  update: (patch: Partial<ReturnType<typeof import("@/lib/site-config").loadConfig>>) => void;
  reset: () => void;
  onSave: () => void;
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  function updateQuestion(index: number, q: SurveyQuestion) {
    const next = [...config.questions];
    next[index] = q;
    update({ questions: next });
  }
  function deleteQuestion(index: number) {
    update({ questions: config.questions.filter((_, i) => i !== index) });
  }
  function moveQuestion(index: number, dir: -1 | 1) {
    const next = [...config.questions];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    update({ questions: next });
  }
  function addQuestion(q: SurveyQuestion) {
    update({ questions: [...config.questions, q] });
    onSave();
  }

  function handleReset() {
    if (!resetConfirm) { setResetConfirm(true); setTimeout(() => setResetConfirm(false), 4000); return; }
    reset(); onSave(); setResetConfirm(false);
  }

  return (
    <div className="space-y-6">
      {showAddModal && <AddQuestionModal onAdd={addQuestion} onClose={() => setShowAddModal(false)} />}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="stencil text-xl text-foreground">Site Controls</h2>
          <p className="text-xs text-muted-foreground mt-0.5">All changes apply to the survey instantly — no reload needed.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all min-h-[44px] ${resetConfirm ? "border-destructive/60 bg-destructive/15 text-destructive" : "border-border text-muted-foreground hover:text-foreground"}`}>
            <RotateCcw size={13} />
            <span className="hidden sm:inline">{resetConfirm ? "Confirm reset" : "Reset defaults"}</span>
          </button>
          <button onClick={onSave}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]">
            <Save size={13} /> <span className="hidden sm:inline">Save &amp; Apply</span>
          </button>
        </div>
      </div>

      {/* ── Header Content ──────────────────────────────────────────── */}
      <CtrlSection title="🏠 Header Content">
        <div className="grid gap-4 sm:grid-cols-2">
          <CtrlField label="Main title" hint="Large heading on the survey page">
            <CtrlInput value={config.siteTitle} onChange={v => { update({ siteTitle: v }); onSave(); }} placeholder="PUBG Mobile" />
          </CtrlField>
          <CtrlField label="Subtitle" hint="Smaller line below the title">
            <CtrlInput value={config.siteSubtitle} onChange={v => { update({ siteSubtitle: v }); onSave(); }} placeholder="Player Survey" />
          </CtrlField>
        </div>
        <CtrlField label="Badge text" hint="Small pill shown above the title">
          <CtrlInput value={config.headerBadge} onChange={v => { update({ headerBadge: v }); onSave(); }} placeholder="Drop zone intel · Season survey" />
        </CtrlField>
        <CtrlField label="Description paragraph">
          <CtrlInput multiline value={config.headerDescription} onChange={v => { update({ headerDescription: v }); onSave(); }} placeholder="Tell players what this survey is about..." />
        </CtrlField>
      </CtrlSection>

      {/* ── Prize Banner ─────────────────────────────────────────────── */}
      <CtrlSection title="🎁 Prize Banner">
        <CtrlToggle value={config.prizeEnabled} onChange={v => { update({ prizeEnabled: v }); onSave(); }} label="Show prize banner on survey page" />
        {config.prizeEnabled && (
          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            <CtrlField label="Emoji icon">
              <CtrlInput value={config.prizeEmoji} onChange={v => { update({ prizeEmoji: v }); onSave(); }} placeholder="🎁" />
            </CtrlField>
            <CtrlField label="Prize title">
              <CtrlInput value={config.prizeTitle} onChange={v => { update({ prizeTitle: v }); onSave(); }} placeholder="Win 700 UC" />
            </CtrlField>
            <CtrlField label="Prize description">
              <CtrlInput value={config.prizeDescription} onChange={v => { update({ prizeDescription: v }); onSave(); }} placeholder="Submit your intel for a chance to win..." />
            </CtrlField>
          </div>
        )}
      </CtrlSection>

      {/* ── Submit Button ────────────────────────────────────────────── */}
      <CtrlSection title="🚀 Submit Button">
        <div className="grid gap-4 sm:grid-cols-2">
          <CtrlField label="Button text">
            <CtrlInput value={config.submitButtonText} onChange={v => { update({ submitButtonText: v }); onSave(); }} placeholder="Submit intel" />
          </CtrlField>
          <CtrlField label="Disclaimer text" hint="Small text below the button">
            <CtrlInput value={config.submitDisclaimer} onChange={v => { update({ submitDisclaimer: v }); onSave(); }} placeholder="Responses are stored securely..." />
          </CtrlField>
        </div>
      </CtrlSection>

      {/* ── Success Screen ───────────────────────────────────────────── */}
      <CtrlSection title="✅ Success Screen">
        <div className="grid gap-4 sm:grid-cols-2">
          <CtrlField label="Success title">
            <CtrlInput value={config.successTitle} onChange={v => { update({ successTitle: v }); onSave(); }} placeholder="Winner Winner, Chicken Dinner" />
          </CtrlField>
          <CtrlField label="Success message">
            <CtrlInput value={config.successMessage} onChange={v => { update({ successMessage: v }); onSave(); }} placeholder="Intel received, soldier..." />
          </CtrlField>
        </div>
        <CtrlField label="Button text (submit again)">
          <CtrlInput value={config.successButtonText} onChange={v => { update({ successButtonText: v }); onSave(); }} placeholder="Submit another response" />
        </CtrlField>
      </CtrlSection>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <CtrlSection title="🦶 Footer">
        <CtrlField label="Footer text">
          <CtrlInput value={config.footerText} onChange={v => { update({ footerText: v }); onSave(); }} placeholder="Drop Zone Intel · community-run..." />
        </CtrlField>
      </CtrlSection>

      {/* ── Survey Questions ─────────────────────────────────────────── */}
      <div className="crate border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="stencil text-lg text-foreground">📋 Survey Questions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {config.questions.filter(q => q.enabled).length} active · {config.questions.length} total
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus size={13} /> Add Question
          </button>
        </div>

        <div className="space-y-2">
          {config.questions.map((q, i) => (
            <QuestionCard key={q.id} q={q} index={i} total={config.questions.length}
              onChange={nq => { updateQuestion(i, nq); onSave(); }}
              onDelete={() => { deleteQuestion(i); onSave(); }}
              onMoveUp={() => { moveQuestion(i, -1); onSave(); }}
              onMoveDown={() => { moveQuestion(i, 1); onSave(); }} />
          ))}
          {config.questions.length === 0 && (
            <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              No questions yet. Click <strong>Add Question</strong> to create one.
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/60">
          {[
            ["Total", config.questions.length],
            ["Active", config.questions.filter(q => q.enabled).length],
            ["Required", config.questions.filter(q => q.required && q.enabled).length],
          ].map(([label, val]) => (
            <div key={String(label)} className="rounded-xl bg-surface-2/40 px-3 py-2 text-center">
              <p className="stencil text-xl text-foreground">{val}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live Preview Link ────────────────────────────────────────── */}
      <div className="crate border border-primary/30 bg-primary/5 p-5 flex items-center gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Eye size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Preview your changes</p>
          <p className="text-xs text-muted-foreground">Open the survey page to see all edits live.</p>
        </div>
        <Link to="/" target="_blank"
          className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5">
          <Eye size={12} /> Open Survey
        </Link>
      </div>

      {/* Danger zone */}
      <div className="crate border border-destructive/30 bg-destructive/5 p-5 space-y-3">
        <h3 className="stencil text-base text-destructive flex items-center gap-2">
          <AlertTriangle size={16} /> Danger Zone
        </h3>
        <p className="text-xs text-muted-foreground">
          Reset will remove all customisations and restore the original survey configuration.
          This cannot be undone.
        </p>
        <button onClick={handleReset}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${resetConfirm ? "border-destructive bg-destructive text-white" : "border-destructive/40 text-destructive hover:bg-destructive/10"}`}>
          <RotateCcw size={14} />
          {resetConfirm ? "⚠️ Are you sure? Click again to reset everything" : "Reset all settings to defaults"}
        </button>
      </div>
    </div>
  );
}

// end of file