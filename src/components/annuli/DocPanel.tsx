import { Row, TextArea, TextField } from "@/components/annuli/PersonBasic";
import { PagesEditor } from "@/components/annuli/PagesEditor";
import type { Doc, Page } from "@/lib/annuli/types";

interface Props {
  doc: Doc;
  title?: string;
  editMode: boolean;
  onChange: (patch: Partial<Doc>) => void;
  onRemove?: () => void;
  onOpenScans: (pages: Page[], index: number) => void;
}

/** Карточка документа: реквизиты архива, расшифровка, ссылка и сканы. */
export function DocPanel({ doc: d, title, editMode, onChange, onRemove, onOpenScans }: Props) {
  const ro = !editMode;
  return (
    <div className="mb-3 rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[14px] font-semibold uppercase tracking-[0.04em]">
          {title || d.name || "Документ"}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {d.path && (
            <a
              href={d.path}
              target="_blank"
              rel="noreferrer"
              className="h-8 rounded-lg border border-link px-3 text-[13px] leading-8 text-link transition hover:bg-link/10"
            >
              Перейти к источнику
            </a>
          )}
          {!ro && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="h-8 rounded-lg border border-destructive/60 px-3 text-[13px] text-destructive transition hover:bg-destructive/10"
            >
              Удалить
            </button>
          )}
        </div>
      </div>

      <Row>
        <TextField
          label="Номер документа"
          value={d.docId}
          readOnly={ro}
          onChange={(v) => onChange({ docId: v })}
        />
        <TextField
          label="Название"
          value={d.name}
          readOnly={ro}
          onChange={(v) => onChange({ name: v })}
        />
        <TextField
          label="Дата документа"
          value={d.date || ""}
          readOnly={ro}
          onChange={(v) => onChange({ date: v })}
        />
      </Row>
      <Row>
        <TextField
          label="Архив"
          value={d.archive}
          readOnly={ro}
          onChange={(v) => onChange({ archive: v })}
        />
        <TextField
          label="Фонд"
          value={d.fund}
          readOnly={ro}
          onChange={(v) => onChange({ fund: v })}
        />
        <TextField
          label="Опись"
          value={d.opis}
          readOnly={ro}
          onChange={(v) => onChange({ opis: v })}
        />
        <TextField
          label="Дело"
          value={d.delo}
          readOnly={ro}
          onChange={(v) => onChange({ delo: v })}
        />
        <TextField
          label="Лист"
          value={d.list}
          readOnly={ro}
          onChange={(v) => onChange({ list: v })}
        />
      </Row>
      <div className="mb-2.5">
        <TextField
          label="Онлайн-ссылка"
          value={d.path}
          readOnly={ro}
          onChange={(v) => onChange({ path: v })}
        />
      </div>
      <TextArea
        label="Расшифровка"
        value={d.transcription}
        readOnly={ro}
        onChange={(v) => onChange({ transcription: v })}
      />
      <div className="mt-2.5">
        <TextArea
          label="Комментарий"
          rows={2}
          value={d.comment}
          readOnly={ro}
          onChange={(v) => onChange({ comment: v })}
        />
      </div>
      <PagesEditor
        label="Сканы документа"
        pages={d.pages}
        editMode={editMode}
        onChange={(pages) => onChange({ pages })}
        onOpen={onOpenScans}
      />
    </div>
  );
}
