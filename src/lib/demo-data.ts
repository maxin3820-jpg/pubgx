import type { SurveyRow } from "./admin.functions";

const MAPS    = ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Karakin"];
const WEAPONS = ["M416", "AKM", "Groza", "AWM", "DP-28", "UMP45", "M24", "Vector"];
const MODES   = ["Classic Solo", "Duo", "Squad", "TDM", "Payload", "Arena Training"];
const RANKS   = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Crown", "Ace", "Conqueror"];

const PLAYERS = [
  { name: "Ghost", ign: "512340987", feedback: "Erangel needs better loot in the south. Love the game overall!" },
  { name: "Shadow", ign: "612345678", feedback: "AWM needs a slight nerf. Too dominant in late game." },
  { name: "Viper", ign: "712345679", feedback: "Sanhok is perfect for aggressive plays. More events please!" },
  { name: "Reaper", ign: "812345680", feedback: "Matchmaking takes too long at Conqueror rank." },
  { name: "Phoenix", ign: null, feedback: "Love the new Livik updates. Keep it coming!" },
  { name: "Wraith", ign: "912345681", feedback: null },
  { name: "Cipher", ign: "101234568", feedback: "TDM maps feel small. Would love larger arenas." },
  { name: "Stalker", ign: null, feedback: null },
  { name: "Nexus", ign: "111234569", feedback: "M416 is perfectly balanced. Great job devs!" },
  { name: "Blaze", ign: "121234570", feedback: "Vikendi snow camo is the best skin I own." },
  { name: "Rogue", ign: null, feedback: "Payload mode needs more vehicles." },
  { name: "Spectre", ign: "131234571", feedback: null },
  { name: "Titan", ign: "141234572", feedback: "Groza is way too strong in close range fights." },
  { name: "Surge", ign: null, feedback: "Please add more duo-exclusive events!" },
  { name: "Apex", ign: "151234573", feedback: "Crown rank push is brutal but satisfying." },
  { name: "Maverick", ign: "161234574", feedback: "Karakin is underrated. Fast paced and fun!" },
  { name: "Eclipse", ign: null, feedback: null },
  { name: "Tempest", ign: "171234575", feedback: "UMP45 is slept on. Best SMG in the game." },
  { name: "Phantom", ign: "181234576", feedback: "Please fix the parachute landing physics." },
  { name: "Cobra", ign: null, feedback: "Duo mode with randoms is frustrating. Need better comms." },
  { name: "Raven", ign: "191234577", feedback: null },
  { name: "Nova", ign: "201234578", feedback: "The new ranked season rewards are amazing!" },
  { name: "Striker", ign: null, feedback: "Vector is a laser beam with the right attachments." },
  { name: "Hawkeye", ign: "211234579", feedback: "AWM one-taps are the most satisfying thing in gaming." },
  { name: "Ghost_X", ign: "221234580", feedback: "More Conqueror frames please!" },
  { name: "Zero", ign: null, feedback: null },
  { name: "Titan2", ign: "231234581", feedback: "Squad mode with friends is unbeatable." },
  { name: "Shade", ign: "241234582", feedback: "DP-28 suppressed is a sleeper pick for squad wipes." },
  { name: "Inferno", ign: null, feedback: "Arena Training should have rank tracking." },
  { name: "Quake", ign: "251234583", feedback: "Miramar long-range duels are the best in any BR." },
];

// Deterministic pseudo-random to keep data stable across renders
function hash(n: number) { return ((n * 1103515245 + 12345) & 0x7fffffff); }
function pick<T>(arr: T[], seed: number): T { return arr[Math.abs(hash(seed)) % arr.length]; }

// Build 30 realistic rows spread over the last 30 days
export const DEMO_ROWS: SurveyRow[] = PLAYERS.map((p, i) => {
  const daysAgo = Math.abs(hash(i * 7)) % 30;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.abs(hash(i * 3)) % 23, Math.abs(hash(i * 5)) % 59);

  const rankIndex = Math.abs(hash(i * 11)) % RANKS.length;
  // Higher ranked players grind more hours
  const baseHours = 3 + rankIndex * 3;
  const hours = Math.min(60, baseHours + (Math.abs(hash(i * 13)) % 8));

  return {
    id: `demo-${i + 1}`,
    player_name: p.name,
    ign_id: p.ign,
    pubg_level: 10 + (Math.abs(hash(i * 29)) % 190), // levels 10–199
    favorite_map: pick(MAPS, i * 17),
    favorite_weapon: pick(WEAPONS, i * 19),
    preferred_mode: pick(MODES, i * 23),
    rank_tier: RANKS[rankIndex],
    hours_per_week: hours,
    feedback: p.feedback,
    created_at: date.toISOString(),
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
