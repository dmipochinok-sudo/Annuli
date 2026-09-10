import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";

/** Пара локализованных строк. */
export interface Pair {
  ru: string;
  en: string;
}

/** Значение одного текстового поля сайта (RU/EN). */
export interface ContentRow {
  key: string;
  ru: string;
  en: string;
}

/** Исходные значения текста главной страницы. Редактируются через CMS. */
export const DEFAULTS: Record<string, Pair> = {
  // ── Шапка ──────────────────────────────────────────────────────────────
  "header.brand_sub": {
    ru: "Издательство семейных историй",
    en: "Family History Publishers",
  },
  "header.masthead_left": { ru: "Фамильные книги · с 2024", en: "Family Books · Est. 2024" },
  "header.masthead_right": { ru: "Полностью под ключ", en: "Fully managed" },
  "header.cta": { ru: "Начать проект", en: "Start a Project" },

  // ── Hero ───────────────────────────────────────────────────────────────
  "hero.caption": {
    ru: "Семейный портрет. Студийная фотография, 1927 г.",
    en: "Family portrait. Studio photograph, 1927.",
  },
  "hero.alt": { ru: "Семейный портрет, 1927 год", en: "Family portrait, 1927" },
  "hero.kicker": { ru: "Семейная летопись", en: "Family Chronicle" },
  "hero.headline1": { ru: "История рода,", en: "A family story" },
  "hero.headline2": { ru: "достойная вечности", en: "worthy of eternity" },
  "hero.deck": {
    ru: "Мы создаём книги о вашей семье — от первого интервью до готового тома в твёрдом переплёте. Полностью под ключ.",
    en: "We create books about your family — from the first interview to a finished hardcover volume. Fully managed, start to finish.",
  },
  "hero.byline_label": { ru: "Издательство", en: "Publisher" },
  "hero.cta1": { ru: "Выбрать план", en: "View Plans" },
  "hero.cta2": { ru: "Личный кабинет", en: "Your account" },
  "hero.stat1_num": { ru: "4", en: "4" },
  "hero.stat1_lbl": { ru: "Тарифных плана", en: "Service tiers" },
  "hero.stat2_num": { ru: "100%", en: "100%" },
  "hero.stat2_lbl": { ru: "Под ключ", en: "Fully managed" },
  "hero.stat3_num": { ru: "7+", en: "7+" },
  "hero.stat3_lbl": { ru: "Поколений в архиве", en: "Generations archived" },
  "hero.stat4_num": { ru: "132", en: "132" },
  "hero.stat4_lbl": { ru: "Часов в Эксклюзиве", en: "Hours in Exclusive" },

  // ── Заголовки секций ──────────────────────────────────────────────────
  "head.approach.title": { ru: "Наш подход", en: "Our Approach" },
  "head.approach.sub": { ru: "02 — Методология", en: "02 — Methodology" },
  "head.process.title": { ru: "Как мы работаем", en: "How We Work" },
  "head.process.sub": { ru: "03 — Четыре шага", en: "03 — Four Steps" },
  "head.plans.title": { ru: "Тарифные планы", en: "Pricing Plans" },
  "head.plans.sub": { ru: "04 — USD · Ставка $10/ч", en: "04 — USD · Rate $10/hr" },
  "head.addons.title": { ru: "Дополнительные услуги", en: "Add-on Services" },
  "head.addons.sub": { ru: "05 — К любому плану", en: "05 — Available with any plan" },
  "head.contact.title": { ru: "Начать проект", en: "Start a Project" },
  "head.contact.sub": { ru: "06 — Ответим за 24 часа", en: "06 — We reply within 24 hours" },

  // ── Подход ─────────────────────────────────────────────────────────────
  "ap.title1": { ru: "Наш", en: "Our" },
  "ap.title2": { ru: "подход", en: "approach" },
  "ap.body": {
    ru: "Вы передаёте материалы — мы берём на себя сбор историй, дизайн, тексты и печать. От первого звонка до готовой книги.",
    en: "You provide the materials — we handle stories, design, writing and printing. From the first call to the finished book.",
  },
  "ap.card01_title": { ru: "Только под ключ", en: "Fully Managed" },
  "ap.card01_desc": {
    ru: "Вы передаёте фотографии и воспоминания — мы создаём готовую книгу. Никаких шаблонов для самостоятельного заполнения.",
    en: "You bring photos and memories — we create the finished book. No templates, no DIY.",
  },
  "ap.card02_title": { ru: "Живые истории", en: "Living Stories" },
  "ap.card02_desc": {
    ru: "Интервью с членами семьи превращают сухую хронологию в повествование, которое хочется читать.",
    en: "Family interviews turn dry timelines into narratives people actually want to read.",
  },
  "ap.card03_title": { ru: "Ничего лишнего", en: "Nothing Superfluous" },
  "ap.card03_desc": {
    ru: "Каждый элемент книги служит содержанию. Дизайн не отвлекает — он помогает историям звучать.",
    en: "Every element serves the content. Design doesn't distract — it makes stories resonate.",
  },
  "ap.card04_title": { ru: "На века", en: "Built to Last" },
  "ap.card04_desc": {
    ru: "Материалы и переплёт подобраны так, чтобы книга хранилась десятилетиями и передавалась следующим поколениям.",
    en: "Materials and binding are chosen so the book endures for decades and passes to future generations.",
  },

  // ── Процесс ────────────────────────────────────────────────────────────
  "pr.step01_kicker": { ru: "Этап первый", en: "Step One" },
  "pr.step01_title": { ru: "Знакомство", en: "Discovery" },
  "pr.step01_desc": {
    ru: "Первый созвон и бриф. Обсуждаем объём, ожидания и выбираем план.",
    en: "First call and brief. We discuss scope, expectations and choose a plan.",
  },
  "pr.step02_kicker": { ru: "Этап второй", en: "Step Two" },
  "pr.step02_title": { ru: "Сбор историй", en: "Story Collection" },
  "pr.step02_desc": {
    ru: "Интервью, сбор фотографий и документов. Всё это вы загружаете в личном кабинете.",
    en: "Interviews, photos and documents — all uploaded through your account.",
  },
  "pr.step03_kicker": { ru: "Этап третий", en: "Step Three" },
  "pr.step03_title": { ru: "Создание", en: "Creation" },
  "pr.step03_desc": {
    ru: "Пишем тексты, разрабатываем дизайн, верстаем, строим генеалогическое древо.",
    en: "We write, design, typeset and build the genealogical tree.",
  },
  "pr.step04_kicker": { ru: "Этап четвёртый", en: "Step Four" },
  "pr.step04_title": { ru: "Печать и передача", en: "Print & Delivery" },
  "pr.step04_desc": {
    ru: "Контролируем качество печати. Готовые экземпляры — вашей семье.",
    en: "We oversee print quality. Finished copies delivered to your family.",
  },

  // ── Тарифы ─────────────────────────────────────────────────────────────
  "pl.1.tier": { ru: "Базовый", en: "Basic" },
  "pl.1.name": { ru: "Семейный Портрет", en: "Family Portrait" },
  "pl.1.tag": { ru: "Компактная книга для небольшого архива", en: "A compact book for a small archive" },
  "pl.1.price": { ru: "500", en: "500" },
  "pl.1.note": { ru: "Фиксированная цена", en: "Fixed price" },
  "pl.2.tier": { ru: "Стандарт", en: "Standard" },
  "pl.2.name": { ru: "Семейная Летопись", en: "Family Chronicle" },
  "pl.2.tag": { ru: "Несколько поколений, архивные материалы", en: "Multiple generations, archival materials" },
  "pl.2.price": { ru: "850", en: "850" },
  "pl.2.note": { ru: "Фиксированная цена", en: "Fixed price" },
  "pl.3.tier": { ru: "Премиум", en: "Premium" },
  "pl.3.name": { ru: "Фамильный Архив", en: "Family Archive" },
  "pl.3.tag": { ru: "Глубокая летопись с авторской обработкой", en: "A deep chronicle with editorial treatment" },
  "pl.3.price": { ru: "1 750", en: "1,750" },
  "pl.3.note": { ru: "Фиксированная цена", en: "Fixed price" },
  "pl.4.tier": { ru: "Эксклюзив", en: "Exclusive" },
  "pl.4.name": { ru: "Libro di Famiglia", en: "Libro di Famiglia" },
  "pl.4.tag": { ru: "Один месяц — одна семья. Реликвия навсегда", en: "One month — one family. A heirloom forever" },
  "pl.4.price": { ru: "4 000", en: "4,000" },
  "pl.4.note": { ru: "Индивидуальный проект", en: "Custom project" },
  "pl.cta": { ru: "Выбрать план", en: "Choose Plan" },

  // ── Доп. услуги ─────────────────────────────────────────────────────────
  "ad.1.idx": { ru: "A — 01", en: "A — 01" },
  "ad.1.name": { ru: "Доп. экземпляр", en: "Extra Copy" },
  "ad.1.desc": { ru: "Допечатка готовой книги для других членов семьи.", en: "A reprint of the finished book for other family members." },
  "ad.1.price": { ru: "$45 — $120", en: "$45 — $120" },
  "ad.1.note": { ru: "за экземпляр", en: "per copy" },
  "ad.2.idx": { ru: "A — 02", en: "A — 02" },
  "ad.2.name": { ru: "Цифровой архив", en: "Digital Archive" },
  "ad.2.desc": { ru: "Документы, фото, PDF, генеалогия — на флешке или в облаке.", en: "Documents, photos, PDF, genealogy — on USB or cloud storage." },
  "ad.2.price": { ru: "$75", en: "$75" },
  "ad.2.note": { ru: "единоразово", en: "one-time fee" },
  "ad.3.idx": { ru: "A — 03", en: "A — 03" },
  "ad.3.name": { ru: "Реставрация фото", en: "Photo Restoration" },
  "ad.3.desc": { ru: "Ретушь и восстановление старых снимков сверх лимита плана.", en: "Retouching and restoration of old photos beyond your plan's limit." },
  "ad.3.price": { ru: "от $15", en: "from $15" },
  "ad.3.note": { ru: "пакет из 10 фото", en: "per 10 photos" },
  "ad.4.idx": { ru: "A — 04", en: "A — 04" },
  "ad.4.name": { ru: "Перевод книги", en: "Book Translation" },
  "ad.4.desc": { ru: "Перевод на другой язык и повторная вёрстка.", en: "Translation into another language and full re-typesetting." },
  "ad.4.price": { ru: "$200 — $800", en: "$200 — $800" },
  "ad.4.note": { ru: "зависит от объёма", en: "depends on volume" },
  "ad.5.idx": { ru: "A — 05", en: "A — 05" },
  "ad.5.name": { ru: "Экспресс", en: "Express" },
  "ad.5.desc": { ru: "Приоритетная работа, срок сокращается вдвое.", en: "Priority work — delivery time cut in half." },
  "ad.5.price": { ru: "+$150 — +$500", en: "+$150 — +$500" },
  "ad.5.note": { ru: "надбавка к плану", en: "surcharge on plan" },
  "ad.6.idx": { ru: "A — 06", en: "A — 06" },
  "ad.6.name": { ru: "Постер с древом", en: "Family Tree Poster" },
  "ad.6.desc": { ru: "Иллюстрированное генеалогическое древо для оформления в рамку.", en: "An illustrated genealogical tree designed for framing." },
  "ad.6.price": { ru: "$120 — $350", en: "$120 — $350" },
  "ad.6.note": { ru: "зависит от глубины", en: "depends on depth" },

  // ── Цитата ──────────────────────────────────────────────────────────────
  "pq.text1": {
    ru: "Семейная книга — это не альбом с фотографиями. Это разговор с теми, кто ещё",
    en: "A family book is not a photo album. It is a conversation with those who have",
  },
  "pq.text2": { ru: "не родился", en: "not yet been born" },
  "pq.attr": {
    ru: "— Идея, лежащая в основе каждого проекта",
    en: "— The idea behind every project we make",
  },

  // ── Контакты ─────────────────────────────────────────────────────────────
  "ct.kicker": { ru: "Связаться с нами", en: "Get in Touch" },
  "ct.title1": { ru: "Расскажите", en: "Tell us" },
  "ct.title2": { ru: "о вашей", en: "about your" },
  "ct.title3": { ru: "семье", en: "family" },
  "ct.body": {
    ru: "Заполните форму — мы свяжемся в течение 24 часов и подберём подходящий формат. Первая консультация бесплатно.",
    en: "Fill in the form — we'll be in touch within 24 hours and find the right format for your story. First consultation is free.",
  },
  "ct.sent_kicker": { ru: "Заявка отправлена", en: "Request sent" },
  "ct.sent_body": {
    ru: "Спасибо! Мы свяжемся с вами в течение 24 часов. Заявка сохранена в вашем личном кабинете, если вы вошли в аккаунт.",
    en: "Thank you! We'll be in touch within 24 hours. The request is saved in your account if you are signed in.",
  },
  "ct.lbl_name": { ru: "Имя", en: "Name" },
  "ct.ph_name": { ru: "Александр", en: "Alexander" },
  "ct.lbl_plan": { ru: "Интересующий план", en: "Plan of interest" },
  "ct.ph_plan": { ru: "Выберите план", en: "Select a plan" },
  "ct.opt_discuss": { ru: "Хочу обсудить", en: "I'd like to discuss" },
  "ct.lbl_message": { ru: "О вашей семье", en: "About your family" },
  "ct.ph_message": {
    ru: "Несколько слов о том, что хотите сохранить",
    en: "A few words about the story you want to preserve",
  },
  "ct.btn_send": { ru: "Отправить запрос", en: "Send Request" },
  "ct.btn_sending": { ru: "Отправляем…", en: "Sending…" },
  "ct.note_free": { ru: "Первая консультация — бесплатно", en: "First consultation is free" },
  "ct.err": {
    ru: "Не удалось отправить. Попробуйте ещё раз.",
    en: "Could not send. Please try again.",
  },
};

