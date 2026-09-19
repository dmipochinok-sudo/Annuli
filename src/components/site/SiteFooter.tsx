import { Link } from "@tanstack/react-router";

import { Logo } from "./Logo";
import { useI18n } from "@/lib/i18n";
import { useSectionVisibility } from "@/lib/cms/site-config";

const LINKS = [
  { to: "/approach" as const, ru: "Подход", en: "Approach", section: "approach" },
  { to: "/plans" as const, ru: "Планы", en: "Plans", section: "plans" },
  { to: "/services" as const, ru: "Услуги", en: "Services", section: "addons" },
  { to: "/contact" as const, ru: "Контакт", en: "Contact", section: "contact" },
];

/** Общий футер сайта. */
export function SiteFooter() {
  const { t } = useI18n();
  const { isVisible } = useSectionVisibility();
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-logo-wrap">
          <Logo size={28} />
          <span className="footer-logo-name">Annuli</span>
        </div>
        <ul className="footer-links">
          {LINKS.filter((l) => isVisible(l.section)).map((l) => (
            <li key={l.to}>
              <Link to={l.to}>{t(l.ru, l.en)}</Link>
            </li>
          ))}
          <li>
            <Link to="/account">{t("Личный кабинет", "Account")}</Link>
          </li>
        </ul>
      </div>
      <p className="footer-copy">
        {t(
          "© 2026 Annuli — Издательство семейных историй",
          "© 2026 Annuli — Family History Publishers",
        )}
      </p>
    </footer>
  );
}
