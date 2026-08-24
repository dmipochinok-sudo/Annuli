// Импорт и экспорт GEDCOM 5.5.1.
import { mkChild, mkMarriage, mkPerson, uid, type Person } from "./types";

interface GedNode {
  level: number;
  tag: string;
  value: string;
  children: GedNode[];
}

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export function gedDate(str: string): {
  approx: boolean;
  date: string;
  yf: string;
  yt: string;
} {
  const s = (str || "").trim().toUpperCase();
  const mo: Record<string, string> = {};
  MONTHS.forEach((m, i) => (mo[m] = String(i + 1).padStart(2, "0")));
  if (!s) return { approx: false, date: "", yf: "", yt: "" };
  if (/^(ABT|EST|CAL)\b/.test(s)) {
    const yr = /(\d{4})/.exec(s);
    return { approx: true, date: "", yf: yr ? yr[1]! : "", yt: yr ? yr[1]! : "" };
  }
  const full = /^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/.exec(s);
  if (full)
    return {
      approx: false,
      date: `${full[1]!.padStart(2, "0")}.${mo[full[2]!] || "??"}.${full[3]}`,
      yf: "",
      yt: "",
    };
  const my = /^([A-Z]{3})\s+(\d{4})$/.exec(s);
  if (my) return { approx: false, date: `${mo[my[1]!] || "??"}.${my[2]}`, yf: "", yt: "" };
  const y = /^(\d{4})$/.exec(s);
  if (y) return { approx: false, date: y[1]!, yf: "", yt: "" };
  return { approx: false, date: str, yf: "", yt: "" };
}

/** Дата вида ДД.ММ.ГГГГ / ММ.ГГГГ / ГГГГ -> GEDCOM. */
function toGedDate(date: string, approx: boolean, yearFrom: string): string {
  if (approx) return yearFrom ? `ABT ${yearFrom}` : "";
  const d = (date || "").trim();
  let m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d);
  if (m) return `${m[1]} ${MONTHS[+m[2]! - 1] ?? "JAN"} ${m[3]}`;
  m = /^(\d{2})\.(\d{4})$/.exec(d);
  if (m) return `${MONTHS[+m[1]! - 1] ?? "JAN"} ${m[2]}`;
  m = /^(\d{4})$/.exec(d);
  if (m) return m[1]!;
  return d;
}

function parseNodes(text: string): GedNode[] {
  const roots: GedNode[] = [];
  const stack: GedNode[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^\uFEFF/, "").trimEnd();
    if (!line.trim()) continue;
    const m = /^(\d+)\s+(\S+)(?:\s+(.*))?$/.exec(line);
    if (!m) continue;
    const node: GedNode = {
      level: +m[1]!,
      tag: m[2]!,
      value: (m[3] || "").trim(),
      children: [],
    };
    while (stack.length && stack[stack.length - 1]!.level >= node.level) stack.pop();
    if (stack.length) stack[stack.length - 1]!.children.push(node);
    else roots.push(node);
    stack.push(node);
  }
  return roots;
}

function parseIndi(node: GedNode): Person {
  const p = mkPerson();
  p.id = uid();
  for (const ch of node.children) {
    if (ch.tag === "NAME") {
      let surn = "";
      let givn = "";
      for (const s of ch.children) {
        if (s.tag === "SURN") surn = s.value.trim();
        if (s.tag === "GIVN") givn = s.value.trim();
      }
      if (surn || givn) {
        p.lastName = surn;
        const pts = givn.split(/\s+/).filter(Boolean);
        p.firstName = pts[0] || "";
        if (pts.length > 1) p.patronymic = pts.slice(1).join(" ");
      } else {
        const ms = /^(.*?)\/(.+?)\/(.*)?$/.exec(ch.value);
        if (ms) {
          p.lastName = ms[2]!.trim();
          const r = `${ms[1]} ${ms[3] || ""}`.trim().split(/\s+/).filter(Boolean);
          p.firstName = r[0] || "";
          if (r.length > 1) p.patronymic = r.slice(1).join(" ");
        } else {
          const pts = ch.value.split(/\s+/).filter(Boolean);
          p.firstName = pts[0] || "";
          if (pts.length > 1) p.lastName = pts[pts.length - 1]!;
        }
      }
    } else if (ch.tag === "SEX") {
      p.gender = ch.value === "M" ? "М" : ch.value === "F" ? "Ж" : "";
    } else if (ch.tag === "BIRT" || ch.tag === "DEAT") {
      const isB = ch.tag === "BIRT";
      for (const s of ch.children) {
        if (s.tag === "DATE") {
          const d = gedDate(s.value);
          if (isB) {
            p.birthDateApprox = d.approx;
            p.birthDate = d.date;
            p.birthYearFrom = d.yf;
            p.birthYearTo = d.yt;
          } else {
            p.deathDateApprox = d.approx;
            p.deathDate = d.date;
            p.deathYearFrom = d.yf;
            p.deathYearTo = d.yt;
          }
        }
        if (s.tag === "PLAC") {
          if (isB) p.birthPlace = s.value;
          else p.deathPlace = s.value;
        }
        if (s.tag === "CAUS" && !isB) p.deathCause = s.value;
      }
    } else if (ch.tag === "BURI") {
      for (const s of ch.children) if (s.tag === "PLAC") p.burialPlace = s.value;
    } else if (ch.tag === "RESI") {
      for (const s of ch.children)
        if ((s.tag === "PLAC" || s.tag === "ADDR") && s.value)
          p.residences.push({ id: uid(), place: s.value });
    } else if ((ch.tag === "OCCU" || ch.tag === "TITL") && !p.estate && ch.value) {
      p.estate = ch.value;
    } else if (ch.tag === "REFN" && ch.value && !p.personIndex) {
      p.personIndex = ch.value;
    } else if (ch.tag === "NOTE" && ch.value) {
      p.memories.push({
        id: uid(),
        lastName: "",
        firstName: "",
        patronymic: "",
        date: "",
        text: ch.value,
      });
    }
  }
  return p;
}

