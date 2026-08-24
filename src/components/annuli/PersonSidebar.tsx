import { useMemo, useState } from "react";

import { compareGenerations, compareIndex, fullName, initials, lifeDates } from "@/lib/annuli/format";
import type { Person } from "@/lib/annuli/types";
import { cn } from "@/lib/utils";

interface Props {
  persons: Person[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  
  className?: string;
  query?: string;
  onQueryChange?: (v: string) => void;
}

export function PersonSidebar({
  persons,
  selectedId,
  onSelect,
  className,
  query: queryProp,
  onQueryChange,
}: Props) {
  const [ownQuery, setOwnQuery] = useState("");
  const query = queryProp ?? ownQuery;
  const setQuery = onQueryChange ?? setOwnQuery;
  const [gen, setGen] = useState("");
  const [gender, setGender] = useState("");
  const [showLateral, setShowLateral] = useState(true);

  const generations = useMemo(
    () =>
      [...new Set(persons.map((p) => p.generation).filter(Boolean))].sort((a, b) =>
        compareGenerations(a, b),
      ),
    [persons],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return persons
      .filter((p) => {
        if (!showLateral && p.isLateral) return false;
        if (gen && p.generation !== gen) return false;
        if (gender && p.gender !== gender) return false;
        if (q) {
          const s = `${fullName(p)} ${p.personIndex} ${p.estate}`.toLowerCase();
          if (!s.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => compareIndex(a.personIndex, b.personIndex));
  }, [persons, query, gen, gender, showLateral]);

  return (
    <aside
      className={cn(
        "flex w-full min-w-0 shrink-0 flex-col border-border bg-sidebar md:w-[280px] md:border-r",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border p-3">
        <label className="flex flex-col gap-1">
          <span className="pl-2 text-[11px] text-muted-foreground">Поколение</span>
          <select
            value={gen}
            onChange={(ev) => setGen(ev.target.value)}
            className="h-8 rounded-lg border border-border bg-surface-light px-2.5 text-[14px] text-foreground outline-none focus:border-stroke-bright"
          >
            <option value="">Все</option>
            {generations.map((g) => (
              <option key={g} value={g}>
                {g}-е поколение
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="pl-2 text-[11px] text-muted-foreground">Пол</span>
          <select
            value={gender}
            onChange={(ev) => setGender(ev.target.value)}
            className="h-8 rounded-lg border border-border bg-surface-light px-2.5 text-[14px] text-foreground outline-none focus:border-stroke-bright"
          >
            <option value="">Любой</option>
            <option value="М">Мужской</option>
            <option value="Ж">Женский</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="pl-2 text-[11px] text-muted-foreground">Ветви</span>
          <select
            value={showLateral ? "all" : "direct"}
            onChange={(ev) => setShowLateral(ev.target.value === "all")}
            className="h-8 rounded-lg border border-border bg-surface-light px-2.5 text-[14px] text-foreground outline-none focus:border-stroke-bright"
          >
            <option value="all">Все ветви</option>
            <option value="direct">Только прямые ветви</option>
          </select>
        </label>
        {queryProp === undefined && (
          <input
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            placeholder="Поиск по имени или индексу…"
            className="h-8 rounded-lg border border-border bg-surface-dark px-2.5 text-[14px] outline-none focus:border-stroke-bright"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        {rows.length === 0 ? (
          <div className="p-4 text-center text-[12px] text-muted-foreground">Нет персон</div>
        ) : (
          rows.map((p) => {
            const dates = lifeDates(p);
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={cn(
                  "mb-1 flex w-full items-center gap-2.5 rounded-lg border border-transparent bg-card px-3 py-2 text-left transition hover:border-border",
                  selectedId === p.id && "border-primary ring-2 ring-primary/15",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-[12px] font-bold text-accent-foreground">
                  {p.avatarThumb ? (
                    <img src={p.avatarThumb} alt="" className="size-full object-cover" />
                  ) : (
                    initials(p)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] text-muted-foreground">
                    {p.personIndex || "—"}
                  </span>
                  <span className="block truncate text-[13px] font-semibold text-foreground">
                    {fullName(p) || "Без имени"}
                  </span>
                  {dates && (
                    <span className="block text-[11px] text-muted-foreground">{dates}</span>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        Всего персон: {persons.length}
      </div>
    </aside>
  );
}
