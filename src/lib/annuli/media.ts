// Утилиты для работы со сканами: обход всех наборов страниц персоны,
// сбор идентификаторов изображений, миниатюры.
import type { Page, Person } from "./types";

export interface DocMeta {
  /** Название документа. */
  name: string;
  archive: string;
  fund: string;
  opis: string;
  delo: string;
  list: string;
  /** Онлайн-ссылка на документ. */
  link: string;
  /** Расшифровка на уровне документа. */
  transcription: string;
  comment: string;
}

export interface PageGroup {
  /** Стабильный ключ набора (используется для имён файлов в архиве). */
  key: string;
  label: string;
  /** Базовое имя документа для файлов архива. */
  docId: string;
  pages: Page[];
  meta: DocMeta;
}

function meta(m: Partial<DocMeta>): DocMeta {
  return {
    name: "",
    archive: "",
    fund: "",
    opis: "",
    delo: "",
    list: "",
    link: "",
    transcription: "",
    comment: "",
    ...m,
  };
}

/** Все наборы страниц персоны в фиксированном порядке. */
export function pageGroups(p: Person): PageGroup[] {
  const idx = p.personIndex || p.id;
  const groups: PageGroup[] = [
    {
      key: "birth",
      label: "Документ о рождении",
      docId: p.birthDocId || `${idx}.birth`,
      pages: p.birthDocPages || [],
      meta: meta({
        name: p.birthDocName || "Документ о рождении",
        archive: p.birthDocArchive,
        fund: p.birthDocFund,
        opis: p.birthDocOpis,
        delo: p.birthDocDelo,
        list: p.birthDocList,
        link: p.birthDocPath,
      }),
    },
    {
      key: "death",
      label: "Документ о смерти",
      docId: p.deathDocId || `${idx}.death`,
      pages: p.deathDocPages || [],
      meta: meta({
        name: p.deathDocName || "Документ о смерти",
        archive: p.deathDocArchive,
        fund: p.deathDocFund,
        opis: p.deathDocOpis,
        delo: p.deathDocDelo,
        list: p.deathDocList,
        link: p.deathDocPath,
      }),
    },
    {
      key: "military",
      label: "Военная служба",
      docId: p.military?.docId || `${idx}.mil`,
      pages: p.military?.pages || [],
      meta: meta({
        name: "Документ о военной службе",
        archive: p.military?.archive ?? "",
        fund: p.military?.fund ?? "",
        opis: p.military?.opis ?? "",
        delo: p.military?.delo ?? "",
        list: p.military?.list ?? "",
      }),
    },
  ];
  (p.marriages || []).forEach((m, i) => {
    groups.push({
      key: `marriage:${i}`,
      label: `Брак ${i + 1}`,
      docId: m.marriageDocId || `${idx}.marriage${i + 1}`,
      pages: m.marriageDocPages || [],
      meta: meta({
        name: m.marriageDocName || `Документ о браке ${i + 1}`,
        archive: m.marriageDocArchive,
        fund: m.marriageDocFund,
        opis: m.marriageDocOpis,
        delo: m.marriageDocDelo,
        list: m.marriageDocList,
        link: m.marriageDocPath,
      }),
    });
  });
  (p.children || []).forEach((c, i) => {
    groups.push({
      key: `child:${i}`,
      label: `Ребёнок ${i + 1}`,
      docId: c.birthDocId || `${idx}.child${i + 1}`,
      pages: c.birthDocPages || [],
      meta: meta({
        name: c.birthDocName || `Документ о рождении ребёнка ${i + 1}`,
        archive: c.birthDocArchive,
        fund: c.birthDocFund,
        opis: c.birthDocOpis,
        delo: c.birthDocDelo,
        list: c.birthDocList,
      }),
    });
  });
  (p.documents || []).forEach((d, i) => {
    groups.push({
      key: `doc:${i}`,
      label: d.name || `Документ ${i + 1}`,
      docId: d.docId || `${idx}.doc${i + 1}`,
      pages: d.pages || [],
      meta: meta({
        name: d.name || `Документ ${i + 1}`,
        archive: d.archive,
        fund: d.fund,
        opis: d.opis,
        delo: d.delo,
        list: d.list,
        link: d.path,
        transcription: d.transcription,
        comment: d.comment,
      }),
    });
  });
  return groups;
}


/** Все imageId, на которые ссылается персона. */
export function collectImageIds(p: Person): Set<string> {
  const ids = new Set<string>();
  if (p.avatarImageId) ids.add(p.avatarImageId);
  for (const g of pageGroups(p)) {
    for (const pg of g.pages) if (pg?.imageId) ids.add(pg.imageId);
  }
  return ids;
}

export function extFromName(name?: string): string {
  const m = /\.[a-zA-Z0-9]{1,6}$/.exec(String(name || ""));
  return m ? m[0].toLowerCase() : "";
}

export function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/tiff": ".tif",
    "image/heic": ".heic",
    "image/heif": ".heic",
    "image/gif": ".gif",
  };
  return map[mime] || ".jpg";
}

export function mimeFromExt(path: string): string {
  const ext = (String(path || "").split(".").pop() || "").toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    tif: "image/tiff",
    tiff: "image/tiff",
    heic: "image/heic",
    gif: "image/gif",
  };
  return map[ext] || "application/octet-stream";
}

export function sanitizeFileBase(s: string): string {
  return (
    String(s || "")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "_")
      .replace(/\s+/g, " ") || "file"
  );
}

/** JPEG-миниатюра из блоба (data URL) для быстрого превью в списках. */
export function makeThumbnail(blob: Blob, maxW = 160, maxH = 160): Promise<string> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve("");
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxW) {
          h = (h * maxW) / w;
          w = maxW;
        }
      } else if (h > maxH) {
        w = (w * maxH) / h;
        h = maxH;
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
    img.src = url;
  });
}

/** Имя папки персоны в архиве: «N_5_3 Вениамин Романович Поберский». */
export function personFolderName(p: {
  personIndex?: string;
  id?: string;
  firstName?: string;
  patronymic?: string;
  lastName?: string;
}): string {
  const idx = (p.personIndex || "").trim().replace(/\./g, "_");
  const name = [p.firstName, p.patronymic, p.lastName]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join(" ");
  const base = [idx, name].filter(Boolean).join(" ");
  return sanitizeFileBase(base || p.id || "person");
}
