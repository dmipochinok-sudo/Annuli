import { Section } from "@/components/annuli/PersonBasic";
import { fullName, lifeDates } from "@/lib/annuli/format";
import type { Person } from "@/lib/annuli/types";

interface Props {
  person: Person;
  persons: Person[];
  onSelect: (id: string) => void;
}

function Node({
  title,
  subtitle,
  onClick,
  accent,
}: {
  title: string;
  subtitle?: string;
  onClick?: (() => void) | undefined;
  accent?: boolean | undefined;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={
        "min-w-[140px] max-w-[220px] rounded-lg border px-3 py-2 text-left transition " +
        (accent
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border bg-card hover:border-primary disabled:hover:border-border")
      }
    >
      <span className="block truncate text-[13px] font-semibold">{title}</span>
      {subtitle && <span className="block truncate text-[11px] opacity-70">{subtitle}</span>}
    </button>
  );
}

function nameOf(first: string, patr: string, last: string) {
  return [first, patr, last].filter(Boolean).join(" ");
}

export function PersonTree({ person: p, persons, onSelect }: Props) {
  const byId = (id: string) => persons.find((x) => x.id === id) ?? null;

  const father = p.fatherLinkedId ? byId(p.fatherLinkedId) : null;
  const mother = p.motherLinkedId ? byId(p.motherLinkedId) : null;
  const fatherName = father
    ? fullName(father)
    : nameOf(p.fatherFirstName, p.fatherPatronymic, p.fatherLastName);
  const motherName = mother
    ? fullName(mother)
    : nameOf(p.motherFirstName, p.motherPatronymic, p.motherLastName);

  return (
    <Section title="Дерево">
      <div className="flex flex-col items-center gap-3 overflow-x-auto py-2">
        <div className="flex flex-wrap justify-center gap-2">
          {fatherName && (
            <Node
              title={fatherName}
              subtitle="отец"
              accent={false}
              onClick={father ? () => onSelect(father.id) : undefined}
            />
          )}
          {motherName && (
            <Node
              title={motherName}
              subtitle="мать"
              onClick={mother ? () => onSelect(mother.id) : undefined}
            />
          )}
          {!fatherName && !motherName && (
            <span className="text-[12px] text-muted-foreground">Родители не указаны</span>
          )}
        </div>

        <span className="h-4 w-px bg-border" />

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Node title={fullName(p) || "Без имени"} subtitle={lifeDates(p) || p.personIndex} accent />
          {p.marriages.map((m) => {
            const sp = m.spouseLinkedId ? byId(m.spouseLinkedId) : null;
            const nm = sp
              ? fullName(sp)
              : nameOf(m.spouseFirstName, m.spousePatronymic, m.spouseLastName);
            if (!nm) return null;
            return (
              <Node
                key={m.id}
                title={nm}
                subtitle="супруг(а)"
                onClick={sp ? () => onSelect(sp.id) : undefined}
              />
            );
          })}
        </div>

        {p.children.length > 0 && (
          <>
            <span className="h-4 w-px bg-border" />
            <div className="flex flex-wrap justify-center gap-2">
              {p.children.map((c) => {
                const ch = c.linkedId ? byId(c.linkedId) : null;
                return (
                  <Node
                    key={c.id}
                    title={ch ? fullName(ch) : nameOf(c.firstName, c.patronymic, c.lastName) || "—"}
                    subtitle={c.birthDate || "ребёнок"}
                    onClick={ch ? () => onSelect(ch.id) : undefined}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
