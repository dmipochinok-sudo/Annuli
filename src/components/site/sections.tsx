import { Link } from "@tanstack/react-router";
import { useState } from "react";

import heroAsset from "@/assets/annuli-hero.jpg.asset.json";
import { useI18n } from "@/lib/i18n";
import { useSiteContent } from "@/lib/cms/content";
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
  const { c } = useSiteContent();
  return (
    <section className="hero">
      <div className="hero-photo">
        <img src={heroAsset.url} alt={c("hero.alt")} />
        <div className="hero-caption">{c("hero.caption")}</div>
      </div>

      <div className="hero-text-wrap">
        <div className="hero-main">
          <p className="hero-kicker a1">{c("hero.kicker")}</p>
          <h1 className="hero-headline a2">
            {c("hero.headline1")}
            <br />
            <i>{c("hero.headline2")}</i>
          </h1>
          <p className="hero-deck a3">{c("hero.deck")}</p>
          <p className="hero-byline a3">
            {c("hero.byline_label")} <span>Annuli</span>
          </p>
          <div className="hero-actions a4">
            <Link to="/plans" className="btn btn--primary">
              {c("hero.cta1")}
            </Link>
            <Link to="/account" className="btn btn--ghost">
              {c("hero.cta2")}
            </Link>
          </div>
        </div>

        <aside className="hero-sidebar a4">
          <div className="stat-cell">
            <span className="stat-num">{c("hero.stat1_num")}</span>
            <span className="stat-lbl">{c("hero.stat1_lbl")}</span>
          </div>
          <div className="stat-cell">
            <span className="stat-num">{c("hero.stat2_num")}</span>
            <span className="stat-lbl">{c("hero.stat2_lbl")}</span>
          </div>
          <div className="stat-cell">
            <span className="stat-num">{c("hero.stat3_num")}</span>
            <span className="stat-lbl">{c("hero.stat3_lbl")}</span>
          </div>
          <div className="stat-cell">
            <span className="stat-num">{c("hero.stat4_num")}</span>
            <span className="stat-lbl">{c("hero.stat4_lbl")}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function Approach() {
  const { c } = useSiteContent();
  const cards = [
    { n: "01", title: c("ap.card01_title"), desc: c("ap.card01_desc") },
    { n: "02", title: c("ap.card02_title"), desc: c("ap.card02_desc") },
    { n: "03", title: c("ap.card03_title"), desc: c("ap.card03_desc") },
    { n: "04", title: c("ap.card04_title"), desc: c("ap.card04_desc") },
  ];

  return (
    <section className="approach" id="approach">
      <SecHead title={c("head.approach.title")} sub={c("head.approach.sub")} />
      <div className="approach-inner">
        <div className="ap-standfirst r">
          <div className="ap-number">02</div>
          <h2 className="ap-title">
            {c("ap.title1")}
            <br />
            <i>{c("ap.title2")}</i>
          </h2>
          <p className="ap-body">{c("ap.body")}</p>
        </div>
        <div className="ap-cards r" style={{ transitionDelay: ".1s" }}>
          {cards.map((card) => (
            <div className="ap-card" key={card.n}>
              <div className="ap-card-n">{card.n}</div>
              <hr className="ap-card-rule" />
              <div className="ap-card-title">{card.title}</div>
              <p className="ap-card-desc">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Process() {
  const { c } = useSiteContent();
  const steps = [
    { n: "01", kicker: c("pr.step01_kicker"), title: c("pr.step01_title"), desc: c("pr.step01_desc") },
    { n: "02", kicker: c("pr.step02_kicker"), title: c("pr.step02_title"), desc: c("pr.step02_desc") },
    { n: "03", kicker: c("pr.step03_kicker"), title: c("pr.step03_title"), desc: c("pr.step03_desc") },
    { n: "04", kicker: c("pr.step04_kicker"), title: c("pr.step04_title"), desc: c("pr.step04_desc") },
  ];

  return (
    <section className="process" id="process">
      <SecHead title={c("head.process.title")} sub={c("head.process.sub")} />
      <div className="process-list">
        {steps.map((s, i) => (
          <div className="step-cell r" key={s.n} style={{ transitionDelay: `${i * 0.08}s` }}>
            <div className="step-num-large">{s.n}</div>
            <div className="step-body">
              <div className="step-kicker">{s.kicker}</div>
              <div className="step-title">{s.title}</div>
              <p className="step-desc">{s.desc}</p>
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

export interface Plan {
  tier: string;
  name: string;
  tag: string;
  price: string;
  note: string;
  featured?: boolean;
  specs: PlanSpec[];
}

/** Статические характеристики тарифов (не редактируются через CMS). */
export const PLANS: Plan[] = [
  {
    tier: "Basic",
    name: "Family Portrait",
    tag: "compact",
    price: "500",
    note: "fixed",
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
    tier: "Standard",
    name: "Family Chronicle",
    tag: "multi-gen",
    price: "850",
    note: "fixed",
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
    tier: "Premium",
    name: "Family Archive",
    tag: "deep",
    price: "1750",
    note: "fixed",
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
    tier: "Exclusive",
    name: "Libro di Famiglia",
    tag: "heirloom",
    price: "4000",
    note: "custom",
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
  const { c } = useSiteContent();
  return (
    <section className="plans" id="plans">
      <SecHead title={c("head.plans.title")} sub={c("head.plans.sub")} />
      <div className="plans-grid">
        {PLANS.map((p, i) => {
          const idx = i + 1;
          return (
            <div
              key={p.name}
              className={`plan-card r${p.featured ? " plan-card--f" : ""}`}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="plan-tier">{c(`pl.${idx}.tier`)}</div>
              <div className="plan-name">{c(`pl.${idx}.name`)}</div>
              <p className="plan-tag">{c(`pl.${idx}.tag`)}</p>
              <hr className="plan-divider" />
              <div className="plan-price">
                <sup>$</sup>
                {c(`pl.${idx}.price`)}
              </div>
              <div className="plan-price-note">{c(`pl.${idx}.note`)}</div>
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
                search={{ plan: p.tier }}
                className={`plan-btn${p.featured ? " plan-btn--f" : ""}`}
              >
                {c("pl.cta")}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function Addons() {
  const { c } = useSiteContent();
  const items = [1, 2, 3, 4, 5, 6].map((i) => ({
    idx: c(`ad.${i}.idx`),
    name: c(`ad.${i}.name`),
    desc: c(`ad.${i}.desc`),
    price: c(`ad.${i}.price`),
    note: c(`ad.${i}.note`),
  }));

  return (
    <section className="addons" id="addons">
      <SecHead title={c("head.addons.title")} sub={c("head.addons.sub")} />
      <div className="addons-grid">
        {items.map((a, i) => (
          <div className="addon-card r" key={a.idx} style={{ transitionDelay: `${(i % 3) * 0.08}s` }}>
            <div className="addon-idx">{a.idx}</div>
            <div className="addon-name">{a.name}</div>
            <p className="addon-desc">{a.desc}</p>
            <div className="addon-price">{a.price}</div>
            <div className="addon-note">{a.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PullQuote() {
  const { c } = useSiteContent();
  return (
    <section className="pullquote r">
      <div className="pq-mark">&laquo;</div>
      <div>
        <p className="pq-text">
          {c("pq.text1")} <i>{c("pq.text2")}</i>
        </p>
        <p className="pq-attr">{c("pq.attr")}</p>
      </div>
    </section>
  );
}

export function Contact({ initialPlan = "" }: { initialPlan?: string }) {
  const { t } = useI18n();
  const { c } = useSiteContent();
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
      setError(c("ct.err"));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="contact" id="contact">
      <SecHead title={c("head.contact.title")} sub={c("head.contact.sub")} />
      <div className="contact-inner">
        <div className="contact-l r">
          <div className="contact-kicker">{c("ct.kicker")}</div>
          <h2 className="contact-title">
            {c("ct.title1")}
            <br />
            {c("ct.title2")}
            <br />
            <i>{c("ct.title3")}</i>
          </h2>
          <p className="contact-body">{c("ct.body")}</p>
        </div>

        <div className="contact-r r" style={{ transitionDelay: ".15s" }}>
          {sent ? (
            <div>
              <div className="contact-kicker">{c("ct.sent_kicker")}</div>
              <p className="contact-body">{c("ct.sent_body")}</p>
            </div>
          ) : (
            <form className="form" onSubmit={onSubmit}>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-lbl">{c("ct.lbl_name")}</label>
                  <input
                    className="form-inp"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={c("ct.ph_name")}
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
                <label className="form-lbl">{c("ct.lbl_plan")}</label>
                <select
                  className="form-sel"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    {c("ct.ph_plan")}
                  </option>
                  {PLANS.map((p, i) => {
                    const idx = i + 1;
                    return (
                      <option key={p.tier} value={p.tier}>
                        {`${c(`pl.${idx}.tier`)} — $${c(`pl.${idx}.price`)}`}
                      </option>
                    );
                  })}
                  <option value="Discuss">{c("ct.opt_discuss")}</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-lbl">{c("ct.lbl_message")}</label>
                <textarea
                  className="form-ta"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={c("ct.ph_message")}
                />
              </div>
              {error && <p className="form-note">{error}</p>}
              <button type="submit" className="form-btn" disabled={sending}>
                {sending ? c("ct.btn_sending") : c("ct.btn_send")}
              </button>
              <p className="form-note">{c("ct.note_free")}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
