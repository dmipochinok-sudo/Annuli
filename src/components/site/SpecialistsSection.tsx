import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { isCloudConfigured } from "@/lib/cloud-availability";
import { useI18n } from "@/lib/i18n";
import { SecHead } from "@/components/site/sections";

export interface PublicRate {
  kind: string; name_ru: string; name_en: string; price_ru: string; price_en: string; term_ru: string; term_en: string;
}
export interface PublicReview { client_name: string; body: string; reply: string; created_at: string }
export interface PublicSpecialist {
  user_id: string; full_name: string; avatar_url: string;
  specialization_ru: string; specialization_en: string; about_ru: string; about_en: string;
  regions_ru: string; regions_en: string; archives_ru: string; archives_en: string;
  activities_ru: string; activities_en: string; accepts_clients: boolean; featured_order: number;
  rates: PublicRate[]; reviews: PublicReview[];
}

export function useFeaturedSpecialists() {
  return useQuery({
    queryKey: ["featured-specialists"],
    enabled: isCloudConfigured(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_featured_specialists");
      if (error) throw error;
      return (data ?? []) as unknown as PublicSpecialist[];
    },
  });
}

/** Блок «Специалисты» на главной: до 6 карточек, отобранных в CMS. */
export function SpecialistsSection() {
  const { t, lang } = useI18n();
  const { data } = useFeaturedSpecialists();
  const [open, setOpen] = useState<PublicSpecialist | null>(null);
  if (!data || data.length === 0) return null;
  const L = (s: PublicSpecialist, k: "specialization" | "archives") => (lang === "en" ? s[`${k}_en`] || s[`${k}_ru`] : s[`${k}_ru`]);
  return (
    <section className="specs" id="specialists">
      <SecHead title={t("Специалисты", "Specialists")} sub={t("Генеалогические исследования", "Genealogy research")} />
      <div className="specs-grid">
        {data.slice(0, 6).map((s) => (
          <button key={s.user_id} className="spec-card" onClick={() => setOpen(s)}>
            {s.avatar_url && <img src={s.avatar_url} alt={s.full_name} className="spec-ava" loading="lazy" />}
            <span className="spec-kicker">{t("Специалист по генеалогии", "Genealogy specialist")}</span>
            <span className="spec-name">{s.full_name}</span>
            <span className="spec-desc">{L(s, "specialization")}</span>
            {L(s, "archives") && <span className="spec-arch">{L(s, "archives")}</span>}
            <span className="spec-link">{t("Перейти в профиль →", "View profile →")}</span>
          </button>
        ))}
      </div>
      {open && <SpecialistDialog s={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

export function SpecialistDialog({ s, onClose }: { s: PublicSpecialist; onClose: () => void }) {
  const { t, lang } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  const L = (ru: string, en: string) => (lang === "en" ? en || ru : ru);
  const data: [string, string][] = [
    [t("Специализация", "Specialization"), L(s.specialization_ru, s.specialization_en)],
    [t("Регионы работы", "Regions"), L(s.regions_ru, s.regions_en)],
    [t("Архивные учреждения", "Archives"), L(s.archives_ru, s.archives_en)],
    [t("Виды деятельности", "Activities"), L(s.activities_ru, s.activities_en)],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <div className="spec-overlay" role="dialog" aria-modal="true" aria-label={s.full_name} onClick={onClose}>
      <div className="spec-modal" onClick={(e) => e.stopPropagation()}>
        <div className="spec-modal-head">
          <span className="spec-kicker">{t("Специалист по генеалогии", "Genealogy specialist")}</span>
          <button className="spec-close" onClick={onClose} aria-label={t("Закрыть", "Close")}>✕</button>
        </div>
        <div className="spec-modal-hero">
          {s.avatar_url && <img src={s.avatar_url} alt={s.full_name} />}
          <h3>{s.full_name}</h3>
        </div>
        {!s.accepts_clients && <p className="spec-muted">{t("Сейчас не принимает новых клиентов", "Not accepting new clients right now")}</p>}
        {L(s.about_ru, s.about_en) && (<><div className="spec-h">{t("О себе", "About")}</div><p className="spec-muted">{L(s.about_ru, s.about_en)}</p></>)}
        {data.length > 0 && (
          <>
            <div className="spec-h">{t("Данные", "Details")}</div>
            {data.map(([k, v]) => (<div className="spec-row" key={k}><span>{k}</span><strong>{v}</strong></div>))}
          </>
        )}
        {s.rates.length > 0 && (
          <>
            <div className="spec-h">{t("Тарифы", "Rates")}</div>
            {s.rates.map((r, i) => (
              <div className="spec-row" key={i}>
                <span>{[L(r.name_ru, r.name_en), L(r.term_ru, r.term_en)].filter(Boolean).join(" · ")}</span>
                <strong>{L(r.price_ru, r.price_en)}</strong>
              </div>
            ))}
          </>
        )}
        <div className="spec-h">{t("Отзывы", "Reviews")}</div>
        {s.reviews.length === 0 ? (
          <p className="spec-muted">{t("Отзывов пока нет.", "No reviews yet.")}</p>
        ) : (
          s.reviews.map((r, i) => (
            <div className="spec-review" key={i}>
              <strong>{r.client_name}</strong>
              <p className="spec-muted">{r.body}</p>
              {r.reply && <p className="spec-reply">{r.reply}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
