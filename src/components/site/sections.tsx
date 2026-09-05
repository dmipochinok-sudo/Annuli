import { Link } from "@tanstack/react-router";
import { useState } from "react";

import heroAsset from "@/assets/annuli-hero.jpg.asset.json";
import { useI18n } from "@/lib/i18n";
import { submitLead } from "@/lib/leads.functions";

/** Заголовок редакционной секции. */
export function SecHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="sec-head">
      <span className="sec-head-title">{title}</span>
      <span className="sec-head-sub">{sub}</span>
    </div>
  );
}

export function Hero() {
  const { t } = useI18n();
  return (
    <section className="hero">
      <div className="hero-photo">
        <img src={heroAsset.url} alt={t("Семейный портрет, 1927 год", "Family portrait, 1927")} />
        <div className="hero-caption">
          {t(
            "Семейный портрет. Студийная фотография, 1927 г.",
            "Family portrait. Studio photograph, 1927.",
          )}
        </div>
      </div>

      <div className="hero-text-wrap">
        <div className="hero-main">
          <p className="hero-kicker a1">{t("Семейная летопись", "Family Chronicle")}</p>
          <h1 className="hero-headline a2">
            {t("История рода,", "A family story")}
            <br />
            <i>{t("достойная вечности", "worthy of eternity")}</i>
          </h1>
          <p className="hero-deck a3">
            {t(
              "Мы создаём книги о вашей семье — от первого интервью до готового тома в твёрдом переплёте. Полностью под ключ.",
              "We create books about your family — from the first interview to a finished hardcover volume. Fully managed, start to finish.",
            )}
          </p>
          <p className="hero-byline a3">
            {t("Издательство", "Publisher")} <span>Annuli</span>
          </p>
          <div className="hero-actions a4">
            <Link to="/plans" className="btn btn--primary">
              {t("Выбрать план", "View Plans")}
            </Link>
            <Link to="/account" className="btn btn--ghost">
              {t("Личный кабинет", "Your account")}
            </Link>
          </div>
        </div>

        <aside className="hero-sidebar a4">
          <div className="stat-cell">
            <span className="stat-num">4</span>
            <span className="stat-lbl">{t("Тарифных плана", "Service tiers")}</span>
          </div>
          <div className="stat-cell">
            <span className="stat-num">100%</span>
            <span className="stat-lbl">{t("Под ключ", "Fully managed")}</span>
          </div>
          <div className="stat-cell">
            <span className="stat-num">7+</span>
            <span className="stat-lbl">{t("Поколений в архиве", "Generations archived")}</span>
          </div>
          <div className="stat-cell">
            <span className="stat-num">132</span>
            <span className="stat-lbl">{t("Часов в Эксклюзиве", "Hours in Exclusive")}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function Approach() {
  const { t } = useI18n();
  const cards = [
    {
      n: "01",
      ru: "Только под ключ",
      en: "Fully Managed",
      dru: "Вы передаёте фотографии и воспоминания — мы создаём готовую книгу. Никаких шаблонов для самостоятельного заполнения.",
      den: "You bring photos and memories — we create the finished book. No templates, no DIY.",
    },
    {
      n: "02",
      ru: "Живые истории",
      en: "Living Stories",
      dru: "Интервью с членами семьи превращают сухую хронологию в повествование, которое хочется читать.",
      den: "Family interviews turn dry timelines into narratives people actually want to read.",
    },
    {
      n: "03",
      ru: "Ничего лишнего",
      en: "Nothing Superfluous",
      dru: "Каждый элемент книги служит содержанию. Дизайн не отвлекает — он помогает историям звучать.",
      den: "Every element serves the content. Design doesn't distract — it makes stories resonate.",
    },
    {
      n: "04",
      ru: "На века",
      en: "Built to Last",
      dru: "Материалы и переплёт подобраны так, чтобы книга хранилась десятилетиями и передавалась следующим поколениям.",
      den: "Materials and binding are chosen so the book endures for decades and passes to future generations.",
    },
  ];

  return (
    <section className="approach" id="approach">
      <SecHead
        title={t("Наш подход", "Our Approach")}
        sub={t("02 — Методология", "02 — Methodology")}
      />
      <div className="approach-inner">
        <div className="ap-standfirst r">
          <div className="ap-number">02</div>
          <h2 className="ap-title">
            {t("Наш", "Our")}
            <br />
            <i>{t("подход", "approach")}</i>
          </h2>
          <p className="ap-body">
            {t(
              "Вы передаёте материалы — мы берём на себя сбор историй, дизайн, тексты и печать. От первого звонка до готовой книги.",
              "You provide the materials — we handle stories, design, writing and printing. From the first call to the finished book.",
            )}
          </p>
        </div>
        <div className="ap-cards r" style={{ transitionDelay: ".1s" }}>
          {cards.map((c) => (
            <div className="ap-card" key={c.n}>
              <div className="ap-card-n">{c.n}</div>
              <hr className="ap-card-rule" />
              <div className="ap-card-title">{t(c.ru, c.en)}</div>
              <p className="ap-card-desc">{t(c.dru, c.den)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Process() {
  const { t } = useI18n();
  const steps = [
    {
      n: "01",
      kru: "Этап первый",
      ken: "Step One",
      tru: "Знакомство",
      ten: "Discovery",
      dru: "Первый созвон и бриф. Обсуждаем объём, ожидания и выбираем план.",
      den: "First call and brief. We discuss scope, expectations and choose a plan.",
    },
    {
      n: "02",
      kru: "Этап второй",
      ken: "Step Two",
      tru: "Сбор историй",
      ten: "Story Collection",
      dru: "Интервью, сбор фотографий и документов. Всё это вы загружаете в личном кабинете.",
      den: "Interviews, photos and documents — all uploaded through your account.",
    },
    {
      n: "03",
      kru: "Этап третий",
      ken: "Step Three",
      tru: "Создание",
      ten: "Creation",
      dru: "Пишем тексты, разрабатываем дизайн, верстаем, строим генеалогическое древо.",
      den: "We write, design, typeset and build the genealogical tree.",
    },
    {
      n: "04",
      kru: "Этап четвёртый",
      ken: "Step Four",
      tru: "Печать и передача",
      ten: "Print & Delivery",
      dru: "Контролируем качество печати. Готовые экземпляры — вашей семье.",
      den: "We oversee print quality. Finished copies delivered to your family.",
    },
  ];

  return (
    <section className="process" id="process">
      <SecHead
        title={t("Как мы работаем", "How We Work")}
        sub={t("03 — Четыре шага", "03 — Four Steps")}
      />
      <div className="process-list">
        {steps.map((s, i) => (
          <div className="step-cell r" key={s.n} style={{ transitionDelay: `${i * 0.08}s` }}>
            <div className="step-num-large">{s.n}</div>
            <div className="step-body">
              <div className="step-kicker">{t(s.kru, s.ken)}</div>
              <div className="step-title">{t(s.tru, s.ten)}</div>
              <p className="step-desc">{t(s.dru, s.den)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface PlanSpec {
  ru: string;
  en: string;
  vru: string;
  ven: string;
}

interface Plan {
  tru: string;
  ten: string;
  nru: string;
  nen: string;
  gru: string;
  gen: string;
  price: string;
  noteRu: string;
  noteEn: string;
  featured?: boolean;
  specs: PlanSpec[];
}

export const PLANS: Plan[] = [
  {
    tru: "Базовый",
    ten: "Basic",
    nru: "Семейный Портрет",
    nen: "Family Portrait",
    gru: "Компактная книга для небольшого архива",
    gen: "A compact book for a small archive",
    price: "500",
    noteRu: "Фиксированная цена",
    noteEn: "Fixed price",
    specs: [
      { ru: "Страниц", en: "Pages", vru: "40–50", ven: "40–50" },
      { ru: "Фотографий", en: "Photos", vru: "до 30", ven: "up to 30" },
      { ru: "Интервью", en: "Interview", vru: "1 × 45 мин", ven: "1 × 45 min" },
      { ru: "Древо", en: "Tree", vru: "2 поколения", ven: "2 generations" },
      { ru: "Экземпляров", en: "Copies", vru: "1 + PDF", ven: "1 + PDF" },
      { ru: "Правок", en: "Revisions", vru: "1 круг", ven: "1 round" },
      { ru: "Срок", en: "Timeline", vru: "~1 нед.", ven: "~1 week" },
    ],
  },
  {
    tru: "Стандарт",
    ten: "Standard",
    nru: "Семейная Летопись",
    nen: "Family Chronicle",
    gru: "Несколько поколений, архивные материалы",
    gen: "Multiple generations, archival materials",
    price: "850",
    noteRu: "Фиксированная цена",
    noteEn: "Fixed price",
    specs: [
      { ru: "Страниц", en: "Pages", vru: "60–70", ven: "60–70" },
      { ru: "Фотографий", en: "Photos", vru: "до 60", ven: "up to 60" },
      { ru: "Интервью", en: "Interview", vru: "1 × 1 ч", ven: "1 × 1 hr" },
      { ru: "Древо", en: "Tree", vru: "3 поколения", ven: "3 generations" },
      { ru: "Экземпляров", en: "Copies", vru: "2 + PDF", ven: "2 + PDF" },
      { ru: "Правок", en: "Revisions", vru: "1 круг", ven: "1 round" },
      { ru: "Срок", en: "Timeline", vru: "~2 нед.", ven: "~2 weeks" },
    ],
  },
  {
    tru: "Премиум",
    ten: "Premium",
    nru: "Фамильный Архив",
    nen: "Family Archive",
    gru: "Глубокая летопись с авторской обработкой",
    gen: "A deep chronicle with editorial treatment",
    price: "1 750",
    noteRu: "Фиксированная цена",
    noteEn: "Fixed price",
    specs: [
      { ru: "Страниц", en: "Pages", vru: "110–130", ven: "110–130" },
      { ru: "Фотографий", en: "Photos", vru: "до 120", ven: "up to 120" },
      { ru: "Интервью", en: "Interviews", vru: "2 сессии", ven: "2 sessions" },
      { ru: "Древо", en: "Tree", vru: "4–5 поколений", ven: "4–5 generations" },
      { ru: "Экземпляров", en: "Copies", vru: "4 + футляр", ven: "4 + slipcase" },
      { ru: "Правок", en: "Revisions", vru: "2 круга", ven: "2 rounds" },
      { ru: "Срок", en: "Timeline", vru: "3–4 нед.", ven: "3–4 weeks" },
    ],
  },
  {
    tru: "Эксклюзив",
    ten: "Exclusive",
    nru: "Libro di Famiglia",
    nen: "Libro di Famiglia",
    gru: "Один месяц — одна семья. Реликвия навсегда",
    gen: "One month — one family. A heirloom forever",
    price: "4 000",
    noteRu: "Индивидуальный проект",
    noteEn: "Custom project",
    featured: true,
    specs: [
      { ru: "Страниц", en: "Pages", vru: "180–220", ven: "180–220" },
      { ru: "Фотографий", en: "Photos", vru: "до 80 + ретушь", ven: "up to 80 + retouching" },
      { ru: "Интервью", en: "Interviews", vru: "до 5 сессий", ven: "up to 5 sessions" },
      { ru: "Древо", en: "Tree", vru: "5–7+ поколений", ven: "5–7+ generations" },
      { ru: "Экземпляров", en: "Copies", vru: "6–10 + тиснение", ven: "6–10 + embossing" },
      { ru: "Правок", en: "Revisions", vru: "3 круга", ven: "3 rounds" },
      { ru: "Срок", en: "Timeline", vru: "~1 мес.", ven: "~1 month" },
    ],
  },
];

export function Plans() {
  const { t } = useI18n();
  return (
    <section className="plans" id="plans">
      <SecHead
        title={t("Тарифные планы", "Pricing Plans")}
        sub={t("04 — USD · Ставка $10/ч", "04 — USD · Rate $10/hr")}
      />
      <div className="plans-grid">
        {PLANS.map((p, i) => (
          <div
            key={p.nen}
            className={`plan-card r${p.featured ? " plan-card--f" : ""}`}
            style={{ transitionDelay: `${i * 0.08}s` }}
          >
            <div className="plan-tier">{t(p.tru, p.ten)}</div>
            <div className="plan-name">{t(p.nru, p.nen)}</div>
            <p className="plan-tag">{t(p.gru, p.gen)}</p>
            <hr className="plan-divider" />
            <div className="plan-price">
              <sup>$</sup>
              {p.price}
            </div>
            <div className="plan-price-note">{t(p.noteRu, p.noteEn)}</div>
            <ul className="plan-specs">
              {p.specs.map((s) => (
                <li key={s.en}>
                  <span>{t(s.ru, s.en)}</span>
                  <span>{t(s.vru, s.ven)}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/contact"
              search={{ plan: p.ten }}
              className={`plan-btn${p.featured ? " plan-btn--f" : ""}`}
            >
              {t("Выбрать план", "Choose Plan")}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Addons() {
  const { t } = useI18n();
  const items = [
    {
      idx: "A — 01",
      ru: "Доп. экземпляр",
      en: "Extra Copy",
      dru: "Допечатка готовой книги для других членов семьи.",
      den: "A reprint of the finished book for other family members.",
      price: "$45 — $120",
      nru: "за экземпляр",
      nen: "per copy",
    },
    {
      idx: "A — 02",
      ru: "Цифровой архив",
      en: "Digital Archive",
      dru: "Документы, фото, PDF, генеалогия — на флешке или в облаке.",
      den: "Documents, photos, PDF, genealogy — on USB or cloud storage.",
      price: "$75",
      nru: "единоразово",
      nen: "one-time fee",
    },
    {
      idx: "A — 03",
      ru: "Реставрация фото",
      en: "Photo Restoration",
      dru: "Ретушь и восстановление старых снимков сверх лимита плана.",
      den: "Retouching and restoration of old photos beyond your plan's limit.",
      price: "от $15",
      nru: "пакет из 10 фото",
      nen: "per 10 photos",
    },
    {
      idx: "A — 04",
      ru: "Перевод книги",
      en: "Book Translation",
      dru: "Перевод на другой язык и повторная вёрстка.",
      den: "Translation into another language and full re-typesetting.",
      price: "$200 — $800",
      nru: "зависит от объёма",
      nen: "depends on volume",
    },
    {
      idx: "A — 05",
      ru: "Экспресс",
      en: "Express",
      dru: "Приоритетная работа, срок сокращается вдвое.",
      den: "Priority work — delivery time cut in half.",
      price: "+$150 — +$500",
      nru: "надбавка к плану",
      nen: "surcharge on plan",
    },
    {
      idx: "A — 06",
      ru: "Постер с древом",
      en: "Family Tree Poster",
      dru: "Иллюстрированное генеалогическое древо для оформления в рамку.",
      den: "An illustrated genealogical tree designed for framing.",
      price: "$120 — $350",
      nru: "зависит от глубины",
      nen: "depends on depth",
    },
  ];

  return (
    <section className="addons" id="addons">
      <SecHead
        title={t("Дополнительные услуги", "Add-on Services")}
        sub={t("05 — К любому плану", "05 — Available with any plan")}
      />
      <div className="addons-grid">
        {items.map((a, i) => (
          <div className="addon-card r" key={a.idx} style={{ transitionDelay: `${(i % 3) * 0.08}s` }}>
            <div className="addon-idx">{a.idx}</div>
            <div className="addon-name">{t(a.ru, a.en)}</div>
            <p className="addon-desc">{t(a.dru, a.den)}</p>
            <div className="addon-price">{a.price}</div>
            <div className="addon-note">{t(a.nru, a.nen)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PullQuote() {
  const { t } = useI18n();
  return (
    <section className="pullquote r">
      <div className="pq-mark">&laquo;</div>
      <div>
        <p className="pq-text">
          {t(
            "Семейная книга — это не альбом с фотографиями. Это разговор с теми, кто ещё",
            "A family book is not a photo album. It is a conversation with those who have",
          )}{" "}
          <i>{t("не родился", "not yet been born")}</i>
        </p>
        <p className="pq-attr">
          {t(
            "— Идея, лежащая в основе каждого проекта",
            "— The idea behind every project we make",
          )}
        </p>
      </div>
    </section>
  );
}

export function Contact({ initialPlan = "" }: { initialPlan?: string }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState(initialPlan);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await submitLead({ data: { name, email, plan, message } });
      setSent(true);
    } catch {
      setError(t("Не удалось отправить. Попробуйте ещё раз.", "Could not send. Please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="contact" id="contact">
      <SecHead
        title={t("Начать проект", "Start a Project")}
        sub={t("06 — Ответим за 24 часа", "06 — We reply within 24 hours")}
      />
      <div className="contact-inner">
        <div className="contact-l r">
          <div className="contact-kicker">{t("Связаться с нами", "Get in Touch")}</div>
          <h2 className="contact-title">
            {t("Расскажите", "Tell us")}
            <br />
            {t("о вашей", "about your")}
            <br />
            <i>{t("семье", "family")}</i>
          </h2>
          <p className="contact-body">
            {t(
              "Заполните форму — мы свяжемся в течение 24 часов и подберём подходящий формат. Первая консультация бесплатно.",
              "Fill in the form — we'll be in touch within 24 hours and find the right format for your story. First consultation is free.",
            )}
          </p>
        </div>

        <div className="contact-r r" style={{ transitionDelay: ".15s" }}>
          {sent ? (
            <div>
              <div className="contact-kicker">{t("Заявка отправлена", "Request sent")}</div>
              <p className="contact-body">
                {t(
                  "Спасибо! Мы свяжемся с вами в течение 24 часов. Заявка сохранена в вашем личном кабинете, если вы вошли в аккаунт.",
                  "Thank you! We'll be in touch within 24 hours. The request is saved in your account if you are signed in.",
                )}
              </p>
            </div>
          ) : (
            <form className="form" onSubmit={onSubmit}>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-lbl">{t("Имя", "Name")}</label>
                  <input
                    className="form-inp"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("Александр", "Alexander")}
                  />
                </div>
                <div className="form-field">
                  <label className="form-lbl">Email</label>
                  <input
                    className="form-inp"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="form-lbl">{t("Интересующий план", "Plan of interest")}</label>
                <select
                  className="form-sel"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    {t("Выберите план", "Select a plan")}
                  </option>
                  <option value="Basic">{t("Базовый — $500", "Basic — $500")}</option>
                  <option value="Standard">{t("Стандарт — $850", "Standard — $850")}</option>
                  <option value="Premium">{t("Премиум — $1 750", "Premium — $1,750")}</option>
                  <option value="Exclusive">{t("Эксклюзив — $4 000", "Exclusive — $4,000")}</option>
                  <option value="Discuss">{t("Хочу обсудить", "I'd like to discuss")}</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-lbl">{t("О вашей семье", "About your family")}</label>
                <textarea
                  className="form-ta"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t(
                    "Несколько слов о том, что хотите сохранить",
                    "A few words about the story you want to preserve",
                  )}
                />
              </div>
              {error && <p className="form-note">{error}</p>}
              <button type="submit" className="form-btn" disabled={sending}>
                {sending ? t("Отправляем…", "Sending…") : t("Отправить запрос", "Send Request")}
              </button>
              <p className="form-note">
                {t("Первая консультация — бесплатно", "First consultation is free")}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