/** Длинные поля показываем многострочным полем. */
const MULTILINE = new Set<string>([
  "hero.deck", "hero.caption",
  "ap.body", "ap.card01_desc", "ap.card02_desc", "ap.card03_desc", "ap.card04_desc",
  "pr.step01_desc", "pr.step02_desc", "pr.step03_desc", "pr.step04_desc",
  "pq.text1", "pq.attr",
  "ct.body", "ct.sent_body", "ct.ph_message",
  "pl.1.tag", "pl.2.tag", "pl.3.tag", "pl.4.tag",
  "ad.1.desc", "ad.2.desc", "ad.3.desc", "ad.4.desc", "ad.5.desc", "ad.6.desc",
]);

export interface FieldDef {
  key: string;
  group: string;
  label: string;
  multiline: boolean;
}

const GROUP_TITLES: { id: string; ru: string; en: string }[] = [
  { id: "header", ru: "Шапка", en: "Header" },
  { id: "hero", ru: "Главный экран", en: "Hero" },
  { id: "head", ru: "Заголовки секций", en: "Section headings" },
  { id: "ap", ru: "Подход", en: "Approach" },
  { id: "pr", ru: "Процесс", en: "Process" },
  { id: "pl", ru: "Тарифы", en: "Plans" },
  { id: "ad", ru: "Доп. услуги", en: "Add-ons" },
  { id: "pq", ru: "Цитата", en: "Pull quote" },
  { id: "ct", ru: "Контакты", en: "Contact" },
];

