import { AddButton, CardItem, Row, Section, TextField } from "@/components/annuli/PersonBasic";
import { DocPanel } from "@/components/annuli/DocPanel";
import { mkDoc, mkEducation, type Doc, type Education, type Page, type Person } from "@/lib/annuli/types";

interface Props {
  person: Person;
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
  onOpenScans: (pages: Page[], index: number) => void;
}

/** Вкладка «Учёба»: учебные заведения и связанные документы. */
export function PersonEducation({ person: p, editMode, onChange, onOpenScans }: Props) {
  const ro = !editMode;
  const list = p.educations || [];
  const docs = p.educationDocs || [];

  const patchEdu = (i: number, patch: Partial<Education>) =>
    onChange({ educations: list.map((e, k) => (k === i ? { ...e, ...patch } : e)) });
  const patchDoc = (i: number, patch: Partial<Doc>) =>
    onChange({ educationDocs: docs.map((d, k) => (k === i ? { ...d, ...patch } : d)) });

  return (
    <div>
      <Section title="Учебные заведения">
        {list.length === 0 && (
          <p className="mb-2 text-[13px] text-muted-foreground">Записей нет.</p>
        )}
        {list.map((e, i) => (
          <CardItem
            key={e.id}
            readOnly={ro}
            title={e.school || `Место учёбы ${i + 1}`}
            onRemove={() => onChange({ educations: list.filter((_, k) => k !== i) })}
          >
            <Row>
              <TextField
                label="Учебное заведение"
                value={e.school}
                readOnly={ro}
                onChange={(v) => patchEdu(i, { school: v })}
              />
              <TextField
                label="Специальность"
                value={e.speciality}
                readOnly={ro}
                onChange={(v) => patchEdu(i, { speciality: v })}
              />
            </Row>
            <Row>
              <TextField
                label="Дата поступления"
                value={e.dateFrom}
                readOnly={ro}
                onChange={(v) => patchEdu(i, { dateFrom: v })}
              />
              <TextField
                label="Дата окончания"
                value={e.dateTo}
                readOnly={ro}
                onChange={(v) => patchEdu(i, { dateTo: v })}
              />
              <TextField
                label="Место"
                value={e.place}
                readOnly={ro}
                onChange={(v) => patchEdu(i, { place: v })}
              />
            </Row>
            <Row>
              <TextField
                label="Фонд"
                value={e.fund}
                readOnly={ro}
                onChange={(v) => patchEdu(i, { fund: v })}
              />
              <TextField
                label="Опись"
                value={e.opis}
                readOnly={ro}
                onChange={(v) => patchEdu(i, { opis: v })}
              />
              <TextField
                label="Дело"
                value={e.delo}
                readOnly={ro}
                onChange={(v) => patchEdu(i, { delo: v })}
              />
              <TextField
                label="Лист"
                value={e.list}
                readOnly={ro}
                onChange={(v) => patchEdu(i, { list: v })}
              />
            </Row>
          </CardItem>
        ))}
        {!ro && (
          <AddButton
            label="＋ Добавить место учёбы"
            onClick={() => onChange({ educations: [...list, mkEducation()] })}
          />
        )}
      </Section>

      <Section title="Документы об учёбе">
        {docs.length === 0 && (
          <p className="mb-2 text-[13px] text-muted-foreground">Документов нет.</p>
        )}
        {docs.map((d, i) => (
          <DocPanel
            key={d.id}
            doc={d}
            editMode={editMode}
            onChange={(patch) => patchDoc(i, patch)}
            onRemove={() => onChange({ educationDocs: docs.filter((_, k) => k !== i) })}
            onOpenScans={onOpenScans}
          />
        ))}
        {!ro && (
          <AddButton
            label="＋ Добавить документ"
            onClick={() => onChange({ educationDocs: [...docs, mkDoc()] })}
          />
        )}
      </Section>
    </div>
  );
}
