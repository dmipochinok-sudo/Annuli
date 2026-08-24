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
}

export function PersonSidebar({ persons, selectedId, onSelect, onNew, className }: Props) {
  const [query, setQuery] = useState("");
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
      <div className="flex flex-col gap-2 border-b border-border p-2.5">
        <input
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          placeholder="Поиск по имени или индексу…"
          className="rounded-md border border-border bg-card px-2.5 py-2 text-[13px] outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
        />
        <div className="flex gap-2">
          <select
            value={gen}
            onChange={(ev) => setGen(ev.target.value)}
            className="min-w-0 flex-1 rounded-md border border-border bg-card px-2 py-1.5 text-[12px] outline-none focus:border-primary"
          >
            <option value="">Все поколения</option>
            {generations.map((g) => (
              <option key={g} value={g}>
                {g}-е поколение
              </option>
            ))}
          </select>
          <select
            value={gender}
            onChange={(ev) => setGender(ev.target.value)}
            className="min-w-0 flex-1 rounded-md border border-border bg-card px-2 py-1.5 text-[12px] outline-none focus:border-primary"
          >
            <option value="">Любой пол</option>
            <option value="М">Мужской</option>
            <option value="Ж">Женский</option>
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
          <input
            type="checkbox"
            checked={showLateral}
            onChange={(ev) => setShowLateral(ev.target.checked)}
            className="accent-primary"
          />
          Показывать боковые ветви
        </label>
        <button
          onClick={onNew}
          className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition hover:brightness-110"
        >
          + Новая персона
        </button>
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
