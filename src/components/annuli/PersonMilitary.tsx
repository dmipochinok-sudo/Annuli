import { Row, Section, TextArea, TextField } from "@/components/annuli/PersonBasic";
import { PagesEditor } from "@/components/annuli/PagesEditor";
import type { Military, Page, Person } from "@/lib/annuli/types";

interface Props {
  person: Person;
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
  onOpenScans: (pages: Page[], index: number) => void;
}

export function PersonMilitary({ person: p, editMode, onChange, onOpenScans }: Props) {
  const ro = !editMode;
  const m = p.military;
  const set = (patch: Partial<Military>) => onChange({ military: { ...m, ...patch } });

  return (
    <div>
      <Section title="Военная служба">
        <Row>
          <TextField
            label="Часть / подразделение"
            value={m.unit}
            readOnly={ro}
            onChange={(v) => set({ unit: v })}
          />
          <TextField label="Звание" value={m.rank} readOnly={ro} onChange={(v) => set({ rank: v })} />
          <TextField
            label="Должность"
            value={m.position}
            readOnly={ro}
            onChange={(v) => set({ position: v })}
          />
        </Row>
        <Row>
          <TextField
            label="Служба с"
            value={m.serviceFrom}
            readOnly={ro}
            onChange={(v) => set({ serviceFrom: v })}
          />
          <TextField
            label="Служба по"
            value={m.serviceTo}
            readOnly={ro}
            onChange={(v) => set({ serviceTo: v })}
          />
          <TextField
            label="Война / конфликт"
            value={m.conflict}
            readOnly={ro}
            onChange={(v) => set({ conflict: v })}
          />
        </Row>
        <TextArea
          label="Ранения"
          rows={2}
          value={m.wounds}
          readOnly={ro}
          onChange={(v) => set({ wounds: v })}
        />
        <div className="mt-2.5">
          <TextArea
            label="Награды"
            rows={2}
            value={m.awards}
            readOnly={ro}
            onChange={(v) => set({ awards: v })}
          />
        </div>
        <div className="mt-2.5">
          <TextArea
            label="Гибель / выбытие"
            rows={2}
            value={m.death}
            readOnly={ro}
            onChange={(v) => set({ death: v })}
          />
        </div>
      </Section>

      <Section title="Архивная ссылка">
        <Row>
          <TextField
            label="Архив"
            value={m.archive}
            readOnly={ro}
            onChange={(v) => set({ archive: v })}
          />
          <TextField label="Фонд" value={m.fund} readOnly={ro} onChange={(v) => set({ fund: v })} />
          <TextField label="Опись" value={m.opis} readOnly={ro} onChange={(v) => set({ opis: v })} />
          <TextField label="Дело" value={m.delo} readOnly={ro} onChange={(v) => set({ delo: v })} />
          <TextField label="Лист" value={m.list} readOnly={ro} onChange={(v) => set({ list: v })} />
        </Row>
        <PagesEditor
          label="Сканы документов службы"
          pages={m.pages}
          editMode={editMode}
          onChange={(pages) => set({ pages })}
          onOpen={onOpenScans}
        />
      </Section>
    </div>
  );
}
