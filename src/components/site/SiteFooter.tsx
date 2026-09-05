import { Link } from "@tanstack/react-router";

import { Logo } from "./Logo";
import { useI18n } from "@/lib/i18n";

/** Общий футер сайта. */
export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-logo-wrap">
          <Logo size={28} />
          <span className="footer-logo-name">Annuli</span>
        </div>
        <ul className="footer-links">
          <li>
            <Link to="/approach">{t("Подход", "Approach")}</Link>
          </li>
          <li>
            <Link to="/plans">{t("Планы", "Plans")}</Link>
          </li>
          <li>
            <Link to="/services">{t("Услуги", "Services")}</Link>
          </li>
          <li>
            <Link to="/contact">{t("Контакт", "Contact")}</Link>
          </li>
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
