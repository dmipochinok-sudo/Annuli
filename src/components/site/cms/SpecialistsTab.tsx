import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

const MAX = 6;

interface Row {
  user_id: string; full_name: string; email: string; has_card: boolean; is_visible: boolean;
  accepts_clients: boolean; featured: boolean; featured_order: number; plan: string; bases_limit: number; bases_count: number;
}

/** CMS: отбор специалистов на главную, порядок, тариф и лимит баз. */
export function SpecialistsTab() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["cms-specialists"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("staff_list_specialists");
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });
  const rows = data ?? [];
  const featured = rows.filter((r) => r.featured).sort((a, b) => a.featured_order - b.featured_order);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["cms-specialists"] });
    void qc.invalidateQueries({ queryKey: ["featured-specialists"] });
  };
  const log = (action: string, target: string, details: Record<string, unknown> = {}) =>
    supabase.rpc("log_action", { _category: "cms", _action: action, _target: target, _details: details as never });

  const patch = async (uid: string, p: Record<string, unknown>) => {
    const { error } = await supabase.from("specialist_profiles").upsert({ user_id: uid, ...p }, { onConflict: "user_id" });
    if (error) throw error;
  };

  const toggle = async (r: Row) => {
    try {
      if (!r.featured && featured.length >= MAX) { toast.error(t("На главной уже 6 карточек", "Already 6 cards on home page")); return; }
      await patch(r.user_id, { featured: !r.featured, featured_order: r.featured ? 0 : featured.length });
      void log(r.featured ? "unfeature_specialist" : "feature_specialist", r.user_id);
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= featured.length) return;
    const a = featured[i]!, b = featured[j]!;
    try {
      await patch(a.user_id, { featured_order: j });
      await patch(b.user_id, { featured_order: i });
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  const setLimits = async (r: Row, plan: string, limit: number) => {
    try {
      await patch(r.user_id, { plan, bases_limit: limit });
      void log("set_specialist_plan", r.user_id, { plan, bases_limit: limit });
      toast.success(t("Тариф сохранён", "Plan saved"));
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  if (isLoading) return <p className="cab-meta">{t("Загрузка…", "Loading…")}</p>;

  return (
    <div className="cab-list" style={{ padding: "8px 0" }}>
      <h3 className="cab-sheet-h">{t("На главной", "On home page")} · {featured.length} / {MAX}</h3>
      {featured.length === 0 && <p className="cab-meta">{t("Никто не выбран — блок на главной скрыт.", "Nobody selected — the home block is hidden.")}</p>}
      {featured.map((r, i) => (
        <div key={r.user_id} className="cab-card-head cab-card" style={{ flexDirection: "row" }}>
          <span>
            <strong>{i + 1}. {r.full_name}</strong>{" "}
            {!r.is_visible && <span className="cab-badge">{t("скрыта специалистом", "hidden by specialist")}</span>}
          </span>
          <span style={{ display: "flex", gap: 6 }}>
            <button className="btn btn--ghost" onClick={() => void move(i, -1)} disabled={i === 0}>↑</button>
            <button className="btn btn--ghost" onClick={() => void move(i, 1)} disabled={i === featured.length - 1}>↓</button>
            <button className="btn btn--ghost" onClick={() => void toggle(r)}>{t("Убрать с главной", "Remove")}</button>
          </span>
        </div>
      ))}

      <h3 className="cab-sheet-h" style={{ marginTop: 16 }}>{t("Все специалисты", "All specialists")}</h3>
      {rows.length === 0 && <p className="cab-meta">{t("Специалистов пока нет.", "No specialists yet.")}</p>}
      {rows.map((r) => (
        <div key={r.user_id} className="cab-card">
          <div className="cab-card-head">
            <span><strong>{r.full_name}</strong> <span className="cab-meta">{r.email}</span></span>
            <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className={`cab-badge${r.is_visible ? " cab-badge--done" : ""}`}>{r.has_card ? (r.is_visible ? t("Видима", "Visible") : t("Скрыта", "Hidden")) : t("Карточка не заполнена", "No card")}</span>
              <span className={`cab-badge${r.accepts_clients ? " cab-badge--done" : ""}`}>{r.accepts_clients ? t("Принимает клиентов", "Accepting") : t("Не принимает", "Not accepting")}</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button className={`btn ${r.featured ? "btn--ghost" : "btn--primary"}`} onClick={() => void toggle(r)}>
              {r.featured ? t("Убрать с главной", "Remove from home") : t("Добавить на главную", "Add to home")}
            </button>
            <PlanEditor row={r} onSave={setLimits} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanEditor({ row, onSave }: { row: Row; onSave: (r: Row, plan: string, limit: number) => void }) {
  const { t } = useI18n();
  return (
    <form
      style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSave(row, String(fd.get("plan") || "free"), Math.max(0, Number(fd.get("limit")) || 0));
      }}
    >
      <span className="cab-meta">{t("Тариф", "Plan")}</span>
      <input name="plan" className="form-inp" style={{ width: 90 }} defaultValue={row.plan} />
      <span className="cab-meta">{t("Баз", "DBs")} {row.bases_count} /</span>
      <input name="limit" type="number" min={0} className="form-inp" style={{ width: 70 }} defaultValue={row.bases_limit} />
      <button className="btn btn--ghost" type="submit">{t("Сохранить", "Save")}</button>
    </form>
  );
}
