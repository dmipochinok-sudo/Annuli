import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

interface AuditRow {
  id: string;
  created_at: string;
  category: string;
  action: string;
  actor_email: string;
  target_email: string;
  details: Record<string, unknown>;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: "", label: "Все категории" },
  { id: "roles", label: "Роли" },
  { id: "users", label: "Учётные записи" },
  { id: "leads", label: "Заявки" },
  { id: "cms", label: "Контент сайта" },
];

const ACTION_LABELS: Record<string, string> = {
  grant_admin: "Назначение администратора",
  revoke_admin: "Снятие администратора",
  grant_owner: "Назначение владельца",
  revoke_owner: "Снятие владельца",
  set_product_role: "Смена продуктовой роли",
  create_user: "Создание учётной записи",
  delete_user: "Удаление учётной записи",
  block_user: "Блокировка учётной записи",
  unblock_user: "Разблокировка учётной записи",
};

const PAGE_SIZE = 50;

const btn =
  "h-8 rounded-lg border border-border bg-surface-dark px-3 text-[12px] font-medium text-foreground transition hover:border-stroke-bright disabled:opacity-50";
const inputCls =
  "h-9 rounded-lg border border-border bg-surface-dark px-3 text-[13px] text-foreground outline-none transition focus:border-stroke-bright";

function formatDetails(details: Record<string, unknown>): string {
  const entries = Object.entries(details ?? {});
  if (entries.length === 0) return "—";
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(", ");
}

function toCsv(rows: AuditRow[]): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = ["date", "category", "action", "actor_email", "target_email", "details"];
  const lines = rows.map((r) =>
    [
      esc(new Date(r.created_at).toISOString()),
      esc(r.category),
      esc(r.action),
      esc(r.actor_email),
      esc(r.target_email),
      esc(JSON.stringify(r.details)),
    ].join(","),
  );
  return "﻿" + [header.join(","), ...lines].join("\n");
}

/** Вкладка «Журнал» в CMS: системный аудит действий с фильтром и экспортом CSV. */
export function JournalTab() {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", category, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_audit_logs", {
        _limit: PAGE_SIZE,
        _offset: page * PAGE_SIZE,
        _category: category || undefined,
      });
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });

  const rows = (data ?? []).filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return r.actor_email.toLowerCase().includes(q) || r.target_email.toLowerCase().includes(q);
  });

  const exportCsv = async () => {
    const { data, error } = await supabase.rpc("list_audit_logs", {
      _limit: 500,
      _offset: 0,
      _category: category || undefined,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    const blob = new Blob([toCsv((data ?? []) as AuditRow[])], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annuli-journal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Журнал экспортирован в CSV");
  };

  return (
    <div className="cms-journal">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          className={inputCls}
          aria-label="Категория"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(0);
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          className={inputCls + " min-w-[220px] flex-1"}
          placeholder="Поиск по email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className={btn} onClick={exportCsv}>
          Экспорт .CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-light">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Дата и время</th>
              <th className="px-4 py-3 font-medium">Кто</th>
              <th className="px-4 py-3 font-medium">Действие</th>
              <th className="px-4 py-3 font-medium">Кого касается</th>
              <th className="px-4 py-3 font-medium">Детали</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Загрузка…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Записей пока нет
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("ru-RU")}
                  </td>
                  <td className="px-4 py-3 text-foreground">{r.actor_email || "—"}</td>
                  <td className="px-4 py-3 text-foreground">
                    {ACTION_LABELS[r.action] ?? r.action}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.target_email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDetails(r.details)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button className={btn} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          ← Новее
        </button>
        <span className="text-[12px] text-muted-foreground">Страница {page + 1}</span>
        <button
          className={btn}
          disabled={(data ?? []).length < PAGE_SIZE}
          onClick={() => setPage((p) => p + 1)}
        >
          Старее →
        </button>
      </div>
    </div>
  );
}
