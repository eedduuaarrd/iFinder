const STORAGE_KEY = "flashhunt.gamestats.v1";

interface GameStats {
  lastFindDate: string | null;
  streakDays: number;
  lastFindTimestamp: number | null;
  badges: string[];
  totalFinds: number;
}

function load(): GameStats {
  if (typeof window === "undefined") return { lastFindDate: null, streakDays: 0, lastFindTimestamp: null, badges: [], totalFinds: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastFindDate: null, streakDays: 0, lastFindTimestamp: null, badges: [], totalFinds: 0 };
    const parsed = JSON.parse(raw);
    return {
      lastFindDate: parsed.lastFindDate ?? null,
      streakDays: parsed.streakDays ?? 0,
      lastFindTimestamp: parsed.lastFindTimestamp ?? null,
      badges: parsed.badges ?? [],
      totalFinds: parsed.totalFinds ?? 0,
    };
  } catch {
    return { lastFindDate: null, streakDays: 0, lastFindTimestamp: null, badges: [], totalFinds: 0 };
  }
}

function save(stats: GameStats) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getStats(): GameStats {
  return load();
}

export function isDailyBonusAvailable(): boolean {
  const stats = load();
  return stats.lastFindDate !== todayString();
}

export function isComboActive(windowMs = 5 * 60 * 1000): boolean {
  const stats = load();
  if (!stats.lastFindTimestamp) return false;
  return Date.now() - stats.lastFindTimestamp <= windowMs;
}

export function getStreakDays(): number {
  const stats = load();
  if (!stats.lastFindDate) return 0;
  const today = todayString();
  const yesterday = yesterdayString();
  if (stats.lastFindDate === today || stats.lastFindDate === yesterday) {
    return stats.streakDays;
  }
  return 0;
}

export function recordFind(): { dailyBonus: boolean; comboBonus: boolean; streak: number; newBadges: string[] } {
  const stats = load();
  const today = todayString();
  const yesterday = yesterdayString();
  const dailyBonus = stats.lastFindDate !== today;
  const comboBonus = !!stats.lastFindTimestamp && Date.now() - stats.lastFindTimestamp <= 5 * 60 * 1000;

  let streak = stats.streakDays;
  if (stats.lastFindDate === today) {
    // same day
  } else if (stats.lastFindDate === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  const totalFinds = stats.totalFinds + 1;
  const badges = new Set(stats.badges);
  const newBadges: string[] = [];
  if (totalFinds === 1 && !badges.has("first")) { badges.add("first"); newBadges.push("first"); }
  if (streak >= 3 && !badges.has("streak")) { badges.add("streak"); newBadges.push("streak"); }
  if (comboBonus && !badges.has("speedster")) { badges.add("speedster"); newBadges.push("speedster"); }

  save({
    lastFindDate: today,
    streakDays: streak,
    lastFindTimestamp: Date.now(),
    badges: Array.from(badges),
    totalFinds,
  });

  return { dailyBonus, comboBonus, streak, newBadges };
}

export function unlockBadge(name: string) {
  const stats = load();
  if (stats.badges.includes(name)) return;
  save({ ...stats, badges: [...stats.badges, name] });
}
