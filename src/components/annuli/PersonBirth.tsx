import { CheckField, Row, Section, TextField } from "@/components/annuli/PersonBasic";
import { PagesEditor } from "@/components/annuli/PagesEditor";
import { PersonLinkCard } from "@/components/annuli/PersonLinkCard";
import type { Page, Person } from "@/lib/annuli/types";

interface Props {
  person: Person;
  persons: Person[];
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
  onOpenPerson: (id: string) => void;
  onOpenScans: (pages: Page[], index: number) => void;
}

/** Вкладка «Рождение»: дата и место, крёстные, метрика о рождении. */
export function PersonBirth({
  person: p,
  persons,
  editMode,
  onChange,
  onOpenPerson,
  onOpenScans,
}: Props) {
  const ro = !editMode;

  return (
    <div>
      <Section title="Дата и место рождения">
        <CheckField
          label="Приблизительная дата"
          checked={p.birthDateApprox}
          readOnly={ro}
          onChange={(v) => onChange({ birthDateApprox: v })}
        />
        <div className="mt-2.5">
          <Row>
            {p.birthDateApprox ? (
              <>
                <TextField
                  label="Год от"
                  value={p.birthYearFrom}
                  readOnly={ro}
                  onChange={(v) => onChange({ birthYearFrom: v })}
                />
                <TextField
                  label="Год до"
                  value={p.birthYearTo}
                  readOnly={ro}
                  onChange={(v) => onChange({ birthYearTo: v })}
                />
              </>
            ) : (
              <TextField
                label="Дата рождения"
                value={p.birthDate}
                readOnly={ro}
                placeholder="дд.мм.гггг или год"
                onChange={(v) => onChange({ birthDate: v })}
              />
            )}
            <TextField
              label="Место рождения"
              value={p.birthPlace}
              readOnly={ro}
              onChange={(v) => onChange({ birthPlace: v })}
            />
          </Row>
        </div>
      </Section>

      <Section title="Крёстные">
        <PersonLinkCard
          title="Крёстный отец"
          persons={persons}
          editMode={editMode}
          noLink
          value={{
            personIndex: p.godfatherIndex,
            firstName: p.godfatherFirstName,
            patronymic: p.godfatherPatronymic,
            lastName: p.godfatherLastName,
            avatarImageId: p.godfatherAvatarImageId,
          }}
          onChange={(v) =>
            onChange({
              ...(v.personIndex !== undefined ? { godfatherIndex: v.personIndex } : {}),
              ...(v.firstName !== undefined ? { godfatherFirstName: v.firstName } : {}),
              ...(v.patronymic !== undefined ? { godfatherPatronymic: v.patronymic } : {}),
              ...(v.lastName !== undefined ? { godfatherLastName: v.lastName } : {}),
              ...(v.avatarImageId !== undefined
                ? { godfatherAvatarImageId: v.avatarImageId }
                : {}),
            })
          }
          onRemove={() =>
            onChange({
              godfatherIndex: "",
              godfatherFirstName: "",
              godfatherPatronymic: "",
              godfatherLastName: "",
              godfatherAvatarImageId: "",
            })
          }
          onOpenPerson={onOpenPerson}
        />
        <Row>
          <TextField
            label="Место жительства крёстного отца"
            value={p.godfatherPlace}
            readOnly={ro}
            onChange={(v) => onChange({ godfatherPlace: v })}
          />
        </Row>
        <PersonLinkCard
          title="Крёстная мать"
          persons={persons}
          editMode={editMode}
          noLink
          value={{
            personIndex: p.godmotherIndex,
            firstName: p.godmotherFirstName,
            patronymic: p.godmotherPatronymic,
            lastName: p.godmotherLastName,
            avatarImageId: p.godmotherAvatarImageId,
          }}
          onChange={(v) =>
            onChange({
              ...(v.personIndex !== undefined ? { godmotherIndex: v.personIndex } : {}),
              ...(v.firstName !== undefined ? { godmotherFirstName: v.firstName } : {}),
              ...(v.patronymic !== undefined ? { godmotherPatronymic: v.patronymic } : {}),
              ...(v.lastName !== undefined ? { godmotherLastName: v.lastName } : {}),
              ...(v.avatarImageId !== undefined
                ? { godmotherAvatarImageId: v.avatarImageId }
                : {}),
            })
          }
          onRemove={() =>
            onChange({
              godmotherIndex: "",
              godmotherFirstName: "",
              godmotherPatronymic: "",
              godmotherLastName: "",
              godmotherAvatarImageId: "",
            })
          }
          onOpenPerson={onOpenPerson}
        />
        <Row>
          <TextField
            label="Место жительства крёстной матери"
            value={p.godmotherPlace}
            readOnly={ro}
            onChange={(v) => onChange({ godmotherPlace: v })}
          />
        </Row>
      </Section>

      <Section title="Документ о рождении">
        <Row>
          <TextField
            label="Название"
            value={p.birthDocName}
            readOnly={ro}
            onChange={(v) => onChange({ birthDocName: v })}
          />
          <TextField
            label="Архив"
            value={p.birthDocArchive}
            readOnly={ro}
            onChange={(v) => onChange({ birthDocArchive: v })}
          />
          <TextField
            label="Фонд"
            value={p.birthDocFund}
            readOnly={ro}
            onChange={(v) => onChange({ birthDocFund: v })}
          />
          <TextField
            label="Опись"
            value={p.birthDocOpis}
            readOnly={ro}
            onChange={(v) => onChange({ birthDocOpis: v })}
          />
          <TextField
            label="Дело"
            value={p.birthDocDelo}
            readOnly={ro}
            onChange={(v) => onChange({ birthDocDelo: v })}
          />
          <TextField
            label="Лист"
            value={p.birthDocList}
            readOnly={ro}
            onChange={(v) => onChange({ birthDocList: v })}
          />
        </Row>
        <PagesEditor
          label="Сканы метрики о рождении"
          pages={p.birthDocPages}
          editMode={editMode}
          onChange={(pages) => onChange({ birthDocPages: pages })}
          onOpen={onOpenScans}
        />
      </Section>
    </div>
  );
}