interface GedFam {
  husbX: string;
  wifeX: string;
  childX: string[];
  mDate: string;
  mPlace: string;
}

function parseFam(node: GedNode): GedFam {
  const f: GedFam = { husbX: "", wifeX: "", childX: [], mDate: "", mPlace: "" };
  for (const ch of node.children) {
    if (ch.tag === "HUSB") f.husbX = ch.value;
    else if (ch.tag === "WIFE") f.wifeX = ch.value;
    else if (ch.tag === "CHIL") f.childX.push(ch.value);
    else if (ch.tag === "MARR") {
      for (const s of ch.children) {
        if (s.tag === "DATE") f.mDate = gedDate(s.value).date;
        if (s.tag === "PLAC") f.mPlace = s.value;
      }
    }
  }
  return f;
}

export function parseGEDCOM(text: string): { persons: Person[]; famCount: number } {
  const nodes = parseNodes(text);
  const indiMap: Record<string, Person> = {};
  const famMap: Record<string, GedFam> = {};
  for (const n of nodes) {
    if (n.value === "INDI") indiMap[n.tag] = parseIndi(n);
    else if (n.value === "FAM") famMap[n.tag] = parseFam(n);
  }
  for (const fam of Object.values(famMap)) {
    const husb = fam.husbX ? indiMap[fam.husbX] : undefined;
    const wife = fam.wifeX ? indiMap[fam.wifeX] : undefined;
    const children = fam.childX.map((x) => indiMap[x]).filter(Boolean) as Person[];
    const addMarriage = (a: Person, b?: Person) => {
      const m = mkMarriage();
      m.marriageDate = fam.mDate;
      m.marriagePlace = fam.mPlace;
      if (b) {
        m.spouseFirstName = b.firstName;
        m.spouseLastName = b.lastName;
        m.spousePatronymic = b.patronymic;
        m.spouseLinkedId = b.id;
      }
      a.marriages.push(m);
    };
    if (husb) addMarriage(husb, wife);
    if (wife) addMarriage(wife, husb);
    for (const ch of children) {
      if (husb) {
        ch.fatherLastName = husb.lastName;
        ch.fatherFirstName = husb.firstName;
        ch.fatherPatronymic = husb.patronymic;
        ch.fatherLinkedId = husb.id;
      }
      if (wife) {
        ch.motherLastName = wife.lastName;
        ch.motherFirstName = wife.firstName;
        ch.motherPatronymic = wife.patronymic;
        ch.motherLinkedId = wife.id;
      }
    }
    for (const par of [husb, wife].filter(Boolean) as Person[]) {
      for (const ch of children) {
        if (par.children.some((c) => c.linkedId === ch.id)) continue;
        const cc = mkChild();
        cc.linkedId = ch.id;
        cc.firstName = ch.firstName;
        cc.lastName = ch.lastName;
        cc.patronymic = ch.patronymic;
        cc.gender = ch.gender;
        cc.birthDate = ch.birthDate;
        par.children.push(cc);
      }
    }
  }
  return { persons: Object.values(indiMap), famCount: Object.keys(famMap).length };
}

