// Экспорт одной персоны: текстовое досье (.txt) и «архивный раздел» (.zip
// с переименованными сканами документов и текстовым описанием к каждому).
import JSZip from "jszip";

import { imgGet } from "./db";
import { fullName, lifeDates } from "./format";
import {
  extFromMime,
  extFromName,
  pageGroups,
  personFolderName,
  sanitizeFileBase,
  type DocMeta,
} from "./media";
import type { Person } from "./types";

const DASH = "—";
const v = (s?: string) => (s && String(s).trim() ? String(s).trim() : DASH);

/** Базовое имя файла документа: «D_5_3_1_стр1». */
function docFileBase(docId: string, pageIndex: number, total: number): string {
  const base = sanitizeFileBase(String(docId || "doc").replace(/\./g, "_"));
  return total > 1 ? `${base}_стр${pageIndex + 1}` : base;
}

/** Текстовая карточка одного скана документа. */
export function buildPageTxt(
  meta: DocMeta,
  fileName: string,
  page: { transcription?: string; comment?: string; name?: string },
  person: Person,
): string {
  const lines = [
    `Персона: ${v(fullName(person))}${person.personIndex ? ` (${person.personIndex})` : ""}`,
    `Название документа: ${v(meta.name || page.name)}`,
    `Файл изображения: ${fileName}`,
    "",
    "Расшифровка записи:",
    v(page.transcription || meta.transcription),
    "",
    `Архив: ${v(meta.archive)}`,
    `Фонд: ${v(meta.fund)}`,
    `Опись: ${v(meta.opis)}`,
    `Дело: ${v(meta.delo)}`,
    `Лист: ${v(meta.list)}`,
    `Онлайн-ссылка: ${v(meta.link)}`,
    `Комментарий: ${v(page.comment || meta.comment)}`,
  ];
  return lines.join("\r\n") + "\r\n";
}

