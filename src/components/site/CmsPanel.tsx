import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import {
  CONTENT_FIELDS,
  DEFAULTS,
  FIELD_GROUPS,
  type Pair,
  type SiteContent,
} from "@/lib/cms/content";

interface Props {
  content: SiteContent;
  onClose: () => void;
  onSiteHome: () => void;
}

/** Чистовое значение поля (override или дефолт). */
function fieldValue(overrides: Record<string, Pair>, key: string): Pair {
  return overrides[key] ?? DEFAULTS[key] ?? { ru: "", en: "" };
}

/** Редактор содержимого главной страницы. */
export function CmsPanel({ content, onClose, onSiteHome }: Props) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, Pair>>(() =>
    Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, fieldValue(content.overrides, f.key)])),
  );
  const [openGroup, setOpenGroup] = useState<string>("hero");

  const dirtyKeys = useMemo(
    () =>
      CONTENT_FIELDS.filter((f) => {
        const cur = fieldValue(content.overrides, f.key);
        const d = draft[f.key];
        return d && (d.ru !== cur.ru || d.en !== cur.en);
      }),
    [draft, content.overrides],
  );
  const dirtyCount = dirtyKeys.length;

  const setField = (key: string, lang: "ru" | "en", value: string) =>
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], [lang]: value } }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rows = dirtyKeys.map((f) => ({
        key: f.key,
        ru: draft[f.key].ru,
        en: draft[f.key].en,
      }));
      if (rows.length === 0) return;
      const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["site-content"] });
      content.refetch();
      toast.success(t("Контент сохранён", "Content saved"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_content").delete().neq("key", "");
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["site-content"] });
      setDraft(
        Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, { ...DEFAULTS[f.key] }])),
      );
      toast.success(t("Контент сброшен к исходному", "Content reset to defaults"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <div className="cms-panel">
      <header className="cms-head">
        <div>
          <h1 className="cms-title">{t("Управление сайтом", "Site CMS")}</h1>
          <p className="cms-sub">
            {t(
              "Тексты главной страницы. Изменения видны всем посетителям после сохранения.",
              "Homepage texts. Changes are visible to all visitors after saving.",
            )}
          </p>
        </div>
        <div className="cms-head-actions">
          <button
            className="cms-btn cms-btn--ghost"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
          >
            {t("Сбросить", "Reset")}
          </button>
          <button
            className="cms-btn cms-btn--ghost"
            onClick={onSiteHome}
          >
            {t("На сайт", "View site")}
          </button>
          <button
            className="cms-btn cms-btn--primary"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || dirtyCount === 0}
          >
            {saveMutation.isPending
              ? t("Сохранение…", "Saving…")
              : `${t("Сохранить", "Save")}${dirtyCount ? ` (${dirtyCount})` : ""}`}
          </button>
          <button className="cms-close" aria-label={t("Закрыть", "Close")} onClick={onClose}>
            ✕
          </button>
        </div>
      </header>

      <div className="cms-groups">
        {FIELD_GROUPS.map((g) => {
          const fields = CONTENT_FIELDS.filter((f) => f.group === g.id);
          if (fields.length === 0) return null;
          const open = openGroup === g.id;
          return (
            <section className="cms-group" key={g.id}>
              <button
                className="cms-group-head"
                onClick={() => setOpenGroup(open ? "" : g.id)}
                aria-expanded={open}
              >
                <span className="cms-group-title">{t(g.ru, g.en)}</span>
                <span className="cms-group-count">{fields.length}</span>
                <span className="cms-group-chev">{open ? "–" : "+"}</span>
              </button>
              {open && (
                <div className="cms-fields">
                  {fields.map((f) => (
                    <div className="cms-field" key={f.key}>
                      <label className="cms-field-lbl" title={f.key}>
                        {f.label}
                      </label>
                      <div className="cms-field-inputs">
                        <input
                          className="cms-inp"
                          value={draft[f.key]?.ru ?? ""}
                          onChange={(e) => setField(f.key, "ru", e.target.value)}
                          placeholder="RU"
                        />
                        {f.multiline ? (
                          <textarea
                            className="cms-inp cms-inp--area"
                            value={draft[f.key]?.en ?? ""}
                            onChange={(e) => setField(f.key, "en", e.target.value)}
                            placeholder="EN"
                            rows={3}
                          />
                        ) : (
                          <input
                            className="cms-inp"
                            value={draft[f.key]?.en ?? ""}
                            onChange={(e) => setField(f.key, "en", e.target.value)}
                            placeholder="EN"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
