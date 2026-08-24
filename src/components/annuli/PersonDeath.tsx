import { CheckField, Row, Section, TextField } from "@/components/annuli/PersonBasic";
import { PagesEditor } from "@/components/annuli/PagesEditor";
import type { Page, Person } from "@/lib/annuli/types";

interface Props {
  person: Person;
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
  onOpenScans: (pages: Page[], index: number) => void;
}

/** Вкладка «Смерть»: дата и место, погребение, метрика о смерти. */
export function PersonDeath({ person: p, editMode, onChange, onOpenScans }: Props) {
  const ro = !editMode;

  return (
    <div>
      <Section title="Дата и место смерти">
        <CheckField
          label="Приблизительная дата"
          checked={p.deathDateApprox}
          readOnly={ro}
          onChange={(v) => onChange({ deathDateApprox: v })}
        />
        <div className="mt-2.5">
          <Row>
            {p.deathDateApprox ? (
              <>
                <TextField
                  label="Год от"
                  value={p.deathYearFrom}
                  readOnly={ro}
                  onChange={(v) => onChange({ deathYearFrom: v })}
                />
                <TextField
                  label="Год до"
                  value={p.deathYearTo}
                  readOnly={ro}
                  onChange={(v) => onChange({ deathYearTo: v })}
                />
              </>
            ) : (
              <TextField
                label="Дата смерти"
                value={p.deathDate}
                readOnly={ro}
                placeholder="дд.мм.гггг или год"
                onChange={(v) => onChange({ deathDate: v })}
              />
            )}
            <TextField
              label="Место смерти"
              value={p.deathPlace}
              readOnly={ro}
              onChange={(v) => onChange({ deathPlace: v })}
            />
          </Row>
        </div>
        <Row>
          <TextField
            label="Причина смерти"
            value={p.deathCause}
            readOnly={ro}
            onChange={(v) => onChange({ deathCause: v })}
          />
          <TextField
            label="Место погребения"
            value={p.burialPlace}
            readOnly={ro}
            onChange={(v) => onChange({ burialPlace: v })}
          />
        </Row>
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
        <div className="mb-2.5">
          <TextField
            label="Онлайн-ссылка"
            value={p.deathDocPath}
            readOnly={ro}
            onChange={(v) => onChange({ deathDocPath: v })}
          />
        </div>
        <PagesEditor
          label="Сканы метрики о смерти"
          pages={p.deathDocPages}
          editMode={editMode}
          onChange={(pages) => onChange({ deathDocPages: pages })}
          onOpen={onOpenScans}
        />
      </Section>
    </div>
  );
}
