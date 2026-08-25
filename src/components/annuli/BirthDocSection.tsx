import { useRef, useState } from "react";
import {
  Copy,
  Download,
  Eye,
  FolderOpen,
  ExternalLink,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";

import { useImageUrl } from "@/hooks/use-image-url";
import { imgDel, imgGet, imgPut } from "@/lib/annuli/db";
import { makeThumbnail } from "@/lib/annuli/media";
import { mkPage, uid, type Page, type Person } from "@/lib/annuli/types";
import { cn } from "@/lib/utils";

interface Props {
  person: Person;
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
  onOpenScans: (pages: Page[], index: number) => void;
}

const copy = (text: string) => {
  if (!text) return;
  void navigator.clipboard?.writeText(text);
};

/** Поле «подпись — значение» с кнопкой копирования справа. */
function Field({
  label,
  value,
  readOnly,
  onChange,
  className,
  mono,
}: {
  label: string;
  value: string;
  readOnly: boolean;
  onChange: (v: string) => void;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="pl-1 text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-dark px-3 transition focus-within:border-stroke-bright">
        {readOnly ? (
          <span
            className={cn(
              "min-w-0 flex-1 truncate py-2 text-[14px] text-foreground",
              mono && "font-mono text-[13px]",
            )}
            title={value}
          >
            {value || "—"}
          </span>
        ) : (
          <input
            value={value}
            onChange={(ev) => onChange(ev.target.value)}
            className={cn(
              "min-w-0 flex-1 bg-transparent py-2 text-[14px] text-foreground outline-none",
              mono && "font-mono text-[13px]",
            )}
          />
        )}
        <button
          type="button"
          title="Копировать"
          onClick={() => copy(value)}
          className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Copy className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-surface-dark px-3 text-[13px] transition",
        "hover:border-stroke-bright hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
        danger && "border-destructive/40 text-destructive hover:bg-destructive/10",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function PageThumb({
  page,
  index,
  active,
  onSelect,
  onOpen,
}: {
  page: Page;
  index: number;
  active: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const url = useImageUrl(page.imageId, page.thumb);
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      title={page.imageName || `Страница ${index + 1}`}
      className={cn(
        "group relative w-[104px] shrink-0 overflow-hidden rounded-xl border bg-surface-dark text-left transition",
        active ? "border-stroke-bright ring-3 ring-primary/20" : "border-border hover:border-stroke-bright",
      )}
    >
      <span className="block h-[124px] w-full overflow-hidden bg-muted">
        {url ? (
          <img
            src={url}
            alt={page.imageName || `Страница ${index + 1}`}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <ImageIcon className="size-5" />
          </span>
        )}
      </span>
      <span className="block px-2 py-1.5 text-center text-[12px] text-muted-foreground">
        стр. {index + 1}
      </span>
    </button>
  );
}

/** Блок «Документы о рождении» — новая структура дизайна. */
export function BirthDocSection({ person: p, editMode, onChange, onOpenScans }: Props) {
  const ro = !editMode;
  const pages = p.birthDocPages || [];
  const [sel, setSel] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const selPage = pages[sel];

  const setPages = (next: Page[]) => onChange({ birthDocPages: next });

  const onFile = async (file: File | undefined) => {
    if (!file || !selPage) return;
    if (selPage.imageId) await imgDel(selPage.imageId).catch(() => {});
    const imageId = `img_${uid()}`;
    await imgPut(imageId, file);
    const thumb = file.type.startsWith("image/") ? await makeThumbnail(file) : "";
    setPages(
      pages.map((pg, i) =>
        i === sel ? { ...pg, imageId, imageName: file.name, thumb } : pg,
      ),
    );
  };

  const downloadPage = async () => {
    if (!selPage?.imageId) return;
    const blob = await imgGet(selPage.imageId).catch(() => null);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selPage.imageName || `scan-${sel + 1}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-border bg-card">
      <h3 className="flex items-center gap-3 border-b border-border bg-surface-light px-4 py-3 text-[14px] font-semibold uppercase tracking-[0.04em]">
        <Eye aria-hidden className="size-4 text-muted-foreground" />
        Документы о рождении
      </h3>

      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Название документа"
            value={p.birthDocName}
            readOnly={ro}
            className="sm:col-span-2"
            onChange={(v) => onChange({ birthDocName: v })}
          />
          <Field
            label="Дата"
            value={p.birthDocDate || ""}
            readOnly={ro}
            onChange={(v) => onChange({ birthDocDate: v })}
          />
          <Field
            label="Номер документа в базе"
            value={p.birthDocId}
            readOnly={ro}
            mono
            onChange={(v) => onChange({ birthDocId: v })}
          />
          <Field
            label="Архив"
            value={p.birthDocArchive}
            readOnly={ro}
            className="sm:col-span-2"
            onChange={(v) => onChange({ birthDocArchive: v })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field
            label="Фонд"
            value={p.birthDocFund}
            readOnly={ro}
            onChange={(v) => onChange({ birthDocFund: v })}
          />
          <Field
            label="Опись"
            value={p.birthDocOpis}
            readOnly={ro}
            onChange={(v) => onChange({ birthDocOpis: v })}
          />
          <Field
            label="Дело"
            value={p.birthDocDelo}
            readOnly={ro}
            onChange={(v) => onChange({ birthDocDelo: v })}
          />
          <Field
            label="Лист"
            value={p.birthDocList}
            readOnly={ro}
            onChange={(v) => onChange({ birthDocList: v })}
          />
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
          <Field
            label="Ссылка"
            value={p.birthDocPath || ""}
            readOnly={ro}
            className="min-w-0 flex-1"
            mono
            onChange={(v) => onChange({ birthDocPath: v })}
          />
          <div className="flex gap-2">
            <ToolButton
              icon={<Copy className="size-4" />}
              label="Копировать ссылку"
              disabled={!p.birthDocPath}
              onClick={() => copy(p.birthDocPath || "")}
            />
            <ToolButton
              icon={<ExternalLink className="size-4" />}
              label="Перейти"
              disabled={!p.birthDocPath}
              onClick={() => window.open(p.birthDocPath, "_blank", "noopener")}
            />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {pages.map((pg, i) => (
            <PageThumb
              key={pg.id || i}
              page={pg}
              index={i}
              active={i === sel}
              onSelect={() => setSel(i)}
              onOpen={() => onOpenScans(pages, i)}
            />
          ))}
          {!ro && (
            <button
              type="button"
              onClick={() => {
                setPages([...pages, mkPage()]);
                setSel(pages.length);
              }}
              className="grid h-[156px] w-[104px] shrink-0 place-items-center gap-1 rounded-xl border border-dashed border-border text-[12px] text-muted-foreground transition hover:border-stroke-bright hover:text-foreground"
            >
              <Plus className="size-5" />
              Добавить
              <span className="sr-only">страницу</span>
            </button>
          )}
          {pages.length === 0 && ro && (
            <p className="text-[13px] text-muted-foreground">Сканы не добавлены</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="pl-1 text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
            Расшифровка записи
          </span>
          {ro ? (
            <p className="whitespace-pre-wrap rounded-xl border border-border bg-surface-dark p-3 text-[13px] leading-relaxed">
              {selPage?.transcription || "—"}
            </p>
          ) : (
            <textarea
              rows={10}
              value={selPage?.transcription || ""}
              disabled={!selPage}
              onChange={(ev) =>
                setPages(
                  pages.map((pg, i) =>
                    i === sel ? { ...pg, transcription: ev.target.value } : pg,
                  ),
                )
              }
              className="w-full resize-y rounded-xl border border-border bg-surface-dark p-3 text-[13px] leading-relaxed outline-none transition focus:border-stroke-bright disabled:opacity-50"
            />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="pl-1 text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
            Комментарии к документу
          </span>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-dark px-3 transition focus-within:border-stroke-bright">
            {ro ? (
              <span className="flex-1 py-2 text-[13px]">{selPage?.comment || "—"}</span>
            ) : (
              <input
                value={selPage?.comment || ""}
                disabled={!selPage}
                onChange={(ev) =>
                  setPages(
                    pages.map((pg, i) => (i === sel ? { ...pg, comment: ev.target.value } : pg)),
                  )
                }
                className="flex-1 bg-transparent py-2 text-[13px] outline-none disabled:opacity-50"
              />
            )}
            <button
              type="button"
              title="Копировать"
              onClick={() => copy(selPage?.comment || "")}
              className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Copy className="size-3.5" />
            </button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,.tif,.tiff"
          className="hidden"
          onChange={(ev) => void onFile(ev.target.files?.[0])}
        />

        <div className="flex flex-nowrap gap-2 overflow-x-auto border-t border-border pt-4">
          {!ro && (
            <ToolButton
              icon={<ImageIcon className="size-4" />}
              label="Заменить скан"
              disabled={!selPage}
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.value = "";
                  fileRef.current.click();
                }
              }}
            />
          )}
          <ToolButton
            icon={<Copy className="size-4" />}
            label="Копировать текст"
            disabled={!selPage?.transcription}
            onClick={() => copy(selPage?.transcription || "")}
          />
          <ToolButton
            icon={<FolderOpen className="size-4" />}
            label="Показать скан"
            disabled={!selPage?.imageId}
            onClick={() => onOpenScans(pages, sel)}
          />
          <ToolButton
            icon={<Download className="size-4" />}
            label="Скачать фото"
            disabled={!selPage?.imageId}
            onClick={() => void downloadPage()}
          />
          {!ro && (
            <ToolButton
              danger
              icon={<Trash2 className="size-4" />}
              label="Удалить выбранное"
              disabled={!selPage}
              onClick={async () => {
                if (!selPage) return;
                if (selPage.imageId) await imgDel(selPage.imageId).catch(() => {});
                setPages(pages.filter((_, i) => i !== sel));
                setSel((s) => Math.max(0, s - 1));
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
