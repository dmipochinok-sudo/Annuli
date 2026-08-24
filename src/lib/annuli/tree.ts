// Построение и раскладка полного родословного дерева.
// Логика перенесена из legacy/Annuli_v2.10.html (buildFamilyGraph + renderTree).

import { compareGenerations, compareIndex, lifeDates } from "./format";
import type { Person } from "./types";

export interface TreeNode {
  person: Person;
  x: number;
  y: number;
  w: number;
  firstMid: string;
  surname: string;
  idxTxt: string;
  dtTxt: string;
}

export interface TreeEdge {
  from: string;
  to: string;
  type: "parent" | "marriage";
}

export interface TreeLayout {
  nodes: TreeNode[];
  edges: TreeEdge[];
  genLabels: { gen: string; y: number }[];
  width: number;
  height: number;
  nodeHeight: number;
  avaR: number;
  padL: number;
  gapAvaText: number;
  labelGutter: number;
}

const FONT = "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif";
const NH = 90;
const H_GAP = 26;
const V_GAP = 86;
const AVA_R = 21;
const PAD_L = 14;
const PAD_R = 16;
const GAP_AVA_TEXT = 12;
const MIN_W = 176;
const MAX_W = 280;
const LABEL_GUTTER = 140;

function normName(s: string | undefined): string {
  return (s || "").trim().toLowerCase();
}

interface Graph {
  nodes: Record<string, TreeNode>;
  edges: TreeEdge[];
  persons: Person[];
  spouseOf: Record<string, Set<string>>;
}

function buildFamilyGraph(all: Person[], showLateral: boolean): Graph {
  const persons = showLateral ? all : all.filter((p) => !p.isLateral);
  const nodes: Record<string, TreeNode> = {};
  for (const p of persons) {
    nodes[p.id] = {
      person: p,
      x: 0,
      y: 0,
      w: 0,
      firstMid: "",
      surname: "",
      idxTxt: "",
      dtTxt: "",
    };
  }
  const byName = (fnm?: string, lnm?: string): Person | null => {
    if (!fnm && !lnm) return null;
    return (
      persons.find(
        (q) => normName(q.firstName) === normName(fnm) && normName(q.lastName) === normName(lnm),
      ) || null
    );
  };

  const edges: TreeEdge[] = [];
  const parentKeys = new Set<string>();
  const addParentEdge = (parentId: string | null, childId: string | null) => {
    if (!parentId || !childId || parentId === childId) return;
    if (!nodes[parentId] || !nodes[childId]) return;
    const key = parentId + ">" + childId;
    if (parentKeys.has(key)) return;
    parentKeys.add(key);
    edges.push({ from: parentId, to: childId, type: "parent" });
  };

  for (const p of persons) {
    (p.children || []).forEach((c) => {
      let childId = c.linkedId && nodes[c.linkedId] ? c.linkedId : null;
      if (!childId) {
        const m = byName(c.firstName, c.lastName);
        if (m) childId = m.id;
      }
      if (childId) addParentEdge(p.id, childId);
    });
    let fatherId = p.fatherLinkedId && nodes[p.fatherLinkedId] ? p.fatherLinkedId : null;
    if (!fatherId) {
      const m = byName(p.fatherFirstName, p.fatherLastName);
      if (m) fatherId = m.id;
    }
    if (fatherId) addParentEdge(fatherId, p.id);
    let motherId = p.motherLinkedId && nodes[p.motherLinkedId] ? p.motherLinkedId : null;
    if (!motherId) {
      const m = byName(p.motherFirstName, p.motherLastName);
      if (m) motherId = m.id;
    }
    if (motherId) addParentEdge(motherId, p.id);
  }

  const spouseOf: Record<string, Set<string>> = {};
  const addSpouse = (a: string, b: string) => {
    if (!a || !b || a === b || !nodes[a] || !nodes[b]) return;
    (spouseOf[a] || (spouseOf[a] = new Set())).add(b);
    (spouseOf[b] || (spouseOf[b] = new Set())).add(a);
  };
  const marriageKeys = new Set<string>();
  for (const p of persons) {
    (p.marriages || []).forEach((m) => {
      let spId = m.spouseLinkedId && nodes[m.spouseLinkedId] ? m.spouseLinkedId : null;
      if (!spId) {
        const c = byName(m.spouseFirstName, m.spouseLastName);
        if (c) spId = c.id;
      }
      if (!spId) return;
      addSpouse(p.id, spId);
      const key = [p.id, spId].sort().join("|");
      if (!marriageKeys.has(key)) {
        marriageKeys.add(key);
        edges.push({ from: p.id, to: spId, type: "marriage" });
      }
    });
  }
  return { nodes, edges, persons, spouseOf };
}

