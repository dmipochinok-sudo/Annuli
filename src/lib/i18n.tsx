import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ru" | "en";

const LANG_KEY = "annuli-lang";
const THEME_KEY = "annuli-theme";

/** Применяет тему одновременно через класс .dark и атрибут data-theme
 *  (синонимы, чтобы дизайн-система v2 работала с обоих механизмов). */
function applyTheme(next: "light" | "dark") {
  const el = document.documentElement;
  el.classList.toggle("dark", next === "dark");
  el.setAttribute("data-theme", next);
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Выбор строки по текущему языку. */
  t: (ru: string, en: string) => string;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const I18nContext = createContext<I18nValue | null>(null);

/** Провайдер языка и темы для всего сайта (лэндинг, кабинет, приложение). */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY);
    if (savedLang === "en" || savedLang === "ru") setLangState(savedLang);
    const savedTheme = localStorage.getItem(THEME_KEY);
    const next = savedTheme === "dark" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
    document.documentElement.setAttribute("lang", l);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (ru: string, en: string) => (lang === "en" ? en : ru),
      theme,
      toggleTheme,
    }),
    [lang, setLang, theme, toggleTheme],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Доступ к языку и теме. Работает и вне провайдера (запасной русский). */
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  return {
    lang: "ru",
    setLang: () => {},
    t: (ru: string) => ru,
    theme: "light",
    toggleTheme: () => {},
  };
}
