import { useMemo, useState } from "react";

import { compareGenerations, compareIndex, fullName, initials, lifeDates } from "@/lib/annuli/format";
import type { Person } from "@/lib/annuli/types";
import { cn } from "@/lib/utils";

interface Props {
  persons: Person[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  className?: string;
  query?: string;
  onQueryChange?: (v: string) => void;
}

export function PersonSidebar({
  persons,
  selectedId,
  onSelect,
  onNew,
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
        "flex w-full min-w-0 shrink-0 flex-col border-border bg-sidebar md:w-[300px] md:border-r",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border bg-background p-5">
        <h2 className="eyebrow">Параметры поиска</h2>
        <label className="flex flex-col gap-1.5">
          <span className="label-ui">Поколение</span>
          <select
            value={gen}
            onChange={(ev) => setGen(ev.target.value)}
            className="h-8 rounded-sm border border-border bg-surface-light px-2 font-ui text-[12px] text-foreground outline-none transition focus:border-stroke-bright"
          >
            <option value="">Все</option>
            {generations.map((g) => (
              <option key={g} value={g}>
                {g}-е поколение
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="label-ui">Пол</span>
            <select
              value={gender}
              onChange={(ev) => setGender(ev.target.value)}
              className="h-8 rounded-sm border border-border bg-surface-light px-2 font-ui text-[12px] text-foreground outline-none transition focus:border-stroke-bright"
            >
              <option value="">Любой</option>
              <option value="М">Мужской</option>
              <option value="Ж">Женский</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label-ui">Ветви</span>
            <select
              value={showLateral ? "all" : "direct"}
              onChange={(ev) => setShowLateral(ev.target.value === "all")}
              className="h-8 rounded-sm border border-border bg-surface-light px-2 font-ui text-[12px] text-foreground outline-none transition focus:border-stroke-bright"
            >
              <option value="all">Все ветви</option>
              <option value="direct">Только прямые</option>
            </select>
          </label>
        </div>
        {queryProp === undefined && (
          <input
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            placeholder="Поиск по имени или индексу…"
            className="h-8 rounded-sm border border-border bg-surface-dark px-2 font-ui text-[12px] outline-none transition focus:border-stroke-bright"
          />
        )}
        <button
          onClick={onNew}
          className="mt-1 rounded-sm border border-primary px-3 py-2 font-ui text-[10px] uppercase tracking-[0.2em] text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          + Новая персона
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pt-4">
        <h2 className="eyebrow mb-3">Реестр персон</h2>
        {rows.length === 0 ? (
          <div className="py-6 text-center font-ui text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Нет персон
          </div>
        ) : (
          <div className="-mx-2 flex flex-col">
            {rows.map((p) => {
              const dates = lifeDates(p);
              const active = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition",
                    active
                      ? "border-primary bg-surface-light"
                      : "border-transparent hover:bg-surface-light/60",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted font-ui text-[11px] font-bold text-muted-foreground">
                    {p.avatarThumb ? (
                      <img
                        src={p.avatarThumb}
                        alt=""
                        className={cn(
                          "size-full object-cover grayscale transition",
                          active ? "opacity-100" : "opacity-60 group-hover:opacity-100",
                        )}
                      />
                    ) : (
                      initials(p)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] leading-tight text-foreground">
                      {fullName(p) || "Без имени"}
                    </span>
                    <span className="mt-0.5 block font-ui text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                      {[p.personIndex, dates].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-2 font-ui text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        Всего персон: {persons.length}
      </div>
    </aside>
  );
}

