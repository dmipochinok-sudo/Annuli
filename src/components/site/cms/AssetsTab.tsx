import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import heroAsset from "@/assets/annuli-hero.jpg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useSiteAssets } from "@/lib/cms/site-config";

const SLOTS = [
  { key: "hero_image", ru: "Фото героя", en: "Hero photo", path: "hero-image" },
  { key: "logo_image", ru: "Логотип", en: "Logo", path: "logo-image" },
] as const;

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type Draft = { url: string; alt_ru: string; alt_en: string };

/** Управление изображениями сайта (загрузка файла в публичное хранилище). */
export function AssetsTab() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { assets, isLoading } = useSiteAssets();
  const [draft, setDraft] = useState<Record<string, Draft>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const value = (key: string): Draft =>
    draft[key] ?? {
      url: assets[key]?.url ?? "",
      alt_ru: assets[key]?.alt_ru ?? "",
      alt_en: assets[key]?.alt_en ?? "",
    };

  const set = (key: string, patch: Partial<Draft>) =>
    setDraft((p) => ({ ...p, [key]: { ...value(key), ...patch } }));

  const persist = async (key: string, row: Draft) => {
    const { error } = await supabase
      .from("site_assets")
      .upsert(
        [
          {
            key,
            url: row.url.trim(),
            alt_ru: row.alt_ru,
            alt_en: row.alt_en,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "key" },
      );
    if (error) throw error;
  };

  const upload = useMutation({
    mutationFn: async ({ key, path, file }: { key: string; path: string; file: File }) => {
      const ext = ALLOWED[file.type] ?? "img";
      const objectPath = `${path}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("site-assets")
        .upload(objectPath, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("site-assets").getPublicUrl(objectPath);
      const url = data.publicUrl;
      const v = value(key);
      await persist(key, { url, alt_ru: v.alt_ru, alt_en: v.alt_en });
      return { key, url };
    },
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ["site-assets"] });
      setDraft((p) => ({ ...p, [res.key]: { ...value(res.key), url: res.url } }));
      toast.success(t("Изображение загружено", "Image uploaded"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
    onSettled: () => setUploadingKey(null),
  });

  const save = useMutation({
    mutationFn: async (key: string) => {
      await persist(key, value(key));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["site-assets"] });
      setDraft({});
      toast.success(t("Подписи сохранены", "Captions saved"));
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

  const onPickFile = (slot: (typeof SLOTS)[number]) => {
    fileInputs.current[slot.key]?.click();
  };

  const onFileChosen = (slot: (typeof SLOTS)[number], e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!(file.type in ALLOWED)) {
      toast.error(t("Допустимы только PNG, JPEG и WebP", "Only PNG, JPEG and WebP are allowed"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("Файл больше 5 МБ", "File exceeds 5 MB"));
      return;
    }
    setUploadingKey(slot.key);
    upload.mutate({ key: slot.key, path: slot.path, file });
  };

  return (
    <section className="cms-sec">
      <div className="cms-sec-head">
        <div>
          <h2 className="cms-sec-title">{t("Изображения сайта", "Site images")}</h2>
          <p className="cms-sec-sub">
            {t(
              "Загрузите изображение с компьютера (PNG, JPEG или WebP до 5 МБ). «Сбросить» возвращает исходное изображение.",
              "Upload an image from your computer (PNG, JPEG or WebP up to 5 MB). Reset restores the default image.",
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
          const busy = uploadingKey === slot.key;
          const saved = assets[slot.key];
          const altDirty =
            (draft[slot.key]?.alt_ru ?? saved?.alt_ru ?? "") !== (saved?.alt_ru ?? "") ||
            (draft[slot.key]?.alt_en ?? saved?.alt_en ?? "") !== (saved?.alt_en ?? "");
          return (
            <div className="cms-img" key={slot.key}>
              <input
                ref={(el) => {
                  fileInputs.current[slot.key] = el;
                }}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="cms-file"
                onChange={(e) => onFileChosen(slot, e)}
              />
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
                  <div className="cms-img-actions">
                    <button
                      className="cms-act cms-act--primary"
                      disabled={busy}
                      onClick={() => onPickFile(slot)}
                    >
                      {busy ? t("Загрузка…", "Uploading…") : t("Загрузить", "Upload")}
                    </button>
                    <button
                      className="cms-act"
                      disabled={save.isPending || !altDirty}
                      onClick={() => save.mutate(slot.key)}
                    >
                      {t("Сохранить подписи", "Save captions")}
                    </button>
                    <button
                      className="cms-act cms-act--danger"
                      disabled={reset.isPending || busy}
                      onClick={() => reset.mutate(slot.key)}
                    >
                      {t("Сбросить", "Reset")}
                    </button>
                  </div>
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
                <span className="cms-img-note">
                  {v.url.trim()
                    ? t("Загруженное изображение активно", "Uploaded image is active")
                    : t("Используется исходное изображение", "Using default image")}
                </span>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