/** Полное текстовое досье персоны для вёрстки книги. */
export function buildPersonTxt(person: Person): string {
  const out: string[] = [];
  const h = (t: string) => out.push("", t.toUpperCase(), "-".repeat(t.length));
  const f = (label: string, val?: string) => out.push(`${label}: ${v(val)}`);

  out.push(fullName(person) || "Без имени");
  out.push(`Индекс: ${v(person.personIndex)}`);
  out.push(`Годы жизни: ${v(lifeDates(person))}`);

  h("Основное");
  f("Пол", person.gender);
  f("Сословие", person.estate);
  f("Поколение", person.generation);
  f("Боковая ветвь", person.isLateral ? "да" : "нет");

  h("Рождение");
  f(
    "Дата рождения",
    person.birthDateApprox
      ? [person.birthYearFrom, person.birthYearTo].filter(Boolean).join(" – ")
      : person.birthDate,
  );
  f("Место рождения", person.birthPlace);

  h("Смерть");
  f(
    "Дата смерти",
    person.deathDateApprox
      ? [person.deathYearFrom, person.deathYearTo].filter(Boolean).join(" – ")
      : person.deathDate,
  );
  f("Место смерти", person.deathPlace);
  f("Обстоятельства смерти", person.deathCause);
  f("Место захоронения", person.burialPlace);

  h("Родители и крёстные");
  f(
    "Отец",
    [person.fatherFirstName, person.fatherPatronymic, person.fatherLastName]
      .filter(Boolean)
      .join(" "),
  );
  f(
    "Мать",
    [person.motherFirstName, person.motherPatronymic, person.motherLastName]
      .filter(Boolean)
      .join(" "),
  );
  f(
    "Крёстный отец",
    [person.godfatherFirstName, person.godfatherPatronymic, person.godfatherLastName]
      .filter(Boolean)
      .join(" "),
  );
  f(
    "Крёстная мать",
    [person.godmotherFirstName, person.godmotherPatronymic, person.godmotherLastName]
      .filter(Boolean)
      .join(" "),
  );

  if ((person.marriages || []).length) {
    h("Браки");
    person.marriages.forEach((m, i) => {
      out.push(
        `${i + 1}. ${v([m.spouseFirstName, m.spousePatronymic, m.spouseLastName].filter(Boolean).join(" "))}`,
      );
      f("   Дата брака", m.marriageDate);
      f("   Место брака", m.marriagePlace);
      if (m.marriageEnded) {
        f("   Брак завершён", m.marriageEndDate);
        f("   Причина", m.marriageEndReason);
      }
    });
  }

  if ((person.children || []).length) {
    h("Дети");
    person.children.forEach((c, i) => {
      out.push(
        `${i + 1}. ${v([c.firstName, c.patronymic, c.lastName].filter(Boolean).join(" "))}` +
          (c.birthDate ? `, р. ${c.birthDate}` : ""),
      );
    });
  }

  const mil = person.military;
  if (mil && Object.values(mil).some((x) => typeof x === "string" && x.trim())) {
    h("Военная служба");
    f("Часть или подразделение", mil.unit);
    f("Звание", mil.rank);
    f("Должность", mil.position);
    f("Начало службы", mil.serviceFrom);
    f("Окончание службы", mil.serviceTo);
    f("Конфликты", mil.conflict);
    f("Ранения", mil.wounds);
    f("Награды", mil.awards);
    f("Обстоятельства окончания службы", mil.death);
  }

  if ((person.memories || []).length) {
    h("Воспоминания");
    person.memories.forEach((m, i) => {
      out.push(
        `${i + 1}. ${v([m.firstName, m.patronymic, m.lastName].filter(Boolean).join(" "))}` +
          (m.date ? ` · ${m.date}` : ""),
      );
      out.push(v(m.text));
      out.push("");
    });
  }

  h("Документы");
  const groups = pageGroups(person).filter((g) => g.pages.some((pg) => pg.imageId));
  if (!groups.length) out.push(DASH);
  groups.forEach((g, i) => {
    out.push(`${i + 1}. ${v(g.meta.name || g.label)} [${v(g.docId)}]`);
    f("   Архив", g.meta.archive);
    f("   Фонд", g.meta.fund);
    f("   Опись", g.meta.opis);
    f("   Дело", g.meta.delo);
    f("   Лист", g.meta.list);
    f("   Онлайн-ссылка", g.meta.link);
    f("   Страниц", String(g.pages.filter((pg) => pg.imageId).length));
  });

  return out.join("\r\n") + "\r\n";
}

/** Имя файла архивного раздела персоны. */
export function personArchiveName(person: Person): string {
  return `Архив ${personFolderName(person)}.zip`;
}

/**
 * «Архивный раздел» персоны: только документы (рождение, смерть, служба,
 * браки, дети, произвольные документы) — скан + одноимённый .txt с описанием.
 */
export async function buildPersonDocsArchive(
  person: Person,
  onProgress?: (msg: string) => void,
): Promise<{ blob: Blob; files: number }> {
  const zip = new JSZip();
  const used = new Set<string>();
  let files = 0;

  const groups = pageGroups(person);
  for (const g of groups) {
    const pages = g.pages.filter((pg) => pg.imageId);
    for (let i = 0; i < pages.length; i++) {
      const pg = pages[i]!;
      let blob: Blob | null = null;
      try {
        blob = await imgGet(pg.imageId);
      } catch {
        blob = null;
      }
      if (!blob) continue;
      const ext = extFromName(pg.imageName) || extFromMime(blob.type);
      let base = docFileBase(g.docId, i, pages.length);
      let n = 1;
      while (used.has(base.toLowerCase())) base = `${docFileBase(g.docId, i, pages.length)}_${++n}`;
      used.add(base.toLowerCase());
      zip.file(base + ext, blob, { compression: "STORE" });
      zip.file(base + ".txt", buildPageTxt(g.meta, base + ext, pg, person));
      files++;
      onProgress?.(`Подготовка архивного раздела… ${files}`);
    }
  }

  zip.file(`${personFolderName(person)}.txt`, buildPersonTxt(person));
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return { blob, files };
}
