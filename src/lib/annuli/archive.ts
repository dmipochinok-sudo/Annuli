// Экспорт и импорт базы: ZIP с data.json, оригиналами сканов и GEDCOM-файлом.
import JSZip from "jszip";

import { dbDelPerson, dbPutPerson, imgDel, imgGet, imgPut } from "./db";
import { buildGEDCOM, parseGEDCOM } from "./gedcom";
import {
  collectImageIds,
  extFromMime,
  extFromName,
  mimeFromExt,
  pageGroups,
  personFolderName,
  sanitizeFileBase,
} from "./media";
import { normalizePerson, type Page, type Person } from "./types";

export interface ImportPayload {
  persons: Person[];
  zip: JSZip | null;
  exportDate: string;
  hasMedia: boolean;
  source: "zip" | "json" | "gedcom";
  famCount?: number;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Идентификаторы аватаров родственников и авторов воспоминаний. */
function relativeAvatarIds(p: Person): string[] {
  const ids = [
    p.fatherAvatarImageId,
    p.motherAvatarImageId,
    p.godfatherAvatarImageId,
    p.godmotherAvatarImageId,
    ...(p.siblings || []).map((s) => s.avatarImageId),
    ...(p.children || []).map((c) => c.avatarImageId),
    ...(p.marriages || []).map((m) => m.spouseAvatarImageId),
    ...(p.memories || []).map((m) => m.avatarImageId),
  ].filter((x): x is string => !!x);
  return [...new Set(ids)];
}

/** Собирает ZIP-архив со всеми персонами, сканами и GEDCOM. */
export async function buildArchive(
  persons: Person[],
  onProgress?: (msg: string) => void,
): Promise<Blob> {
  const zip = new JSZip();
  const usedFolders = new Set<string>();
  const uniqueFolder = (base: string) => {
    let name = base;
    let n = 1;
    while (usedFolders.has(name.toLowerCase())) name = `${base}_${++n}`;
    usedFolders.add(name.toLowerCase());
    return name;
  };
  const embed = async (
    folder: string,
    used: Set<string>,
    imageId: string,
    imageName: string | undefined,
    baseId: string,
  ) => {
    if (!imageId) return null;
    let blob: Blob | null = null;
    try {
      blob = await imgGet(imageId);
    } catch {
      blob = null;
    }
    if (!blob) return null;
    const ext = extFromName(imageName) || extFromMime(blob.type);
    let name = sanitizeFileBase(baseId) + ext;
    let n = 1;
    while (used.has(name.toLowerCase())) name = `${sanitizeFileBase(baseId)}_${++n}${ext}`;
    used.add(name.toLowerCase());
    const path = `images/${folder}/${name}`;
    zip.file(path, blob, { compression: "STORE" });
    return path;
  };

  const exportPersons = clone(persons);
  let done = 0;
  for (const ep of exportPersons) {
    const pIdx = sanitizeFileBase(ep.personIndex || ep.id);
    const folder = uniqueFolder(personFolderName(ep));
    const used = new Set<string>();
    if (ep.avatarImageId) {
      const f = await embed(folder, used, ep.avatarImageId, ep.avatarImageName, `${pIdx}.avatar`);
      if (f) (ep as Person & { _avatarFile?: string })._avatarFile = f;
    }
    // Аватары родственников и авторов воспоминаний (не отдельные персоны базы).
    const extra: Record<string, string> = {};
    let ai = 0;
    for (const imgId of relativeAvatarIds(ep)) {
      const f = await embed(folder, used, imgId, "", `${pIdx}.rel${++ai}`);
      if (f) extra[imgId] = f;
    }
    if (Object.keys(extra).length)
      (ep as Person & { _avatarFiles?: Record<string, string> })._avatarFiles = extra;
    for (const g of pageGroups(ep)) {
      const pages = g.pages as Page[];
      for (let i = 0; i < pages.length; i++) {
        const pg = pages[i];
        if (!pg?.imageId) continue;
        const suffix = pages.length > 1 ? `_${i + 1}` : "";
        const f = await embed(
          folder,
          used,
          pg.imageId,
          pg.imageName,
          sanitizeFileBase(g.docId) + suffix,
        );
        if (f) pg._file = f;
      }
    }
    // Фотоальбомы.
    for (let k = 0; k < (ep.albums || []).length; k++) {
      const al = ep.albums[k]!;
      const photos = al.photos || [];
      for (let i = 0; i < photos.length; i++) {
        const ph = photos[i]!;
        if (!ph.imageId) continue;
        const base = sanitizeFileBase(ph.photoId || al.albumId || `${pIdx}.album${k + 1}`);
        const f = await embed(folder, used, ph.imageId, ph.imageName, `${base}_${i + 1}`);
        if (f) ph._file = f;
      }
    }
    done++;
    if (done % 5 === 0) onProgress?.(`Подготовка архива… ${done}/${exportPersons.length}`);
  }


  zip.file(
    "data.json",
    JSON.stringify({
      app: "Annuli",
      version: "3.0",
      exportDate: new Date().toISOString(),
      count: exportPersons.length,
      persons: exportPersons,
    }),
  );
  zip.file("annuli.ged", buildGEDCOM(persons));
  onProgress?.("Сжатие архива…");
  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Читает выбранный файл: ZIP-архив Annuli, data.json или .ged. */
export async function readImportFile(file: File): Promise<ImportPayload> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".ged")) {
    const text = await file.text();
    const res = parseGEDCOM(text);
    return {
      persons: res.persons.map(normalizePerson),
      zip: null,
      exportDate: "",
      hasMedia: false,
      source: "gedcom",
      famCount: res.famCount,
    };
  }
  if (name.endsWith(".zip") || file.type === "application/zip") {
    const zip = await JSZip.loadAsync(file);
    const entry = zip.file("data.json");
    if (entry) {
      const data = JSON.parse(await entry.async("string")) as {
        persons?: Partial<Person>[];
        exportDate?: string;
      };
      if (!Array.isArray(data.persons)) throw new Error("В архиве нет списка персон");
      return {
        persons: data.persons.map(normalizePerson),
        zip,
        exportDate: data.exportDate || "",
        hasMedia: true,
        source: "zip",
      };
    }
    // ZIP без data.json — пробуем GEDCOM внутри архива
    const ged = zip.file(/\.ged$/i)[0];
    if (!ged) throw new Error("В архиве не найдены data.json или .ged — это не экспорт Annuli");
    const res = parseGEDCOM(await ged.async("string"));
    return {
      persons: res.persons.map(normalizePerson),
      zip,
      exportDate: "",
      hasMedia: false,
      source: "gedcom",
      famCount: res.famCount,
    };
  }
  const data = JSON.parse(await file.text()) as { persons?: Partial<Person>[]; exportDate?: string };
  if (!Array.isArray(data.persons)) throw new Error("Неверный формат файла");
  return {
    persons: data.persons.map(normalizePerson),
    zip: null,
    exportDate: data.exportDate || "",
    hasMedia: data.persons.some((p) => (p as { _imgs?: unknown })._imgs),
    source: "json",
  };
}

