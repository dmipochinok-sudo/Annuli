// Утилиты для работы со сканами: обход всех наборов страниц персоны,
// сбор идентификаторов изображений, миниатюры.
import type { Page, Person } from "./types";

export interface PageGroup {
  /** Стабильный ключ набора (используется для имён файлов в архиве). */
  key: string;
  label: string;
  /** Базовое имя документа для файлов архива. */
  docId: string;
  pages: Page[];
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
    },
    {
      key: "death",
      label: "Документ о смерти",
      docId: p.deathDocId || `${idx}.death`,
      pages: p.deathDocPages || [],
    },
    {
      key: "military",
      label: "Военная служба",
      docId: p.military?.docId || `${idx}.mil`,
      pages: p.military?.pages || [],
    },
  ];
  (p.marriages || []).forEach((m, i) => {
    groups.push({
      key: `marriage:${i}`,
      label: `Брак ${i + 1}`,
      docId: m.marriageDocId || `${idx}.marriage${i + 1}`,
      pages: m.marriageDocPages || [],
    });
  });
  (p.children || []).forEach((c, i) => {
    groups.push({
      key: `child:${i}`,
      label: `Ребёнок ${i + 1}`,
      docId: c.birthDocId || `${idx}.child${i + 1}`,
      pages: c.birthDocPages || [],
    });
  });
  (p.documents || []).forEach((d, i) => {
    groups.push({
      key: `doc:${i}`,
      label: d.name || `Документ ${i + 1}`,
      docId: d.docId || `${idx}.doc${i + 1}`,
      pages: d.pages || [],
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
