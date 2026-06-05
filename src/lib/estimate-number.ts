// Estimate number generator
// Format: EST-YYYYMMDD-NNN
// - Daily sequence, restarts at 001 each calendar day (local time)
// - Persists last issued counter in localStorage
// - Cross-checks the projects store so the counter stays correct even if
//   localStorage was cleared on another device.

const STORAGE_KEY = "estimate-number-seq.v1";

function todayStamp(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function readState(): { date: string; n: number } {
  if (typeof window === "undefined") return { date: todayStamp(), n: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { date: string; n: number };
      if (parsed && typeof parsed.date === "string" && typeof parsed.n === "number") {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return { date: todayStamp(), n: 0 };
}

function writeState(state: { date: string; n: number }) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/**
 * Look at any externally-known estimate numbers (e.g. from the projects store)
 * and ensure today's counter is at least as high as the largest existing one.
 */
export function seedEstimateNumberFrom(existing: Iterable<string>) {
  const stamp = todayStamp();
  const prefix = `EST-${stamp}-`;
  let max = 0;
  for (const num of existing) {
    if (typeof num !== "string" || !num.startsWith(prefix)) continue;
    const tail = num.slice(prefix.length);
    const n = parseInt(tail, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  if (max > 0) {
    const current = readState();
    if (current.date !== stamp || current.n < max) {
      writeState({ date: stamp, n: max });
    }
  }
}

/** Generate the next estimate number, advancing the daily counter. */
export function nextEstimateNumber(): string {
  const stamp = todayStamp();
  const state = readState();
  const n = state.date === stamp ? state.n + 1 : 1;
  writeState({ date: stamp, n });
  return `EST-${stamp}-${String(n).padStart(3, "0")}`;
}

/** Preview the next number without consuming it. */
export function peekEstimateNumber(): string {
  const stamp = todayStamp();
  const state = readState();
  const n = state.date === stamp ? state.n + 1 : 1;
  return `EST-${stamp}-${String(n).padStart(3, "0")}`;
}