/** Сборка GEDCOM-файла из персон базы. */
export function buildGEDCOM(persons: Person[]): string {
  const L: string[] = [];
  const xref = new Map<string, string>();
  persons.forEach((p, i) => xref.set(p.id, `@I${i + 1}@`));

  L.push("0 HEAD");
  L.push("1 SOUR Annuli");
  L.push("2 NAME Annuli genealogy");
  L.push("1 GEDC");
  L.push("2 VERS 5.5.1");
  L.push("2 FORM LINEAGE-LINKED");
  L.push("1 CHAR UTF-8");
  L.push(`1 DATE ${new Date().toISOString().slice(0, 10)}`);

  // Семьи: (отец,мать) -> дети; браки.
  interface Fam {
    husb: string;
    wife: string;
    children: Set<string>;
    date: string;
    place: string;
  }
  const fams = new Map<string, Fam>();
  const famOf = (husb: string, wife: string): Fam => {
    const key = `${husb}|${wife}`;
    let f = fams.get(key);
    if (!f) {
      f = { husb, wife, children: new Set(), date: "", place: "" };
      fams.set(key, f);
    }
    return f;
  };
  for (const p of persons) {
    if (p.fatherLinkedId || p.motherLinkedId) {
      const f = famOf(p.fatherLinkedId || "", p.motherLinkedId || "");
      f.children.add(p.id);
    }
    for (const m of p.marriages || []) {
      if (!m.spouseLinkedId) continue;
      const husb = p.gender === "Ж" ? m.spouseLinkedId : p.id;
      const wife = p.gender === "Ж" ? p.id : m.spouseLinkedId;
      const f = famOf(husb, wife);
      if (m.marriageDate && !f.date) f.date = m.marriageDate;
      if (m.marriagePlace && !f.place) f.place = m.marriagePlace;
    }
  }
  const famList = [...fams.values()].filter((f) => f.husb || f.wife);
  const famXref = new Map<Fam, string>();
  famList.forEach((f, i) => famXref.set(f, `@F${i + 1}@`));

  const famsAsSpouse = new Map<string, string[]>();
  const famsAsChild = new Map<string, string[]>();
  for (const f of famList) {
    const x = famXref.get(f)!;
    for (const id of [f.husb, f.wife].filter(Boolean))
      famsAsSpouse.set(id, [...(famsAsSpouse.get(id) || []), x]);
    for (const id of f.children) famsAsChild.set(id, [...(famsAsChild.get(id) || []), x]);
  }

  for (const p of persons) {
    L.push(`0 ${xref.get(p.id)} INDI`);
    const given = [p.firstName, p.patronymic].filter(Boolean).join(" ");
    L.push(`1 NAME ${given} /${p.lastName || ""}/`);
    if (given) L.push(`2 GIVN ${given}`);
    if (p.lastName) L.push(`2 SURN ${p.lastName}`);
    if (p.gender === "М") L.push("1 SEX M");
    else if (p.gender === "Ж") L.push("1 SEX F");
    const bd = toGedDate(p.birthDate, p.birthDateApprox, p.birthYearFrom);
    if (bd || p.birthPlace) {
      L.push("1 BIRT");
      if (bd) L.push(`2 DATE ${bd}`);
      if (p.birthPlace) L.push(`2 PLAC ${p.birthPlace}`);
    }
    const dd = toGedDate(p.deathDate, p.deathDateApprox, p.deathYearFrom);
    if (dd || p.deathPlace || p.deathCause) {
      L.push("1 DEAT");
      if (dd) L.push(`2 DATE ${dd}`);
      if (p.deathPlace) L.push(`2 PLAC ${p.deathPlace}`);
      if (p.deathCause) L.push(`2 CAUS ${p.deathCause}`);
    }
    if (p.burialPlace) {
      L.push("1 BURI");
      L.push(`2 PLAC ${p.burialPlace}`);
    }
    if (p.estate) L.push(`1 OCCU ${p.estate}`);
    if (p.personIndex) L.push(`1 REFN ${p.personIndex}`);
    for (const r of p.residences || []) {
      const place = typeof r === "string" ? r : String((r as { place?: string }).place || "");
      if (place) {
        L.push("1 RESI");
        L.push(`2 PLAC ${place}`);
      }
    }
    for (const x of famsAsChild.get(p.id) || []) L.push(`1 FAMC ${x}`);
    for (const x of famsAsSpouse.get(p.id) || []) L.push(`1 FAMS ${x}`);
    for (const m of p.memories || []) {
      if (!m.text) continue;
      const lines = m.text.split(/\r?\n/);
      L.push(`1 NOTE ${lines[0]}`);
      for (const extra of lines.slice(1)) L.push(`2 CONT ${extra}`);
    }
  }

  for (const f of famList) {
    L.push(`0 ${famXref.get(f)} FAM`);
    if (f.husb && xref.has(f.husb)) L.push(`1 HUSB ${xref.get(f.husb)}`);
    if (f.wife && xref.has(f.wife)) L.push(`1 WIFE ${xref.get(f.wife)}`);
    if (f.date || f.place) {
      L.push("1 MARR");
      if (f.date) L.push(`2 DATE ${toGedDate(f.date, false, "")}`);
      if (f.place) L.push(`2 PLAC ${f.place}`);
    }
    for (const c of f.children) if (xref.has(c)) L.push(`1 CHIL ${xref.get(c)}`);
  }

  L.push("0 TRLR");
  return L.join("\n");
}
