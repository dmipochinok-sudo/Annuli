import {
  AddButton,
  CardItem,
  Row,
  Section,
  TextArea,
  TextField,
} from "@/components/annuli/PersonBasic";
import { PagesEditor } from "@/components/annuli/PagesEditor";
import { mkDoc, type Doc, type Page, type Person } from "@/lib/annuli/types";

interface Props {
  person: Person;
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
  onOpenScans: (pages: Page[], index: number) => void;
}

export function PersonDocs({ person: p, editMode, onChange, onOpenScans }: Props) {
  const ro = !editMode;
  const patchDoc = (id: string, patch: Partial<Doc>) =>
    onChange({ documents: p.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) });

  return (
    <div>
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

      <Section title="Документ о смерти">
        <Row>
          <TextField
            label="Название"
            value={p.deathDocName}
            readOnly={ro}
            onChange={(v) => onChange({ deathDocName: v })}
          />
          <TextField
            label="Архив"
            value={p.deathDocArchive}
            readOnly={ro}
            onChange={(v) => onChange({ deathDocArchive: v })}
          />
          <TextField
            label="Фонд"
            value={p.deathDocFund}
            readOnly={ro}
            onChange={(v) => onChange({ deathDocFund: v })}
          />
          <TextField
            label="Опись"
            value={p.deathDocOpis}
            readOnly={ro}
            onChange={(v) => onChange({ deathDocOpis: v })}
          />
          <TextField
            label="Дело"
            value={p.deathDocDelo}
            readOnly={ro}
            onChange={(v) => onChange({ deathDocDelo: v })}
          />
          <TextField
            label="Лист"
            value={p.deathDocList}
            readOnly={ro}
            onChange={(v) => onChange({ deathDocList: v })}
          />
        </Row>
        <PagesEditor
          label="Сканы метрики о смерти"
          pages={p.deathDocPages}
          editMode={editMode}
          onChange={(pages) => onChange({ deathDocPages: pages })}
          onOpen={onOpenScans}
        />
      </Section>

      <Section title={`Прочие документы (${p.documents.length})`}>
        {p.documents.length === 0 && (
          <p className="mb-2 text-[12px] text-muted-foreground">Документы не добавлены</p>
        )}
        {p.documents.map((d, i) => (
          <CardItem
            key={d.id}
            readOnly={ro}
            title={d.name || `Документ ${i + 1}`}
            onRemove={() => onChange({ documents: p.documents.filter((x) => x.id !== d.id) })}
          >
            <Row>
              <TextField
                label="Название"
                value={d.name}
                readOnly={ro}
                onChange={(v) => patchDoc(d.id, { name: v })}
              />
              <TextField
                label="Архив"
                value={d.archive}
                readOnly={ro}
                onChange={(v) => patchDoc(d.id, { archive: v })}
              />
              <TextField
                label="Фонд"
                value={d.fund}
                readOnly={ro}
                onChange={(v) => patchDoc(d.id, { fund: v })}
              />
              <TextField
                label="Опись"
                value={d.opis}
                readOnly={ro}
                onChange={(v) => patchDoc(d.id, { opis: v })}
              />
              <TextField
                label="Дело"
                value={d.delo}
                readOnly={ro}
                onChange={(v) => patchDoc(d.id, { delo: v })}
              />
              <TextField
                label="Лист"
                value={d.list}
                readOnly={ro}
                onChange={(v) => patchDoc(d.id, { list: v })}
              />
            </Row>
            <TextArea
              label="Транскрипция"
              value={d.transcription}
              readOnly={ro}
              onChange={(v) => patchDoc(d.id, { transcription: v })}
            />
            <div className="mt-2.5">
              <TextArea
                label="Комментарий"
                rows={2}
                value={d.comment}
                readOnly={ro}
                onChange={(v) => patchDoc(d.id, { comment: v })}
              />
            </div>
            <PagesEditor
              label="Сканы документа"
              pages={d.pages}
              editMode={editMode}
              onChange={(pages) => patchDoc(d.id, { pages })}
              onOpen={onOpenScans}
            />
          </CardItem>
        ))}
        {!ro && (
          <AddButton
            label="+ Добавить документ"
            onClick={() => onChange({ documents: [...p.documents, mkDoc()] })}
          />
        )}
      </Section>
    </div>
  );
}
