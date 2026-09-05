import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Logo } from "./Logo";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/approach" as const, ru: "Подход", en: "Approach" },
  { to: "/process" as const, ru: "Процесс", en: "Process" },
  { to: "/plans" as const, ru: "Планы", en: "Plans" },
  { to: "/services" as const, ru: "Услуги", en: "Services" },
  { to: "/contact" as const, ru: "Контакт", en: "Contact" },
];

/** Верхняя панель: дата, язык, тема. */
function UtilBar() {
  const { lang, setLang, theme, toggleTheme, t } = useI18n();
  const [date, setDate] = useState("");

  useEffect(() => {
    const d = new Date();
    setDate(
      d.toLocaleDateString(lang === "en" ? "en-GB" : "ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, [lang]);

  return (
    <div className="util-bar">
      <span className="util-date">{date}</span>
      <div className="util-controls">
        <button className={`ctrl${lang === "ru" ? " on" : ""}`} onClick={() => setLang("ru")}>
          RU
        </button>
        <button className={`ctrl${lang === "en" ? " on" : ""}`} onClick={() => setLang("en")}>
          EN
        </button>
        <div className="ctrl-sep" />
        <button
          className="ctrl"
          onClick={toggleTheme}
          aria-label={t("Сменить тему", "Toggle theme")}
        >
          <svg className="ctrl-icon" viewBox="0 0 14 14" fill="none">
            {theme === "dark" ? (
              <circle cx="7" cy="7" r="4" fill="currentColor" />
            ) : (
              <path d="M12 9A5 5 0 0 1 5 2a5 5 0 1 0 7 7z" fill="currentColor" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Шапка сайта: утилити-бар, мастхед, навигация. */
export function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(!!session),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <>
      <UtilBar />

      <header className="masthead">
        <div className="masthead-left">
          <span className="masthead-tag">
            {t("Издательство семейных историй", "Family History Publishers")}
          </span>
          <hr className="masthead-left-rule" />
        </div>

        <Link to="/" className="masthead-center">
          <Logo />
          <div className="masthead-name">Annuli</div>
          <div className="masthead-sub">
            {t("Фамильные книги · с 2024", "Family Books · Est. 2024")}
          </div>
        </Link>

        <div className="masthead-right">
          <hr className="masthead-left-rule" />
          <span className="masthead-tag" style={{ textAlign: "right" }}>
            {t("Полностью под ключ", "Fully managed")}
          </span>
        </div>
      </header>

      <nav className="main-nav">
        <ul className="nav-sections">
          {NAV.map((n) => (
            <li key={n.to}>
              <Link to={n.to}>{t(n.ru, n.en)}</Link>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          <Link to={signedIn ? "/account" : "/auth"} className="nav-link">
            {signedIn ? t("Личный кабинет", "Account") : t("Войти", "Sign in")}
          </Link>
          <Link to="/contact" className="nav-cta">
            {t("Начать проект", "Start a Project")}
          </Link>
          <button
            className={`nav-burger${open ? " open" : ""}`}
            aria-label={t("Меню", "Menu")}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <nav className={`nav-drawer${open ? " open" : ""}`}>
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} onClick={() => setOpen(false)}>
            {t(n.ru, n.en)}
          </Link>
        ))}
        <Link to={signedIn ? "/account" : "/auth"} onClick={() => setOpen(false)}>
          {signedIn ? t("Личный кабинет", "Account") : t("Войти", "Sign in")}
        </Link>
      </nav>
    </>
  );
}