function prettyLabel(key: string): string {
  const last = key.split(".").pop() ?? key;
  return last.replace(/[_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Плоский список полей, сгруппированных по префиксу. */
export const CONTENT_FIELDS: FieldDef[] = Object.keys(DEFAULTS).map((key) => {
  const group: string = key.split(".")[0] ?? key;
  return { key, group, label: prettyLabel(key), multiline: MULTILINE.has(key) };
});

export const FIELD_GROUPS = GROUP_TITLES;

export interface SiteContent {
  isLoading: boolean;
  /** Возвращает строку по ключу на текущем языке. */
  c: (key: string) => string;
  /** Сырые переопределения из БД (key -> Pair). */
  overrides: Record<string, Pair>;
  /** Принудительное обновление. */
  refetch: () => void;
}

/** Читает все переопределения контента из облака и отдаёт аксессор c(key). */
export function useSiteContent(): SiteContent {
  const { lang } = useI18n();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<Record<string, Pair>>({
    queryKey: ["site-content"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("site_content")
        .select("key, ru, en");
      if (error) throw error;
      const map: Record<string, Pair> = {};
      for (const r of (rows ?? []) as unknown as ContentRow[]) {
        if (r?.key) map[r.key] = { ru: r.ru ?? "", en: r.en ?? "" };
      }
      return map;
    },
    staleTime: 60_000,
  });

  const overrides = data ?? {};
  const c = (key: string): string => {
    const def = DEFAULTS[key] ?? { ru: key, en: key };
    const ov = overrides[key];
    const pair = ov ?? def;
    return lang === "en" ? pair.en : pair.ru;
  };

  return { isLoading, c, overrides, refetch: () => refetch() };
}

export type { Lang };
