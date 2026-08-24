import { AddButton, CardItem, Row, Section, TextField } from "@/components/annuli/PersonBasic";
import { DocPanel } from "@/components/annuli/DocPanel";
import { mkDoc, mkJob, type Doc, type Job, type Page, type Person } from "@/lib/annuli/types";

interface Props {
  person: Person;
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
  onOpenScans: (pages: Page[], index: number) => void;
}

/** Вкладка «Карьера»: места работы и документы о трудовой деятельности. */
export function PersonCareer({ person: p, editMode, onChange, onOpenScans }: Props) {
  const ro = !editMode;
  const jobs = p.jobs || [];
  const docs = p.jobDocs || [];

  const patchJob = (i: number, patch: Partial<Job>) =>
    onChange({ jobs: jobs.map((j, k) => (k === i ? { ...j, ...patch } : j)) });
  const patchDoc = (i: number, patch: Partial<Doc>) =>
    onChange({ jobDocs: docs.map((d, k) => (k === i ? { ...d, ...patch } : d)) });

  return (
    <div>
      <Section title="Места работы">
        {jobs.length === 0 && <p className="mb-2 text-[13px] text-muted-foreground">Записей нет.</p>}
        {jobs.map((j, i) => (
          <CardItem
            key={j.id}
            readOnly={ro}
            title={j.employer || `Место работы ${i + 1}`}
            onRemove={() => onChange({ jobs: jobs.filter((_, k) => k !== i) })}
          >
            <Row>
              <TextField
                label="Организация"
                value={j.employer}
                readOnly={ro}
                onChange={(v) => patchJob(i, { employer: v })}
              />
              <TextField
                label="Подразделение"
                value={j.division}
                readOnly={ro}
                onChange={(v) => patchJob(i, { division: v })}
              />
              <TextField
                label="Должность"
                value={j.position}
                readOnly={ro}
                onChange={(v) => patchJob(i, { position: v })}
              />
            </Row>
            <Row>
              <TextField
                label="Дата приёма"
                value={j.dateFrom}
                readOnly={ro}
                onChange={(v) => patchJob(i, { dateFrom: v })}
              />
              <TextField
                label="Дата увольнения"
                value={j.dateTo}
                readOnly={ro}
                onChange={(v) => patchJob(i, { dateTo: v })}
              />
              <TextField
                label="Причина увольнения"
                value={j.endReason}
                readOnly={ro}
                onChange={(v) => patchJob(i, { endReason: v })}
              />
              <TextField
                label="Место"
                value={j.place}
                readOnly={ro}
                onChange={(v) => patchJob(i, { place: v })}
              />
            </Row>
          </CardItem>
        ))}
        {!ro && (
          <AddButton
            label="＋ Добавить место работы"
            onClick={() => onChange({ jobs: [...jobs, mkJob()] })}
          />
        )}
      </Section>

      <Section title="Документы о работе">
        {docs.length === 0 && (
          <p className="mb-2 text-[13px] text-muted-foreground">Документов нет.</p>
        )}
        {docs.map((d, i) => (
          <DocPanel
            key={d.id}
            doc={d}
            editMode={editMode}
            onChange={(patch) => patchDoc(i, patch)}
            onRemove={() => onChange({ jobDocs: docs.filter((_, k) => k !== i) })}
            onOpenScans={onOpenScans}
          />
        ))}
        {!ro && (
          <AddButton
            label="＋ Добавить документ"
            onClick={() => onChange({ jobDocs: [...docs, mkDoc()] })}
          />
        )}
      </Section>
    </div>
  );
}