function makeMeasurer(): (t: string, f: string) => number {
  if (typeof document === "undefined") {
    return (t, f) => {
      const size = parseFloat(f.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? "13");
      return t.length * size * 0.55;
    };
  }
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return (t) => t.length * 7;
  return (t, f) => {
    ctx.font = f;
    return ctx.measureText(t).width;
  };
}

/** Полная раскладка дерева по всем персонам базы. */
export function layoutTree(all: Person[], showLateral: boolean): TreeLayout {
  const { nodes, edges, persons, spouseOf } = buildFamilyGraph(all, showLateral);
  if (!persons.length) {
    return {
      nodes: [],
      edges: [],
      genLabels: [],
      width: 400,
      height: 200,
      nodeHeight: NH,
      avaR: AVA_R,
      padL: PAD_L,
      gapAvaText: GAP_AVA_TEXT,
      labelGutter: LABEL_GUTTER,
    };
  }

  const childrenOf: Record<string, string[]> = {};
  const parentsOf: Record<string, string[]> = {};
  edges
    .filter((e) => e.type === "parent")
    .forEach((e) => {
      (childrenOf[e.from] || (childrenOf[e.from] = [])).push(e.to);
      (parentsOf[e.to] || (parentsOf[e.to] = [])).push(e.from);
    });

  const byGen: Record<string, string[]> = {};
  for (const [id, node] of Object.entries(nodes)) {
    const gen = node.person.generation || "0";
    (byGen[gen] || (byGen[gen] = [])).push(id);
  }
  const genKeys = Object.keys(byGen).sort(compareGenerations);

  const measure = makeMeasurer();
  Object.values(nodes).forEach((node) => {
    const p = node.person;
    let firstMid = [p.firstName, p.patronymic].filter(Boolean).join(" ") || (p.lastName ? "" : "Без имени");
    let surname = (p.lastName || "").toUpperCase();
    const idxTxt = p.personIndex || "?";
    const dtTxt = lifeDates(p) || "—";
    const textLeft = PAD_L + AVA_R * 2 + GAP_AVA_TEXT;
    const avail = MAX_W - textLeft - PAD_R;
    const trunc = (s: string, f: string) => {
      if (measure(s, f) <= avail) return s;
      let r = s;
      while (r.length > 1 && measure(r + "…", f) > avail) r = r.slice(0, -1);
      return r + "…";
    };
    const f2 = `500 13px ${FONT}`;
    const f3 = `700 14px ${FONT}`;
    const w2 = measure(firstMid, f2);
    const w3 = measure(surname, f3);
    const w1 = measure(idxTxt, `10px ${FONT}`);
    const w4 = measure(dtTxt, `11px ${FONT}`);
    let w = textLeft + Math.max(w1, w2, w3, w4) + PAD_R;
    w = Math.max(MIN_W, Math.min(MAX_W, w));
    if (w2 > avail) firstMid = trunc(firstMid, f2);
    if (w3 > avail) surname = trunc(surname, f3);
    node.w = w;
    node.firstMid = firstMid;
    node.surname = surname;
    node.idxTxt = idxTxt;
    node.dtTxt = dtTxt;
  });

  // Супруги всегда должны стоять рядом в ряду.
  const enforceSpouseAdjacency = (seq: string[], idsSet: Set<string>) => {
    const arr = seq.slice();
    const processed = new Set<string>();
    for (let i = 0; i < arr.length; i++) {
      const id = arr[i]!;
      if (processed.has(id)) continue;
      processed.add(id);
      const sps = spouseOf[id] ? [...spouseOf[id]!].filter((sid) => idsSet.has(sid)) : [];
      for (const sid of sps) {
        if (processed.has(sid)) continue;
        const curIdx = arr.indexOf(id);
        const spIdx = arr.indexOf(sid);
        if (spIdx !== curIdx + 1) {
          arr.splice(spIdx, 1);
          arr.splice(arr.indexOf(id) + 1, 0, sid);
        }
        processed.add(sid);
      }
    }
    return arr;
  };

  const order: Record<string, string[]> = {};
  const xOrderOf: Record<string, number> = {};
  genKeys.forEach((gen, gi) => {
    const ids = byGen[gen]!.slice();
    const placed = new Set<string>();
    const seq: string[] = [];
    const push = (id: string) => {
      if (placed.has(id)) return;
      placed.add(id);
      seq.push(id);
      const sps = spouseOf[id] ? [...spouseOf[id]!].filter((sid) => ids.includes(sid)) : [];
      sps.forEach((sid) => push(sid));
    };
    if (gi === 0) {
      ids.sort((a, b) => compareIndex(nodes[a]!.person.personIndex, nodes[b]!.person.personIndex));
      ids.forEach(push);
    } else {
      const withParent: string[] = [];
      const orphans: string[] = [];
      ids.forEach((id) => {
        const ps = (parentsOf[id] || []).filter((pid) => xOrderOf[pid] !== undefined);
        (ps.length ? withParent : orphans).push(id);
      });
      withParent.sort((a, b) => {
        const pa = (parentsOf[a] || []).filter((pid) => xOrderOf[pid] !== undefined);
        const pb = (parentsOf[b] || []).filter((pid) => xOrderOf[pid] !== undefined);
        const ra = pa.reduce((s, pid) => s + xOrderOf[pid]!, 0) / pa.length;
        const rb = pb.reduce((s, pid) => s + xOrderOf[pid]!, 0) / pb.length;
        if (ra !== rb) return ra - rb;
        const da = nodes[a]!.person.birthDate || nodes[a]!.person.personIndex || "";
        const db = nodes[b]!.person.birthDate || nodes[b]!.person.personIndex || "";
        return compareIndex(da, db);
      });
      withParent.forEach(push);
      orphans.sort((a, b) => compareIndex(nodes[a]!.person.personIndex, nodes[b]!.person.personIndex));
      const front: string[] = [];
      const back: string[] = [];
      orphans.forEach((id, i) => {
        (i % 2 === 0 ? front : back).push(id);
      });
      front.reverse().forEach((id) => {
        if (!placed.has(id)) {
          placed.add(id);
          seq.unshift(id);
        }
      });
      back.forEach((id) => push(id));
    }
    order[gen] = enforceSpouseAdjacency(seq, new Set(ids));
    order[gen]!.forEach((id, i) => {
      xOrderOf[id] = i;
    });
  });

  genKeys.forEach((gen, gi) => {
    let cursorX = LABEL_GUTTER;
    order[gen]!.forEach((id) => {
      const n = nodes[id]!;
      n.x = cursorX;
      n.y = 20 + gi * (NH + V_GAP);
      cursorX += n.w + H_GAP;
    });
  });

  for (let gi = genKeys.length - 1; gi >= 0; gi--) {
    const ids = order[genKeys[gi]!]!;
    const ideal: Record<string, number> = {};
    ids.forEach((id) => {
      const kids = (childrenOf[id] || []).filter((cid) => nodes[cid]);
      ideal[id] = kids.length
        ? kids.reduce((s, cid) => s + nodes[cid]!.x + nodes[cid]!.w / 2, 0) / kids.length
        : nodes[id]!.x + nodes[id]!.w / 2;
    });
    let prevRight = -Infinity;
    ids.forEach((id) => {
      let left = ideal[id]! - nodes[id]!.w / 2;
      if (left < prevRight + H_GAP) left = prevRight + H_GAP;
      nodes[id]!.x = left;
      prevRight = left + nodes[id]!.w;
    });
  }

  // Центрируем каждый ряд по общей вертикальной оси.
  let globalMinX = Infinity;
  let globalMaxX = -Infinity;
  Object.values(nodes).forEach((n) => {
    globalMinX = Math.min(globalMinX, n.x);
    globalMaxX = Math.max(globalMaxX, n.x + n.w);
  });
  const globalCenter = (globalMinX + globalMaxX) / 2;
  genKeys.forEach((gen) => {
    const ids = order[gen]!;
    if (!ids.length) return;
    let rowMinX = Infinity;
    let rowMaxX = -Infinity;
    ids.forEach((id) => {
      rowMinX = Math.min(rowMinX, nodes[id]!.x);
      rowMaxX = Math.max(rowMaxX, nodes[id]!.x + nodes[id]!.w);
    });
    const delta = globalCenter - (rowMinX + rowMaxX) / 2;
    ids.forEach((id) => {
      nodes[id]!.x += delta;
    });
  });

  let minX = Infinity;
  Object.values(nodes).forEach((n) => {
    minX = Math.min(minX, n.x);
  });
  if (minX < LABEL_GUTTER) {
    const shift = LABEL_GUTTER - minX;
    Object.values(nodes).forEach((n) => {
      n.x += shift;
    });
  }

  let maxX = 20;
  let maxY = 20;
  Object.values(nodes).forEach((n) => {
    maxX = Math.max(maxX, n.x + n.w + 20);
    maxY = Math.max(maxY, n.y + NH + 20);
  });

  return {
    nodes: Object.values(nodes),
    edges,
    genLabels: genKeys.map((gen, gi) => ({ gen, y: 20 + gi * (NH + V_GAP) + NH / 2 + 4 })),
    width: maxX,
    height: maxY,
    nodeHeight: NH,
    avaR: AVA_R,
    padL: PAD_L,
    gapAvaText: GAP_AVA_TEXT,
    labelGutter: LABEL_GUTTER,
  };
}
