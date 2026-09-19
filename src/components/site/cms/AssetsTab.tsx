import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import heroAsset from "@/assets/annuli-hero.jpg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useSiteAssets } from "@/lib/cms/site-config";

const SLOTS = [
  { key: "hero_image", ru: "Фото героя", en: "Hero photo" },
  { key: "logo_image", ru: "Логотип", en: "Logo" },
];

/** Управление изображениями сайта (ссылка на изображение). */
export function AssetsTab() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { assets, isLoading } = useSiteAssets();
  const [draft, setDraft] = useState<Record<string, { url: string; alt_ru: string; alt_en: string }>>(
    {},
  );

  const value = (key: string) =>
    draft[key] ?? {
      url: assets[key]?.url ?? "",
      alt_ru: assets[key]?.alt_ru ?? "",
      alt_en: assets[key]?.alt_en ?? "",
    };

  const set = (key: string, patch: Partial<{ url: string; alt_ru: string; alt_en: string }>) =>
    setDraft((p) => ({ ...p, [key]: { ...value(key), ...patch } }));

  const save = useMutation({
    mutationFn: async (key: string) => {
      const v = value(key);
      const { error } = await supabase
        .from("site_assets")
        .upsert(
          [{ key, url: v.url.trim(), alt_ru: v.alt_ru, alt_en: v.alt_en, updated_at: new Date().toISOString() }],
          { onConflict: "key" },
        );
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["site-assets"] });
      setDraft({});
      toast.success(t("Изображение сохранено", "Image saved"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const reset = useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase.from("site_assets").delete().eq("key", key);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["site-assets"] });
      setDraft({});
      toast.success(t("Изображение сброшено к исходному", "Image reset to default"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <section className="cms-sec">
      <div className="cms-sec-head">
        <div>
          <h2 className="cms-sec-title">{t("Изображения сайта", "Site images")}</h2>
          <p className="cms-sec-sub">
            {t(
              "Укажите прямую ссылку на изображение (PNG, JPEG или WebP). Пустое поле — используется исходное изображение.",
              "Paste a direct image link (PNG, JPEG or WebP). Empty field falls back to the default image.",
            )}
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="cms-sec-sub">{t("Загрузка…", "Loading…")}</p>
      ) : (
        SLOTS.map((slot) => {
          const v = value(slot.key);
          const preview = v.url.trim() || (slot.key === "hero_image" ? heroAsset.url : "");
          return (
            <div className="cms-img" key={slot.key}>
              {preview ? (
                <img
                  className={`cms-img-prev${slot.key === "logo_image" ? " cms-img-prev--logo" : ""}`}
                  src={preview}
                  alt=""
                />
              ) : (
                <div className="cms-img-prev is-empty" />
              )}
              <div className="cms-img-meta">
                <div className="cms-field">
                  <label className="cms-langtag">{t(slot.ru, slot.en)}</label>
                  <input
                    className="cms-inp"
                    value={v.url}
                    placeholder="https://…"
                    onChange={(e) => set(slot.key, { url: e.target.value })}
                  />
                </div>
                <div className="cms-langrow">
                  <input
                    className="cms-inp"
                    value={v.alt_ru}
                    placeholder={t("Описание RU", "Alt RU")}
                    onChange={(e) => set(slot.key, { alt_ru: e.target.value })}
                  />
                  <input
                    className="cms-inp"
                    value={v.alt_en}
                    placeholder="Alt EN"
                    onChange={(e) => set(slot.key, { alt_en: e.target.value })}
                  />
                </div>
                <div className="cms-img-actions">
                  <button
                    className="cms-act cms-act--primary"
                    disabled={save.isPending}
                    onClick={() => save.mutate(slot.key)}
                  >
                    {t("Сохранить", "Save")}
                  </button>
                  <button
                    className="cms-act cms-act--danger"
                    disabled={reset.isPending}
                    onClick={() => reset.mutate(slot.key)}
                  >
                    {t("Сбросить", "Reset")}
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
