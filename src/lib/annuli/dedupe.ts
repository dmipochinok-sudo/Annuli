// Автопривязка персон (дедупликация) — сопоставление упомянутых родственников
// с уже существующими персонами базы по имени, датам и связям.
import { fullName } from "./format";
import type { Person } from "./types";

export type DupeKind = "father" | "mother" | "sibling" | "child" | "spouse";

export interface DupeCandidate {
  person: Person;
  score: number;
  reasons: string[];
}

export interface DupeSlot {
  key: string;
  kind: DupeKind;
  /** Индекс в соответствующем массиве (siblings/children/marriages), иначе null. */
  idx: number | null;
  firstName: string;
  lastName: string;
  patronymic: string;
  candidates: DupeCandidate[];
  /** Уверенное однозначное совпадение — можно привязать автоматически. */
  auto: boolean;
}

export type DupeResolution = { type: "link"; id: string } | { type: "new" };

export const KIND_LABELS: Record<DupeKind, string> = {
  father: "Отец",
  mother: "Мать",
  sibling: "Брат/сестра",
  child: "Ребёнок",
  spouse: "Супруг/а",
};

export function normName(s?: string): string {
  return (s || "").trim().toLowerCase().replace(/ё/g, "е");
}

function yearOf(...vals: (string | undefined)[]): string {
  for (const v of vals) {
    const m = /(\d{4})/.exec(v || "");
    if (m) return m[1]!;
  }
  return "";
}

interface SlotInput {
  kind: DupeKind;
  idx: number | null;
  firstName?: string;
  lastName?: string;
  patronymic?: string;
  gender?: string;
  birthDate?: string;
  birthYearFrom?: string;
  /** id персон, связь с которыми повышает уверенность. */
  relatedIds?: string[];
  /** Ожидаемая роль связи у кандидата относительно исходной персоны. */
  expect?: "parentOf" | "childOf" | "spouseOf" | "siblingOf";
}

export function slotKey(kind: DupeKind, idx: number | null): string {
  return idx === null || idx === undefined ? kind : `${kind}:${idx}`;
}

/** Оценка кандидата: имя (обязательно) + даты + связи. */
function scoreCandidate(slot: SlotInput, base: Person, q: Person): DupeCandidate | null {
  const reasons: string[] = [];
  const sfn = normName(slot.firstName);
  const sln = normName(slot.lastName);
  const spn = normName(slot.patronymic);
  const qfn = normName(q.firstName);
  const qln = normName(q.lastName);
  const qpn = normName(q.patronymic);
  if (!sfn && !sln) return null;

  let score = 0;
  if (sfn && sln) {
    if (sfn !== qfn || sln !== qln) return null;
    score += 40;
    reasons.push("имя и фамилия совпадают");
  } else if (sfn) {
    if (sfn !== qfn) return null;
    score += 18;
    reasons.push("совпадает имя");
  } else {
    if (!qln || sln !== qln) return null;
    score += 14;
    reasons.push("совпадает фамилия");
  }
  if (spn && qpn) {
    if (spn === qpn) {
      score += 20;
      reasons.push("совпадает отчество");
    } else {
      score -= 25;
      reasons.push("отчество не совпадает");
    }
  }

  // Даты
  const sy = yearOf(slot.birthDate, slot.birthYearFrom);
  const qy = yearOf(q.birthDate, q.birthYearFrom);
  if (sy && qy) {
    if (sy === qy) {
      score += 25;
      reasons.push("совпадает год рождения");
    } else if (Math.abs(+sy - +qy) <= 2) {
      score += 8;
      reasons.push("близкие годы рождения");
    } else {
      score -= 30;
      reasons.push("годы рождения расходятся");
    }
  }

  // Пол
  if (slot.gender && q.gender && slot.gender !== q.gender) {
    score -= 30;
    reasons.push("пол не совпадает");
  }

  // Связи
  const rel = new Set(slot.relatedIds?.filter(Boolean) ?? []);
  const qLinks = new Set(
    [
      q.fatherLinkedId,
      q.motherLinkedId,
      ...(q.children || []).map((c) => c.linkedId),
      ...(q.marriages || []).map((m) => m.spouseLinkedId),
      ...(q.siblings || []).map((s) => s.linkedId || ""),
    ].filter(Boolean) as string[],
  );
  let relHit = false;
  for (const id of rel) if (qLinks.has(id)) relHit = true;

  if (slot.expect === "parentOf" && (q.children || []).some((c) => c.linkedId === base.id))
    relHit = true;
  if (
    slot.expect === "childOf" &&
    (q.fatherLinkedId === base.id || q.motherLinkedId === base.id)
  )
    relHit = true;
  if (slot.expect === "spouseOf" && (q.marriages || []).some((m) => m.spouseLinkedId === base.id))
    relHit = true;
  if (
    slot.expect === "siblingOf" &&
    ((base.fatherLinkedId && q.fatherLinkedId === base.fatherLinkedId) ||
      (base.motherLinkedId && q.motherLinkedId === base.motherLinkedId))
  )
    relHit = true;

  if (relHit) {
    score += 30;
    reasons.push("совпадают родственные связи");
  }

  if (score <= 0) return null;
  return { person: q, score, reasons };
}

