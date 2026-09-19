import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { SECTION_KEYS, SECTION_TITLES, useSectionVisibility } from "@/lib/cms/site-config";

/** Управление видимостью блоков лендинга. */
export function SectionsTab() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { map, isLoading } = useSectionVisibility();
  const [draft, setDraft] = useState<Record<string, boolean>>({});

  const current = (key: string) => draft[key] ?? map[key] ?? true;
  const dirty = useMemo(
    () => SECTION_KEYS.filter((k) => draft[k] !== undefined && draft[k] !== (map[k] ?? true)),
    [draft, map],
  );

  const save = useMutation({
    mutationFn: async () => {
      if (dirty.length === 0) return;
      const rows = dirty.map((key, i) => ({
        key,
        visible: draft[key] as boolean,
        sort_order: SECTION_KEYS.indexOf(key) + i * 0,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from("site_sections").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["site-sections"] });
      setDraft({});
      toast.success(t("Видимость блоков сохранена", "Section visibility saved"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <section className="cms-sec">
      <div className="cms-sec-head">
        <div>
          <h2 className="cms-sec-title">{t("Блоки главной страницы", "Landing sections")}</h2>
          <p className="cms-sec-sub">
            {t(
              "Отключённые блоки не показываются на сайте, их ссылки скрываются в меню.",
              "Hidden sections are not rendered and their menu links disappear.",
            )}
          </p>
        </div>
        <button
          className="cms-act cms-act--primary"
          disabled={save.isPending || dirty.length === 0}
          onClick={() => save.mutate()}
        >
          {save.isPending
            ? t("Сохранение…", "Saving…")
            : `${t("Сохранить", "Save")}${dirty.length ? ` (${dirty.length})` : ""}`}
        </button>
      </div>

      {isLoading ? (
        <p className="cms-sec-sub">{t("Загрузка…", "Loading…")}</p>
      ) : (
        <div className="cms-grid">
          {SECTION_KEYS.map((key) => (
            <div className="cms-addon-bar" key={key}>
              <span className="cms-addon-idx">{key}</span>
              <span style={{ flex: 1 }}>{t(SECTION_TITLES[key].ru, SECTION_TITLES[key].en)}</span>
              <button
                className={`cms-act${current(key) ? " cms-act--primary" : ""}`}
                onClick={() => setDraft((p) => ({ ...p, [key]: !current(key) }))}
              >
                {current(key) ? t("Показывать", "Visible") : t("Скрыт", "Hidden")}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
