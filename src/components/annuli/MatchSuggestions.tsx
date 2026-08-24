import { useMemo } from "react";

import { findDuplicates, type DupeKind } from "@/lib/annuli/dedupe";
import { fullName } from "@/lib/annuli/format";
import type { Person } from "@/lib/annuli/types";

interface Props {
  person: Person;
  persons: Person[];
  kinds: DupeKind[];
  /** Привязать кандидата к слоту (kind + индекс в массиве). */
  onLink: (kind: DupeKind, idx: number | null, candidate: Person) => void;
  onDetails: (candidate: Person) => void;
}

/** Блок «Возможные совпадения»: кандидаты из базы для непривязанных родственников. */
export function MatchSuggestions({ person, persons, kinds, onLink, onDetails }: Props) {
  const slots = useMemo(
    () => findDuplicates(person, persons).filter((s) => kinds.includes(s.kind)),
    [person, persons, kinds],
  );
  if (!slots.length) return null;

  return (
    <div className="mb-3 rounded-2xl border border-border bg-surface-light p-4">
      <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.04em]">
        Возможные совпадения
      </p>
      <div className="flex flex-col gap-2">
        {slots.flatMap((s) =>
          s.candidates.slice(0, 3).map((c) => (
            <div
              key={`${s.key}:${c.person.id}`}
              className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground"
            >
              <span className="min-w-0 flex-1 truncate">
                {fullName(c.person) || "Без имени"}
                {c.person.personIndex ? ` (${c.person.personIndex})` : ""}
              </span>
              <button
                type="button"
                onClick={() => onDetails(c.person)}
                className="h-8 rounded-lg border border-border bg-surface-dark px-3 text-[13px] text-foreground transition hover:border-stroke-bright"
              >
                Посмотреть детали
              </button>
              <button
                type="button"
                onClick={() => onLink(s.kind, s.idx, c.person)}
                className="h-8 rounded-lg bg-success px-3 text-[13px] font-medium text-success-foreground transition hover:brightness-110"
              >
                Связать
              </button>
            </div>
          )),
        )}
      </div>
    </div>
  );
}