function slotsOf(p: Person): SlotInput[] {
  const slots: SlotInput[] = [];
  if (!p.fatherLinkedId && (p.fatherFirstName || p.fatherLastName))
    slots.push({
      kind: "father",
      idx: null,
      firstName: p.fatherFirstName,
      lastName: p.fatherLastName,
      patronymic: p.fatherPatronymic,
      gender: "М",
      expect: "parentOf",
      relatedIds: [p.motherLinkedId],
    });
  if (!p.motherLinkedId && (p.motherFirstName || p.motherLastName))
    slots.push({
      kind: "mother",
      idx: null,
      firstName: p.motherFirstName,
      lastName: p.motherLastName,
      patronymic: p.motherPatronymic,
      gender: "Ж",
      expect: "parentOf",
      relatedIds: [p.fatherLinkedId],
    });
  (p.siblings || []).forEach((s, i) => {
    if (s.linkedId) return;
    slots.push({
      kind: "sibling",
      idx: i,
      firstName: s.firstName || "",
      lastName: s.lastName || "",
      patronymic: s.patronymic || "",
      expect: "siblingOf",
      relatedIds: [p.fatherLinkedId, p.motherLinkedId],
    });
  });
  (p.children || []).forEach((c, i) => {
    if (c.linkedId) return;
    slots.push({
      kind: "child",
      idx: i,
      firstName: c.firstName,
      lastName: c.lastName,
      patronymic: c.patronymic,
      gender: c.gender,
      birthDate: c.birthDate,
      birthYearFrom: c.birthYearFrom,
      expect: "childOf",
      relatedIds: (p.marriages || []).map((m) => m.spouseLinkedId),
    });
  });
  (p.marriages || []).forEach((m, i) => {
    if (m.spouseLinkedId) return;
    slots.push({
      kind: "spouse",
      idx: i,
      firstName: m.spouseFirstName,
      lastName: m.spouseLastName,
      patronymic: m.spousePatronymic,
      gender: p.gender === "М" ? "Ж" : p.gender === "Ж" ? "М" : "",
      expect: "spouseOf",
      relatedIds: (p.children || []).map((c) => c.linkedId),
    });
  });
  return slots;
}

/** Порог уверенной автопривязки. */
const AUTO_SCORE = 65;

/** Ищет совпадения для всех непривязанных родственников персоны. */
export function findDuplicates(p: Person, all: Person[]): DupeSlot[] {
  const out: DupeSlot[] = [];
  for (const slot of slotsOf(p)) {
    const cands = all
      .filter((q) => q.id !== p.id)
      .map((q) => scoreCandidate(slot, p, q))
      .filter((c): c is DupeCandidate => !!c)
      .sort((a, b) => b.score - a.score);
    if (!cands.length) continue;
    const top = cands[0]!;
    const second = cands[1];
    const auto = top.score >= AUTO_SCORE && (!second || top.score - second.score >= 20);
    out.push({
      key: slotKey(slot.kind, slot.idx),
      kind: slot.kind,
      idx: slot.idx,
      firstName: slot.firstName || "",
      lastName: slot.lastName || "",
      patronymic: slot.patronymic || "",
      candidates: cands.slice(0, 6),
      auto,
    });
  }
  return out;
}

