import {
  AddButton,
  Row,
  Section,
  TextField,
  CheckField,
} from "@/components/annuli/PersonBasic";
import { MatchSuggestions } from "@/components/annuli/MatchSuggestions";
import { PersonLinkCard } from "@/components/annuli/PersonLinkCard";
import type { DupeKind } from "@/lib/annuli/dedupe";
import { genOf } from "@/lib/annuli/format";
import {
  mkChild,
  mkMarriage,
  mkSibling,
  type Child,
  type Marriage,
  type Person,
  type Sibling,
} from "@/lib/annuli/types";

interface Props {
  person: Person;
  persons: Person[];
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
  onOpenPerson: (id: string) => void;
}

/** Вкладка «Основное»: данные персоны, родители, братья/сёстры, супруги, дети. */
export function PersonMain({ person: p, persons, editMode, onChange, onOpenPerson }: Props) {
  const ro = !editMode;

  const link = (kind: DupeKind, idx: number | null, c: Person) => {
    if (kind === "father")
      onChange({
        fatherLinkedId: c.id,
        fatherFirstName: c.firstName,
        fatherPatronymic: c.patronymic,
        fatherLastName: c.lastName,
        fatherIndex: c.personIndex,
      });
    else if (kind === "mother")
      onChange({
        motherLinkedId: c.id,
        motherFirstName: c.firstName,
        motherPatronymic: c.patronymic,
        motherLastName: c.lastName,
        motherIndex: c.personIndex,
      });
    else if (kind === "sibling" && idx !== null)
      onChange({
        siblings: p.siblings.map((s, i) =>
          i === idx ? { ...s, linkedId: c.id, personIndex: c.personIndex } : s,
        ),
      });
    else if (kind === "child" && idx !== null)
      onChange({
        children: p.children.map((x, i) =>
          i === idx ? { ...x, linkedId: c.id, personIndex: c.personIndex } : x,
        ),
      });
    else if (kind === "spouse" && idx !== null)
      onChange({
        marriages: p.marriages.map((m, i) =>
          i === idx ? { ...m, spouseLinkedId: c.id, spouseIndex: c.personIndex } : m,
        ),
      });
  };

  const patchSibling = (i: number, patch: Partial<Sibling>) =>
    onChange({ siblings: p.siblings.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const patchChild = (i: number, patch: Partial<Child>) =>
    onChange({ children: p.children.map((c, k) => (k === i ? { ...c, ...patch } : c)) });
  const patchMarriage = (i: number, patch: Partial<Marriage>) =>
    onChange({ marriages: p.marriages.map((m, k) => (k === i ? { ...m, ...patch } : m)) });

  return (
    <div>
      <Section title="Основные данные">
        <Row>
          <TextField
            label="Индекс персоны *"
            value={p.personIndex}
            readOnly={ro}
            placeholder="N.5.3"
            onChange={(v) => onChange({ personIndex: v, generation: genOf(v) })}
          />
          <TextField
            label="Имя"
            value={p.firstName}
            readOnly={ro}
            onChange={(v) => onChange({ firstName: v })}
          />
          <TextField
            label="Отчество"
            value={p.patronymic}
            readOnly={ro}
            onChange={(v) => onChange({ patronymic: v })}
          />
          <TextField
            label="Фамилия"
            value={p.lastName}
            readOnly={ro}
            onChange={(v) => onChange({ lastName: v })}
          />
        </Row>
        <Row>
          <TextField
            label="Пол (М / Ж)"
            value={p.gender}
            readOnly={ro}
            onChange={(v) => onChange({ gender: v })}
          />
          <TextField
            label="Сословие"
            value={p.estate}
            readOnly={ro}
            onChange={(v) => onChange({ estate: v })}
          />
          <TextField
            label="Дата рождения"
            value={p.birthDate}
            readOnly={ro}
            onChange={(v) => onChange({ birthDate: v })}
          />
          <TextField
            label="Дата смерти"
            value={p.deathDate}
            readOnly={ro}
            onChange={(v) => onChange({ deathDate: v })}
          />
        </Row>
        <CheckField
          label="Боковая ветвь (не на главной линии)"
          checked={p.isLateral}
          readOnly={ro}
          onChange={(v) => onChange({ isLateral: v })}
        />
      </Section>

      <Section title="Родители">
        <MatchSuggestions
          person={p}
          persons={persons}
          kinds={["father", "mother"]}
          onLink={link}
          onDetails={(c) => onOpenPerson(c.id)}
        />
        <PersonLinkCard
          title="Отец"
          persons={persons}
          editMode={editMode}
          value={{
            personIndex: p.fatherIndex,
            firstName: p.fatherFirstName,
            patronymic: p.fatherPatronymic,
            lastName: p.fatherLastName,
            linkedId: p.fatherLinkedId,
            avatarImageId: p.fatherAvatarImageId,
          }}
          onChange={(v) =>
            onChange({
              ...(v.personIndex !== undefined ? { fatherIndex: v.personIndex } : {}),
              ...(v.firstName !== undefined ? { fatherFirstName: v.firstName } : {}),
              ...(v.patronymic !== undefined ? { fatherPatronymic: v.patronymic } : {}),
              ...(v.lastName !== undefined ? { fatherLastName: v.lastName } : {}),
              ...(v.avatarImageId !== undefined ? { fatherAvatarImageId: v.avatarImageId } : {}),
            })
          }
          onRemove={() =>
            onChange({
              fatherIndex: "",
              fatherFirstName: "",
              fatherPatronymic: "",
              fatherLastName: "",
              fatherLinkedId: "",
              fatherAvatarImageId: "",
            })
          }
          onOpenPerson={onOpenPerson}
        />
        <PersonLinkCard
          title="Мать"
          persons={persons}
          editMode={editMode}
          value={{
            personIndex: p.motherIndex,
            firstName: p.motherFirstName,
            patronymic: p.motherPatronymic,
            lastName: p.motherLastName,
            linkedId: p.motherLinkedId,
            avatarImageId: p.motherAvatarImageId,
          }}
          onChange={(v) =>
            onChange({
              ...(v.personIndex !== undefined ? { motherIndex: v.personIndex } : {}),
              ...(v.firstName !== undefined ? { motherFirstName: v.firstName } : {}),
              ...(v.patronymic !== undefined ? { motherPatronymic: v.patronymic } : {}),
              ...(v.lastName !== undefined ? { motherLastName: v.lastName } : {}),
              ...(v.avatarImageId !== undefined ? { motherAvatarImageId: v.avatarImageId } : {}),
            })
          }
          onRemove={() =>
            onChange({
              motherIndex: "",
              motherFirstName: "",
              motherPatronymic: "",
              motherLastName: "",
              motherLinkedId: "",
              motherAvatarImageId: "",
            })
          }
          onOpenPerson={onOpenPerson}
        />
      </Section>

      <Section title={`Братья и сёстры (${p.siblings.length})`}>
        <MatchSuggestions
          person={p}
          persons={persons}
          kinds={["sibling"]}
          onLink={link}
          onDetails={(c) => onOpenPerson(c.id)}
        />
        {p.siblings.map((s, i) => (
          <PersonLinkCard
            key={s.id}
            title={`Брат / сестра ${i + 1}`}
            persons={persons}
            editMode={editMode}
            value={{
              personIndex: s.personIndex,
              firstName: s.firstName,
              patronymic: s.patronymic,
              lastName: s.lastName,
              linkedId: s.linkedId,
              avatarImageId: s.avatarImageId,
            }}
            onChange={(v) => patchSibling(i, v)}
            onRemove={() => onChange({ siblings: p.siblings.filter((_, k) => k !== i) })}
            onOpenPerson={onOpenPerson}
          />
        ))}
        {!ro && (
          <AddButton
            label="+ Добавить брата / сестру"
            onClick={() => onChange({ siblings: [...p.siblings, mkSibling()] })}
          />
        )}
      </Section>

      <Section title={`Супруги (${p.marriages.length})`}>
        <MatchSuggestions
          person={p}
          persons={persons}
          kinds={["spouse"]}
          onLink={link}
          onDetails={(c) => onOpenPerson(c.id)}
        />
        {p.marriages.map((m, i) => (
          <div key={m.id}>
            <PersonLinkCard
              title={`Супруг / супруга ${i + 1}`}
              persons={persons}
              editMode={editMode}
              value={{
                personIndex: m.spouseIndex,
                firstName: m.spouseFirstName,
                patronymic: m.spousePatronymic,
                lastName: m.spouseLastName,
                linkedId: m.spouseLinkedId,
                avatarImageId: m.spouseAvatarImageId,
              }}
              onChange={(v) =>
                patchMarriage(i, {
                  ...(v.personIndex !== undefined ? { spouseIndex: v.personIndex } : {}),
                  ...(v.firstName !== undefined ? { spouseFirstName: v.firstName } : {}),
                  ...(v.patronymic !== undefined ? { spousePatronymic: v.patronymic } : {}),
                  ...(v.lastName !== undefined ? { spouseLastName: v.lastName } : {}),
                  ...(v.avatarImageId !== undefined
                    ? { spouseAvatarImageId: v.avatarImageId }
                    : {}),
                })
              }
              onRemove={() => onChange({ marriages: p.marriages.filter((_, k) => k !== i) })}
              onOpenPerson={onOpenPerson}
            />
            <div className="mb-3 -mt-1 rounded-2xl border border-border bg-card p-4">
              <Row>
                <TextField
                  label="Дата брака"
                  value={m.marriageDate}
                  readOnly={ro}
                  onChange={(v) => patchMarriage(i, { marriageDate: v })}
                />
                <TextField
                  label="Место брака"
                  value={m.marriagePlace}
                  readOnly={ro}
                  onChange={(v) => patchMarriage(i, { marriagePlace: v })}
                />
              </Row>
              <CheckField
                label="Брак расторгнут"
                checked={m.marriageEnded}
                readOnly={ro}
                onChange={(v) => patchMarriage(i, { marriageEnded: v })}
              />
              {m.marriageEnded && (
                <Row>
                  <TextField
                    label="Дата расторжения"
                    value={m.marriageEndDate}
                    readOnly={ro}
                    onChange={(v) => patchMarriage(i, { marriageEndDate: v })}
                  />
                  <TextField
                    label="Причина"
                    value={m.marriageEndReason}
                    readOnly={ro}
                    onChange={(v) => patchMarriage(i, { marriageEndReason: v })}
                  />
                </Row>
              )}
            </div>
          </div>
        ))}
        {!ro && (
          <AddButton
            label="+ Добавить брак"
            onClick={() => onChange({ marriages: [...p.marriages, mkMarriage()] })}
          />
        )}
      </Section>

      <Section title={`Дети (${p.children.length})`}>
        <MatchSuggestions
          person={p}
          persons={persons}
          kinds={["child"]}
          onLink={link}
          onDetails={(c) => onOpenPerson(c.id)}
        />
        {p.children.map((c, i) => (
          <PersonLinkCard
            key={c.id}
            title={`Ребёнок ${i + 1}`}
            persons={persons}
            editMode={editMode}
            value={{
              personIndex: c.personIndex,
              firstName: c.firstName,
              patronymic: c.patronymic,
              lastName: c.lastName,
              linkedId: c.linkedId,
              avatarImageId: c.avatarImageId,
            }}
            onChange={(v) => patchChild(i, v)}
            onRemove={() => onChange({ children: p.children.filter((_, k) => k !== i) })}
            onOpenPerson={onOpenPerson}
          />
        ))}
        {!ro && (
          <AddButton
            label="+ Добавить ребёнка"
            onClick={() => onChange({ children: [...p.children, mkChild()] })}
          />
        )}
      </Section>
    </div>
  );
}
