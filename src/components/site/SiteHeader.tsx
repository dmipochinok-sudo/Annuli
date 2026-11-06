import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { Logo } from "./Logo";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { isCloudConfigured } from "@/lib/cloud-availability";
import { useSectionVisibility } from "@/lib/cms/site-config";

const NAV = [
  { to: "/approach" as const, ru: "Подход", en: "Approach", section: "approach" },
  { to: "/process" as const, ru: "Процесс", en: "Process", section: "process" },
  { to: "/plans" as const, ru: "Планы", en: "Plans", section: "plans" },
  { to: "/services" as const, ru: "Услуги", en: "Services", section: "addons" },
  { to: "/contact" as const, ru: "Контакт", en: "Contact", section: "contact" },
];

/** Верхняя служебная полоса: дата, язык, тема. */
function UtilBar() {
  const { lang, setLang, toggleTheme, t } = useI18n();
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
            <g className="icon-sun" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="7" cy="7" r="2.6" fill="currentColor" stroke="none" />
              <line x1="7" y1="0.6" x2="7" y2="2" />
              <line x1="7" y1="12" x2="7" y2="13.4" />
              <line x1="0.6" y1="7" x2="2" y2="7" />
              <line x1="12" y1="7" x2="13.4" y2="7" />
              <line x1="2.5" y1="2.5" x2="3.5" y2="3.5" />
              <line x1="10.5" y1="10.5" x2="11.5" y2="11.5" />
              <line x1="11.5" y1="2.5" x2="10.5" y2="3.5" />
              <line x1="3.5" y1="10.5" x2="2.5" y2="11.5" />
            </g>
            <path
              className="icon-moon"
              d="M12 9A5 5 0 0 1 5 2a5 5 0 1 0 7 7z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Компактная шапка v2: утилити-полоса, топбар с маркой и навигацией, полоса-мастхед. */
export function SiteHeader() {
  const { t } = useI18n();
  const { isVisible } = useSectionVisibility();
  const navItems = NAV.filter((n) => isVisible(n.section));
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const topbarRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isCloudConfigured()) return;
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUserId(session?.user?.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("no-scroll");

    const closeMenu = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") setOpen(false);
        return;
      }
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!topbarRef.current?.contains(target) && !drawerRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", closeMenu);
    document.addEventListener("pointerdown", closeMenu);
    return () => {
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", closeMenu);
      document.removeEventListener("pointerdown", closeMenu);
    };
  }, [open]);

  const { data: isAdmin } = useQuery<boolean>({
    queryKey: ["menu-is-admin", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.rpc("is_admin");
      return !!data;
    },
  });

  const signedIn = !!userId;
  const signOut = async () => {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setUserId(null);
  };

  return (
    <>
      <UtilBar />

      <header className="topbar" ref={topbarRef}>
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Logo />
          </span>
          <span className="brand-text">
            <span className="brand-name">Annuli</span>
            <span className="brand-sub">
              {t("Издательство семейных историй", "Family History Publishers")}
            </span>
          </span>
        </Link>

        <nav>
          <ul className="topbar-nav">
            {navItems.map((n) => (
              <li key={n.to}>
                <Link to={n.to}>{t(n.ru, n.en)}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="topbar-actions">
          {isAdmin && (
            <Link to="/admin/cms" className="nav-link nav-link--desktop">
              {t("CMS", "CMS")}
            </Link>
          )}
          <Link to={signedIn ? "/account" : "/auth"} className="nav-link nav-link--desktop">
            {signedIn ? t("Личный кабинет", "Account") : t("Войти", "Sign in")}
          </Link>
          {signedIn ? (
            <button className="nav-link nav-link--mobile" onClick={() => void signOut()}>
              {t("Выйти", "Sign out")}
            </button>
          ) : (
            <Link to="/auth" className="nav-link nav-link--mobile">
              {t("Войти / Создать аккаунт", "Sign in / Create account")}
            </Link>
          )}
          <button
            className={`nav-burger${open ? " open" : ""}`}
            aria-label={t("Меню", "Menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <nav
        className={`nav-drawer${open ? " open" : ""}`}
        ref={drawerRef}
        aria-hidden={!open}
      >
        {navItems.map((n) => (
          <Link key={n.to} to={n.to} onClick={() => setOpen(false)}>
            {t(n.ru, n.en)}
          </Link>
        ))}
        {signedIn && (
          <Link to="/account" onClick={() => setOpen(false)}>
            {t("Личный кабинет", "Account")}
          </Link>
        )}
        {isAdmin && (
          <Link to="/admin/cms" onClick={() => setOpen(false)}>
            {t("Управление сайтом", "Site CMS")}
          </Link>
        )}
      </nav>

      <div className="masthead-strip">
        <span className="masthead-tag">
          {t("Фамильные книги · с 2024", "Family Books · Est. 2024")}
        </span>
        <span className="masthead-tag masthead-tag--r">
          {t("Полностью под ключ", "Fully managed")}
        </span>
      </div>
    </>
  );
}