function dataURLtoBlob(dataURL: string): Blob | null {
  try {
    const arr = dataURL.split(",");
    const mime = /:(.*?);/.exec(arr[0]!)![1]!;
    const b = atob(arr[1]!);
    const u = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return new Blob([u], { type: mime });
  } catch {
    return null;
  }
}

async function restoreImage(zip: JSZip, imageId: string, filePath: string) {
  const entry = zip.file(filePath);
  if (!entry) return false;
  const buf = await entry.async("arraybuffer");
  await imgPut(imageId, new Blob([buf], { type: mimeFromExt(filePath) }));
  return true;
}

async function restorePersonMedia(p: Person, zip: JSZip | null) {
  if (!zip) return;
  const withFile = p as Person & {
    _avatarFile?: string;
    _avatarFiles?: Record<string, string>;
  };
  if (p.avatarImageId && withFile._avatarFile)
    await restoreImage(zip, p.avatarImageId, withFile._avatarFile);
  for (const [imgId, path] of Object.entries(withFile._avatarFiles || {})) {
    await restoreImage(zip, imgId, path);
  }
  for (const g of pageGroups(p)) {
    for (const pg of g.pages) {
      if (pg?.imageId && pg._file) await restoreImage(zip, pg.imageId, pg._file);
    }
  }
  for (const al of p.albums || []) {
    for (const ph of al.photos || []) {
      if (ph.imageId && ph._file) await restoreImage(zip, ph.imageId, ph._file);
    }
  }
}

function stripHelpers(p: Person): Person {
  const withFile = p as Person & {
    _avatarFile?: string;
    _avatarFiles?: Record<string, string>;
    _imgs?: unknown;
  };
  delete withFile._avatarFile;
  delete withFile._avatarFiles;
  delete withFile._imgs;
  for (const g of pageGroups(p)) for (const pg of g.pages) delete pg._file;
  for (const al of p.albums || []) for (const ph of al.photos || []) delete ph._file;
  return p;
}

/** Записывает импортируемые персоны и их сканы в IndexedDB без потерь. */
export async function applyImport(
  payload: ImportPayload,
  selected: Person[],
  mode: "add" | "replace",
  existing: Person[],
  onProgress?: (msg: string) => void,
): Promise<{ added: number; updated: number; images: number }> {
  let added = 0;
  let updated = 0;
  let images = 0;
  const existingIds = new Set(existing.map((p) => p.id));

  if (mode === "replace") {
    for (const p of existing) {
      for (const id of collectImageIds(p)) await imgDel(id).catch(() => {});
      await dbDelPerson(p.id);
    }
    existingIds.clear();
  }

  let done = 0;
  for (const raw of selected) {
    const p = normalizePerson(clone(raw));
    // Устаревший формат: изображения в data-URL внутри записи персоны.
    const legacyImgs = (p as Person & { _imgs?: Record<string, string> })._imgs;
    if (legacyImgs) {
      for (const [imgId, dataURL] of Object.entries(legacyImgs)) {
        const blob = dataURLtoBlob(dataURL);
        if (blob) {
          await imgPut(imgId, blob);
          images++;
        }
      }
    }
    await restorePersonMedia(p, payload.zip);
    images += collectImageIds(p).size;
    stripHelpers(p);
    await dbPutPerson(p);
    if (existingIds.has(p.id)) updated++;
    else {
      added++;
      existingIds.add(p.id);
    }
    done++;
    if (done % 5 === 0) onProgress?.(`Импорт… ${done}/${selected.length}`);
  }
  return { added, updated, images };
}