export function slotTitle(s: DupeSlot): string {
  const name = [s.firstName, s.patronymic, s.lastName].filter(Boolean).join(" ") || "(без имени)";
  return `${KIND_LABELS[s.kind]}: ${name}`;
}

/** Применяет решения (привязать / оставить как новую запись) к копии персоны. */
export function applyResolutions(
  person: Person,
  slots: DupeSlot[],
  resolutions: Map<string, DupeResolution>,
  all: Person[],
): Person {
  const p: Person = {
    ...person,
    siblings: (person.siblings || []).map((s) => ({ ...s })),
    children: (person.children || []).map((c) => ({ ...c })),
    marriages: (person.marriages || []).map((m) => ({ ...m })),
  };
  for (const slot of slots) {
    const res = resolutions.get(slot.key);
    if (!res || res.type === "new") continue;
    const linked = all.find((x) => x.id === res.id);
    if (!linked) continue;
    if (slot.kind === "father") {
      p.fatherLinkedId = linked.id;
      p.fatherFirstName = linked.firstName || p.fatherFirstName;
      p.fatherLastName = linked.lastName || p.fatherLastName;
      p.fatherPatronymic = linked.patronymic || p.fatherPatronymic;
    } else if (slot.kind === "mother") {
      p.motherLinkedId = linked.id;
      p.motherFirstName = linked.firstName || p.motherFirstName;
      p.motherLastName = linked.lastName || p.motherLastName;
      p.motherPatronymic = linked.patronymic || p.motherPatronymic;
    } else if (slot.kind === "sibling" && slot.idx != null && p.siblings[slot.idx]) {
      p.siblings[slot.idx]!.linkedId = linked.id;
    } else if (slot.kind === "child" && slot.idx != null && p.children[slot.idx]) {
      p.children[slot.idx]!.linkedId = linked.id;
    } else if (slot.kind === "spouse" && slot.idx != null && p.marriages[slot.idx]) {
      const m = p.marriages[slot.idx]!;
      m.spouseLinkedId = linked.id;
      m.spouseFirstName = linked.firstName || m.spouseFirstName;
      m.spouseLastName = linked.lastName || m.spouseLastName;
      m.spousePatronymic = linked.patronymic || m.spousePatronymic;
    }
  }
  return p;
}

/** Удаление дублей внутри списков персоны перед сохранением. */
export function dedupeEntries<T>(arr: T[], keyFn: (x: T) => string): T[] {
  const seen = new Set<string>();
  return (arr || []).filter((x) => {
    const k = keyFn(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function dedupePersonLists(p: Person): Person {
  const imgSig = (pages?: { imageId: string }[]) =>
    (pages || [])
      .map((pg) => pg.imageId)
      .filter(Boolean)
      .join(",");
  return {
    ...p,
    siblings: dedupeEntries(
      p.siblings || [],
      (s) => `${s.linkedId || ""}|${normName(s.firstName)}|${normName(s.lastName)}`,
    ),
    children: dedupeEntries(
      p.children || [],
      (c) =>
        `${c.linkedId || ""}|${normName(c.firstName)}|${normName(c.lastName)}|${imgSig(c.birthDocPages)}`,
    ),
    marriages: dedupeEntries(
      p.marriages || [],
      (m) =>
        `${m.spouseLinkedId || ""}|${normName(m.spouseFirstName)}|${normName(m.spouseLastName)}|${imgSig(m.marriageDocPages)}`,
    ),
    documents: dedupeEntries(
      p.documents || [],
      (d) => `${d.id || ""}|${d.docId || ""}|${normName(d.name)}|${imgSig(d.pages)}`,
    ),
    memories: dedupeEntries(
      p.memories || [],
      (m) => `${m.id || ""}|${normName(m.firstName)}|${normName(m.lastName)}|${m.date || ""}`,
    ),
  };
}

/** Обратная синхронизация: добавляет встречную связь супругу. */
export function candidateLabel(c: DupeCandidate): string {
  const p = c.person;
  return `${fullName(p) || "Без имени"}${p.personIndex ? ` (${p.personIndex})` : ""}`;
}
