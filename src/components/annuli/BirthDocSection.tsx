import { useRef, useState } from "react";
import {
  Copy,
  Download,
  Eye,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  FilePlus2,
  RefreshCw,
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

const labelCls = "pl-2 text-[12px] leading-3 text-muted-foreground";

/** Поле «подпись — значение»: в режиме просмотра без рамки, в редактировании — инпут. */
function Field({
  label,
  value,
  readOnly,
  onChange,
  className,
  multiline,
}: {
  label: string;
  value: string;
  readOnly: boolean;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className={labelCls}>{label}</span>
      {readOnly ? (
        multiline ? (
          <p className="whitespace-pre-wrap px-3 py-1 text-[14px] leading-5 text-foreground">
            {value || "—"}
          </p>
        ) : (
          <span
            className="truncate px-3 py-1.5 text-[14px] leading-4 text-foreground"
            title={value}
          >
            {value || "—"}
          </span>
        )
      ) : multiline ? (
        <textarea
          rows={12}
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          className="w-full resize-y rounded-lg border-[0.5px] border-border bg-surface-dark p-3 text-[14px] leading-5 text-foreground outline-none transition focus:border-stroke-bright"
        />
      ) : (
        <div className="flex h-8 items-center gap-1 rounded-lg border-[0.5px] border-border bg-surface-dark px-3 transition focus-within:border-stroke-bright">
          <input
            value={value}
            onChange={(ev) => onChange(ev.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[14px] leading-4 text-foreground outline-none"
          />
          <button
            type="button"
            title="Копировать"
            onClick={() => copy(value)}
            className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground transition hover:text-foreground"
          >
            <Copy className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
  disabled,
  danger,
  grow,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  grow?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg pl-3 pr-4 text-[14px] leading-4 transition",
        grow && "flex-1",
        danger
          ? "border border-destructive text-destructive hover:bg-destructive/10"
          : "border-[0.5px] border-border bg-surface-light text-foreground hover:border-stroke-bright",
        "disabled:cursor-not-allowed disabled:opacity-40",
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
        "flex flex-col items-center gap-2 rounded-2xl border-[0.5px] p-2 transition",
        active
          ? "border-stroke-bright bg-surface-light"
          : "border-border bg-card hover:border-stroke-bright",
      )}
    >
      <span className="block h-[126px] w-full overflow-hidden rounded-lg bg-muted">
        {url ? (
          <img
            src={url}
            alt={page.imageName || `Страница ${index + 1}`}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <ImageIcon className="size-6" />
          </span>
        )}
      </span>
      <span
        className={cn(
          "text-[12px] leading-3",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        стр. {index + 1}
      </span>
    </button>
  );
}

/** Блок «Документы о рождении». */
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
      pages.map((pg, i) => (i === sel ? { ...pg, imageId, imageName: file.name, thumb } : pg)),
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
    <section className="mb-4 overflow-hidden rounded-lg border border-border bg-card">
      <h3 className="flex h-10 items-center gap-3 border-b border-border bg-surface-light px-3 text-[14px] font-semibold uppercase leading-4 tracking-[0.04em]">
        <Eye aria-hidden className="size-4" />
        Документы о рождении
      </h3>

      <div className="flex flex-col gap-7 px-4 pb-10 pt-8 sm:px-8">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field
              label="Название документа"
              value={p.birthDocName}
              readOnly={ro}
              className="col-span-2"
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
              onChange={(v) => onChange({ birthDocId: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Field
              label="Архив"
              value={p.birthDocArchive}
              readOnly={ro}
              className="col-span-2 sm:col-span-1"
              onChange={(v) => onChange({ birthDocArchive: v })}
            />
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

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <Field
              label="Ссылка"
              value={p.birthDocPath || ""}
              readOnly={ro}
              className="min-w-0 flex-1"
              onChange={(v) => onChange({ birthDocPath: v })}
            />
            <div className="flex gap-3">
              <ToolButton
                icon={<Copy className="size-4" />}
                label="Копировать ссылку"
                disabled={!p.birthDocPath}
                onClick={() => copy(p.birthDocPath || "")}
              />
              <ToolButton
                icon={<Globe className="size-4" />}
                label="Перейти"
                disabled={!p.birthDocPath}
                onClick={() => window.open(p.birthDocPath, "_blank", "noopener")}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
                className="flex flex-col items-center gap-2 rounded-2xl border-[0.5px] border-border bg-surface-dark p-2 transition hover:border-stroke-bright"
              >
                <span className="grid h-[126px] w-full place-items-center rounded-lg text-muted-foreground">
                  <FilePlus2 className="size-12" />
                </span>
                <span className="text-[12px] leading-3 text-muted-foreground">
                  Добавить страницу
                </span>
              </button>
            )}
            {pages.length === 0 && ro && (
              <p className="text-[13px] text-muted-foreground">Сканы не добавлены</p>
            )}
          </div>

          <Field
            label="Расшифровка записи"
            value={selPage?.transcription || ""}
            readOnly={ro || !selPage}
            multiline
            onChange={(v) =>
              setPages(pages.map((pg, i) => (i === sel ? { ...pg, transcription: v } : pg)))
            }
          />

          <Field
            label="Комментарии к документу"
            value={selPage?.comment || ""}
            readOnly={ro || !selPage}
            onChange={(v) =>
              setPages(pages.map((pg, i) => (i === sel ? { ...pg, comment: v } : pg)))
            }
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,.tif,.tiff"
          className="hidden"
          onChange={(ev) => void onFile(ev.target.files?.[0])}
        />

        <div className="flex flex-nowrap gap-2 overflow-x-auto">
          {!ro && (
            <ToolButton
              grow
              icon={<RefreshCw className="size-4" />}
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
            grow
            icon={<Copy className="size-4" />}
            label="Копировать текст"
            disabled={!selPage?.transcription}
            onClick={() => copy(selPage?.transcription || "")}
          />
          <ToolButton
            grow
            icon={<FolderOpen className="size-4" />}
            label="Показать в папке"
            disabled={!selPage?.imageId}
            onClick={() => onOpenScans(pages, sel)}
          />
          <ToolButton
            grow
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
