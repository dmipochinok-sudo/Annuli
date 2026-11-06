import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useSiteAddons, type AddonRow } from "@/lib/cms/site-config";

type Draft = AddonRow & { isNew?: boolean };

const emptyAddon = (sort: number): Draft => ({
  id: crypto.randomUUID(),
  sort_order: sort,
  code: String(sort + 1).padStart(2, "0"),
  name_ru: "",
  name_en: "",
  desc_ru: "",
  desc_en: "",
  price_ru: "",
  price_en: "",
  note_ru: "",
  note_en: "",
  is_visible: true,
  isNew: true,
});

/** Редактор дополнительных услуг. */
export function AddonsTab() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data, isLoading } = useSiteAddons();
  const [rows, setRows] = useState<Draft[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);

  useEffect(() => {
    if (data) setRows(data.map((r) => ({ ...r })));
  }, [data]);

  const dirtyCount = useMemo(() => {
    const original = new Map((data ?? []).map((r) => [r.id, JSON.stringify(r)]));
    let n = removed.length;
    for (const r of rows) {
      const { isNew: _isNew, ...clean } = r;
      if (r.isNew || original.get(r.id) !== JSON.stringify(clean)) n += 1;
    }
    return n;
  }, [rows, data, removed]);

  const patch = (id: string, p: Partial<Draft>) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const move = (index: number, dir: -1 | 1) =>
    setRows((list) => {
      const next = [...list];
      const to = index + dir;
      if (to < 0 || to >= next.length) return list;
      const a = next[index]!;
      const b = next[to]!;
      next[index] = b;
      next[to] = a;
      return next.map((r, i) => ({ ...r, sort_order: i }));
    });

  const remove = (row: Draft) => {
    if (!window.confirm(t("Удалить дополнение?", "Delete this add-on?"))) return;
    setRows((list) => list.filter((r) => r.id !== row.id));
    if (!row.isNew) setRemoved((list) => [...list, row.id]);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (removed.length > 0) {
        const { error } = await supabase.from("site_addons").delete().in("id", removed);
        if (error) throw error;
      }
      const payload = rows.map((r, i) => {
        const { isNew: _isNew, ...clean } = r;
        return { ...clean, sort_order: i, updated_at: new Date().toISOString() };
      });
      if (payload.length > 0) {
        const { error } = await supabase.from("site_addons").upsert(payload, { onConflict: "id" });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      setRemoved([]);
      await queryClient.invalidateQueries({ queryKey: ["site-addons"] });
      toast.success(t("Дополнения сохранены", "Add-ons saved"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <section className="cms-sec">
      <div className="cms-sec-head">
        <div>
          <h2 className="cms-sec-title">{t("Дополнительные услуги", "Add-on services")}</h2>
          <p className="cms-sec-sub">
            {t(
              "Если список пуст, на сайте показываются исходные дополнения из раздела «Тексты».",
              "When the list is empty, the site shows the default add-ons from the Texts tab.",
            )}
          </p>
        </div>
        <div className="cms-img-actions">
          <button
            className="cms-act"
            onClick={() => setRows((list) => [...list, emptyAddon(list.length)])}
          >
            {t("Добавить", "Add")}
          </button>
          <button
            className="cms-act cms-act--primary"
            disabled={save.isPending || dirtyCount === 0}
            onClick={() => save.mutate()}
          >
            {save.isPending
              ? t("Сохранение…", "Saving…")
              : `${t("Сохранить", "Save")}${dirtyCount ? ` (${dirtyCount})` : ""}`}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="cms-sec-sub">{t("Загрузка…", "Loading…")}</p>
      ) : (
        rows.map((r, i) => (
          <div className="cms-addon" key={r.id}>
            <div className="cms-addon-bar">
              <span className="cms-addon-idx">{r.code || String(i + 1).padStart(2, "0")}</span>
              <span style={{ flex: 1 }}>{r.name_ru || t("Без названия", "Untitled")}</span>
              <div className="cms-addon-ctl">
                <button className="cms-act" onClick={() => move(i, -1)} aria-label="up">
                  ↑
                </button>
                <button className="cms-act" onClick={() => move(i, 1)} aria-label="down">
                  ↓
                </button>
                <button
                  className={`cms-act${r.is_visible ? " cms-act--primary" : ""}`}
                  onClick={() => patch(r.id, { is_visible: !r.is_visible })}
                >
                  {r.is_visible ? t("Показывать", "Visible") : t("Скрыт", "Hidden")}
                </button>
                <button className="cms-act cms-act--danger" onClick={() => remove(r)}>
                  {t("Удалить", "Delete")}
                </button>
              </div>
            </div>
            <div className="cms-addrow">
              <input
                className="cms-inp"
                value={r.code}
                placeholder={t("Код", "Code")}
                onChange={(e) => patch(r.id, { code: e.target.value })}
              />
              <input
                className="cms-inp"
                value={r.name_ru}
                placeholder={t("Название RU", "Name RU")}
                onChange={(e) => patch(r.id, { name_ru: e.target.value })}
              />
              <input
                className="cms-inp"
                value={r.name_en}
                placeholder="Name EN"
                onChange={(e) => patch(r.id, { name_en: e.target.value })}
              />
            </div>
            <div className="cms-addrow">
              <textarea
                className="cms-ta"
                value={r.desc_ru}
                placeholder={t("Описание RU", "Description RU")}
                onChange={(e) => patch(r.id, { desc_ru: e.target.value })}
              />
              <textarea
                className="cms-ta"
                value={r.desc_en}
                placeholder="Description EN"
                onChange={(e) => patch(r.id, { desc_en: e.target.value })}
              />
            </div>
            <div className="cms-addrow">
              <input
                className="cms-inp"
                value={r.price_ru}
                placeholder={t("Цена RU", "Price RU")}
                onChange={(e) => patch(r.id, { price_ru: e.target.value })}
              />
              <input
                className="cms-inp"
                value={r.price_en}
                placeholder="Price EN"
                onChange={(e) => patch(r.id, { price_en: e.target.value })}
              />
              <input
                className="cms-inp"
                value={r.note_ru}
                placeholder={t("Примечание RU", "Note RU")}
                onChange={(e) => patch(r.id, { note_ru: e.target.value })}
              />
              <input
                className="cms-inp"
                value={r.note_en}
                placeholder="Note EN"
                onChange={(e) => patch(r.id, { note_en: e.target.value })}
              />
            </div>
          </div>
        ))
      )}
    </section>
  );
}
