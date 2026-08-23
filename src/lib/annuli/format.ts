import type { Person } from "./types";

/** Полное имя: Имя Отчество Фамилия. */
export function fullName(p: Pick<Person, "firstName" | "patronymic" | "lastName">): string {
  return [p.firstName, p.patronymic, p.lastName].filter(Boolean).join(" ");
}

/** Строка дат жизни. */
export function lifeDates(p: Person): string {
  const b = p.birthDateApprox ? (p.birthYearFrom ? "ок." + p.birthYearFrom : "") : p.birthDate || "";
  const d = p.deathDateApprox ? (p.deathYearFrom ? "ок." + p.deathYearFrom : "") : p.deathDate || "";
  if (b && d) return `${b} — ${d}`;
  if (b) return "р. " + b;
  if (d) return "ум. " + d;
  return "";
}

/** Инициалы для аватара. */
export function initials(p: Person): string {
  return (
    ([p.firstName, p.lastName]
      .filter(Boolean)
      .map((w) => w[0])
      .join("") || "?")
      .toUpperCase()
      .slice(0, 2)
  );
}

/** Поколение из индекса вида N.5.3 -> "5". */
export function genOf(idx: string): string {
  if (!idx) return "";
  const parts = idx.split(".");
  return parts.length >= 2 ? parts[1] : "";
}

export function romanToInt(s: string): number {
  if (!s) return 0;
  const m: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let r = 0;
  let prev = 0;
  for (const c of s.toUpperCase().split("").reverse()) {
    const v = m[c];
    if (!v) return 0;
    if (v < prev) r -= v;
    else r += v;
    prev = v;
  }
  return r;
}

export function compareGenerations(a: string, b: string): number {
  const ai = romanToInt(a) || parseInt(a) || 0;
  const bi = romanToInt(b) || parseInt(b) || 0;
  return ai - bi;
}

export function compareIndex(a: string, b: string): number {
  return (a || "").localeCompare(b || "", undefined, { numeric: true });
}
