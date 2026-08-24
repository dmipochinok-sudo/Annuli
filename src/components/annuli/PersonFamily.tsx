import {
  AddButton,
  CardItem,
  CheckField,
  Row,
  Section,
  TextField,
} from "@/components/annuli/PersonBasic";
import { mkChild, mkMarriage, type Child, type Marriage, type Person } from "@/lib/annuli/types";

interface Props {
  person: Person;
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
}

export function PersonFamily({ person: p, editMode, onChange }: Props) {
  const ro = !editMode;

  const patchMarriage = (id: string, patch: Partial<Marriage>) =>
    onChange({ marriages: p.marriages.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const patchChild = (id: string, patch: Partial<Child>) =>
    onChange({ children: p.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  return (
    <div>
      <Section title="Крёстные родители">
        <Row>
          <TextField
            label="Крёстный — имя"
            value={p.godfatherFirstName}
            readOnly={ro}
            onChange={(v) => onChange({ godfatherFirstName: v })}
          />
          <TextField
            label="Крёстный — отчество"
            value={p.godfatherPatronymic}
            readOnly={ro}
            onChange={(v) => onChange({ godfatherPatronymic: v })}
          />
          <TextField
            label="Крёстный — фамилия"
            value={p.godfatherLastName}
            readOnly={ro}
            onChange={(v) => onChange({ godfatherLastName: v })}
          />
          <TextField
            label="Крёстный — место"
            value={p.godfatherPlace}
            readOnly={ro}
            onChange={(v) => onChange({ godfatherPlace: v })}
          />
        </Row>
        <Row>
          <TextField
            label="Крёстная — имя"
            value={p.godmotherFirstName}
            readOnly={ro}
            onChange={(v) => onChange({ godmotherFirstName: v })}
          />
          <TextField
            label="Крёстная — отчество"
            value={p.godmotherPatronymic}
            readOnly={ro}
            onChange={(v) => onChange({ godmotherPatronymic: v })}
          />
          <TextField
            label="Крёстная — фамилия"
            value={p.godmotherLastName}
            readOnly={ro}
            onChange={(v) => onChange({ godmotherLastName: v })}
          />
          <TextField
            label="Крёстная — место"
            value={p.godmotherPlace}
            readOnly={ro}
            onChange={(v) => onChange({ godmotherPlace: v })}
          />
        </Row>
      </Section>

      <Section title={`Браки (${p.marriages.length})`}>
        {p.marriages.length === 0 && (
          <p className="mb-2 text-[12px] text-muted-foreground">Браки не указаны</p>
        )}
        {p.marriages.map((m, i) => (
          <CardItem
            key={m.id}
            readOnly={ro}
            title={
              [m.spouseFirstName, m.spousePatronymic, m.spouseLastName].filter(Boolean).join(" ") ||
              `Брак ${i + 1}`
            }
            onRemove={() => onChange({ marriages: p.marriages.filter((x) => x.id !== m.id) })}
          >
            <Row>
              <TextField
                label="Супруг(а) — имя"
                value={m.spouseFirstName}
                readOnly={ro}
                onChange={(v) => patchMarriage(m.id, { spouseFirstName: v })}
              />
              <TextField
                label="Супруг(а) — отчество"
                value={m.spousePatronymic}
                readOnly={ro}
                onChange={(v) => patchMarriage(m.id, { spousePatronymic: v })}
              />
              <TextField
                label="Супруг(а) — фамилия"
                value={m.spouseLastName}
                readOnly={ro}
                onChange={(v) => patchMarriage(m.id, { spouseLastName: v })}
              />
            </Row>
            <Row>
              <TextField
                label="Дата брака"
                value={m.marriageDate}
                readOnly={ro}
                placeholder="дд.мм.гггг"
                onChange={(v) => patchMarriage(m.id, { marriageDate: v })}
              />
              <TextField
                label="Место брака"
                value={m.marriagePlace}
                readOnly={ro}
                onChange={(v) => patchMarriage(m.id, { marriagePlace: v })}
              />
            </Row>
            <CheckField
              label="Брак расторгнут / прекращён"
              checked={m.marriageEnded}
              readOnly={ro}
              onChange={(v) => patchMarriage(m.id, { marriageEnded: v })}
            />
            {m.marriageEnded && (
              <Row>
                <TextField
                  label="Дата окончания"
                  value={m.marriageEndDate}
                  readOnly={ro}
                  onChange={(v) => patchMarriage(m.id, { marriageEndDate: v })}
                />
                <TextField
                  label="Причина"
                  value={m.marriageEndReason}
                  readOnly={ro}
                  onChange={(v) => patchMarriage(m.id, { marriageEndReason: v })}
                />
              </Row>
            )}
            <Row>
              <TextField
                label="Документ о браке"
                value={m.marriageDocName}
                readOnly={ro}
                onChange={(v) => patchMarriage(m.id, { marriageDocName: v })}
              />
              <TextField
                label="Архив"
                value={m.marriageDocArchive}
                readOnly={ro}
                onChange={(v) => patchMarriage(m.id, { marriageDocArchive: v })}
              />
              <TextField
                label="Фонд"
                value={m.marriageDocFund}
                readOnly={ro}
                onChange={(v) => patchMarriage(m.id, { marriageDocFund: v })}
              />
              <TextField
                label="Опись"
                value={m.marriageDocOpis}
                readOnly={ro}
                onChange={(v) => patchMarriage(m.id, { marriageDocOpis: v })}
              />
              <TextField
                label="Дело"
                value={m.marriageDocDelo}
                readOnly={ro}
                onChange={(v) => patchMarriage(m.id, { marriageDocDelo: v })}
              />
              <TextField
                label="Лист"
                value={m.marriageDocList}
                readOnly={ro}
                onChange={(v) => patchMarriage(m.id, { marriageDocList: v })}
              />
            </Row>
          </CardItem>
        ))}
        {!ro && (
          <AddButton
            label="+ Добавить брак"
            onClick={() => onChange({ marriages: [...p.marriages, mkMarriage()] })}
          />
        )}
      </Section>

      <Section title={`Дети (${p.children.length})`}>
        {p.children.length === 0 && (
          <p className="mb-2 text-[12px] text-muted-foreground">Дети не указаны</p>
        )}
        {p.children.map((c, i) => (
          <CardItem
            key={c.id}
            readOnly={ro}
            title={
              [c.firstName, c.patronymic, c.lastName].filter(Boolean).join(" ") || `Ребёнок ${i + 1}`
            }
            onRemove={() => onChange({ children: p.children.filter((x) => x.id !== c.id) })}
          >
            <Row>
              <TextField
                label="Имя"
                value={c.firstName}
                readOnly={ro}
                onChange={(v) => patchChild(c.id, { firstName: v })}
              />
              <TextField
                label="Отчество"
                value={c.patronymic}
                readOnly={ro}
                onChange={(v) => patchChild(c.id, { patronymic: v })}
              />
              <TextField
                label="Фамилия"
                value={c.lastName}
                readOnly={ro}
                onChange={(v) => patchChild(c.id, { lastName: v })}
              />
            </Row>
            <Row>
              <TextField
                label="Пол (М/Ж)"
                value={c.gender}
                readOnly={ro}
                onChange={(v) => patchChild(c.id, { gender: v })}
              />
              <TextField
                label="Дата рождения"
                value={c.birthDate}
                readOnly={ro}
                placeholder="дд.мм.гггг или год"
                onChange={(v) => patchChild(c.id, { birthDate: v })}
              />
              <TextField
                label="Место рождения"
                value={c.birthPlace}
                readOnly={ro}
                onChange={(v) => patchChild(c.id, { birthPlace: v })}
              />
              <TextField
                label="Сословие"
                value={c.estate}
                readOnly={ro}
                onChange={(v) => patchChild(c.id, { estate: v })}
              />
            </Row>
            <Row>
              <TextField
                label="Документ о рождении"
                value={c.birthDocName}
                readOnly={ro}
                onChange={(v) => patchChild(c.id, { birthDocName: v })}
              />
              <TextField
                label="Архив"
                value={c.birthDocArchive}
                readOnly={ro}
                onChange={(v) => patchChild(c.id, { birthDocArchive: v })}
              />
              <TextField
                label="Фонд"
                value={c.birthDocFund}
                readOnly={ro}
                onChange={(v) => patchChild(c.id, { birthDocFund: v })}
              />
              <TextField
                label="Опись"
                value={c.birthDocOpis}
                readOnly={ro}
                onChange={(v) => patchChild(c.id, { birthDocOpis: v })}
              />
              <TextField
                label="Дело"
                value={c.birthDocDelo}
                readOnly={ro}
                onChange={(v) => patchChild(c.id, { birthDocDelo: v })}
              />
              <TextField
                label="Лист"
                value={c.birthDocList}
                readOnly={ro}
                onChange={(v) => patchChild(c.id, { birthDocList: v })}
              />
            </Row>
          </CardItem>
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
