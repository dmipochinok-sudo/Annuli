import { AddButton, CardItem, Row, Section, TextField } from "@/components/annuli/PersonBasic";
import { DocPanel } from "@/components/annuli/DocPanel";
import {
  mkAward,
  mkConflict,
  mkDoc,
  mkMilitaryPlace,
  type Award,
  type Doc,
  type MilitaryConflict,
  type MilitaryPlace,
  type Page,
  type Person,
} from "@/lib/annuli/types";

interface Props {
  person: Person;
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
  onOpenScans: (pages: Page[], index: number) => void;
}

/** Вкладка «Военная служба»: места службы, конфликты, награды, документы. */
export function PersonService({ person: p, editMode, onChange, onOpenScans }: Props) {
  const ro = !editMode;
  const places = p.militaryPlaces || [];
  const conflicts = p.militaryConflicts || [];
  const awards = p.militaryAwards || [];
  const docs = p.militaryDocs || [];

  const patchPlace = (i: number, patch: Partial<MilitaryPlace>) =>
    onChange({ militaryPlaces: places.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
  const patchConflict = (i: number, patch: Partial<MilitaryConflict>) =>
    onChange({ militaryConflicts: conflicts.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
  const patchAward = (i: number, patch: Partial<Award>) =>
    onChange({ militaryAwards: awards.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
  const patchDoc = (i: number, patch: Partial<Doc>) =>
    onChange({ militaryDocs: docs.map((x, k) => (k === i ? { ...x, ...patch } : x)) });

  return (
    <div>
      <Section title="Места службы">
        {places.length === 0 && (
          <p className="mb-2 text-[13px] text-muted-foreground">Записей нет.</p>
        )}
        {places.map((m, i) => (
          <CardItem
            key={m.id}
            readOnly={ro}
            title={m.unit || `Место службы ${i + 1}`}
            onRemove={() => onChange({ militaryPlaces: places.filter((_, k) => k !== i) })}
          >
            <Row>
              <TextField
                label="Часть / формирование"
                value={m.unit}
                readOnly={ro}
                onChange={(v) => patchPlace(i, { unit: v })}
              />
              <TextField
                label="Звание"
                value={m.rank}
                readOnly={ro}
                onChange={(v) => patchPlace(i, { rank: v })}
              />
              <TextField
                label="Должность"
                value={m.position}
                readOnly={ro}
                onChange={(v) => patchPlace(i, { position: v })}
              />
            </Row>
            <Row>
              <TextField
                label="Дата призыва"
                value={m.dateFrom}
                readOnly={ro}
                onChange={(v) => patchPlace(i, { dateFrom: v })}
              />
              <TextField
                label="Дата окончания"
                value={m.dateTo}
                readOnly={ro}
                onChange={(v) => patchPlace(i, { dateTo: v })}
              />
              <TextField
                label="Причина окончания"
                value={m.endReason}
                readOnly={ro}
                onChange={(v) => patchPlace(i, { endReason: v })}
              />
              <TextField
                label="Место"
                value={m.place}
                readOnly={ro}
                onChange={(v) => patchPlace(i, { place: v })}
              />
            </Row>
          </CardItem>
        ))}
        {!ro && (
          <AddButton
            label="＋ Добавить место службы"
            onClick={() => onChange({ militaryPlaces: [...places, mkMilitaryPlace()] })}
          />
        )}
      </Section>

      <Section title="Военные конфликты">
        {conflicts.length === 0 && (
          <p className="mb-2 text-[13px] text-muted-foreground">Записей нет.</p>
        )}
        {conflicts.map((c, i) => (
          <CardItem
            key={c.id}
            readOnly={ro}
            title={c.name || `Конфликт ${i + 1}`}
            onRemove={() => onChange({ militaryConflicts: conflicts.filter((_, k) => k !== i) })}
          >
            <Row>
              <TextField
                label="Название"
                value={c.name}
                readOnly={ro}
                onChange={(v) => patchConflict(i, { name: v })}
              />
              <TextField
                label="Дата начала"
                value={c.dateFrom}
                readOnly={ro}
                onChange={(v) => patchConflict(i, { dateFrom: v })}
              />
              <TextField
                label="Дата окончания"
                value={c.dateTo}
                readOnly={ro}
                onChange={(v) => patchConflict(i, { dateTo: v })}
              />
            </Row>
          </CardItem>
        ))}
        {!ro && (
          <AddButton
            label="＋ Добавить конфликт"
            onClick={() => onChange({ militaryConflicts: [...conflicts, mkConflict()] })}
          />
        )}
      </Section>

      <Section title="Награды">
        {awards.length === 0 && (
          <p className="mb-2 text-[13px] text-muted-foreground">Наград нет.</p>
        )}
        {awards.map((a, i) => (
          <CardItem
            key={a.id}
            readOnly={ro}
            title={a.name || `Награда ${i + 1}`}
            onRemove={() => onChange({ militaryAwards: awards.filter((_, k) => k !== i) })}
          >
            <Row>
              <TextField
                label="Название"
                value={a.name}
                readOnly={ro}
                onChange={(v) => patchAward(i, { name: v })}
              />
              <TextField
                label="Дата награждения"
                value={a.date}
                readOnly={ro}
                onChange={(v) => patchAward(i, { date: v })}
              />
              <TextField
                label="Звание на момент награждения"
                value={a.rank}
                readOnly={ro}
                onChange={(v) => patchAward(i, { rank: v })}
              />
            </Row>
            <Row>
              <TextField
                label="Номер документа"
                value={a.docNumber}
                readOnly={ro}
                onChange={(v) => patchAward(i, { docNumber: v })}
              />
              <TextField
                label="Место хранения"
                value={a.storage}
                readOnly={ro}
                onChange={(v) => patchAward(i, { storage: v })}
              />
            </Row>
          </CardItem>
        ))}
        {!ro && (
          <AddButton
            label="＋ Добавить награду"
            onClick={() => onChange({ militaryAwards: [...awards, mkAward()] })}
          />
        )}
      </Section>

      <Section title="Документы о службе">
        {docs.length === 0 && (
          <p className="mb-2 text-[13px] text-muted-foreground">Документов нет.</p>
        )}
        {docs.map((d, i) => (
          <DocPanel
            key={d.id}
            doc={d}
            editMode={editMode}
            onChange={(patch) => patchDoc(i, patch)}
            onRemove={() => onChange({ militaryDocs: docs.filter((_, k) => k !== i) })}
            onOpenScans={onOpenScans}
          />
        ))}
        {!ro && (
          <AddButton
            label="＋ Добавить документ"
            onClick={() => onChange({ militaryDocs: [...docs, mkDoc()] })}
          />
        )}
      </Section>
    </div>
  );
}
