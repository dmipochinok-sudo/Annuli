import { useRef } from "react";

import { TextField } from "@/components/annuli/PersonBasic";
import { useImageUrl } from "@/hooks/use-image-url";
import { imgDel, imgPut } from "@/lib/annuli/db";
import { fullName } from "@/lib/annuli/format";
import { uid, type Person } from "@/lib/annuli/types";

export interface LinkCardValue {
  personIndex?: string | undefined;
  firstName?: string | undefined;
  patronymic?: string | undefined;
  lastName?: string | undefined;
  linkedId?: string | undefined;
  avatarImageId?: string | undefined;
}

interface Props {
  title: string;
  value: LinkCardValue;
  persons: Person[];
  editMode: boolean;
  onChange: (patch: LinkCardValue) => void;
  onRemove: () => void;
  onOpenPerson: (id: string) => void;
  /** Не показывать кнопку связи (крёстные не заводятся как персоны базы). */
  noLink?: boolean;
}

/** Карточка родственника: аватар, кнопка-имя связанной персоны, ФИО и индекс. */
export function PersonLinkCard({
  title,
  value,
  persons,
  editMode,
  onChange,
  onRemove,
  onOpenPerson,
  noLink,
}: Props) {
  const ro = !editMode;
  const linked = value.linkedId ? persons.find((x) => x.id === value.linkedId) : undefined;
  const avatarId = linked?.avatarImageId || value.avatarImageId;
  const url = useImageUrl(avatarId, linked?.avatarThumb);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (value.avatarImageId) await imgDel(value.avatarImageId).catch(() => {});
    const imageId = `img_${uid()}`;
    await imgPut(imageId, file);
    onChange({ avatarImageId: imageId });
  };

  return (
    <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(ev) => void onFile(ev.target.files?.[0])}
      />
      <button
        type="button"
        title={editMode ? "Загрузить фото" : undefined}
        onClick={() => {
          if (!editMode || linked) return;
          if (fileRef.current) {
            fileRef.current.value = "";
            fileRef.current.click();
          }
        }}
        className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted text-[20px] text-muted-foreground"
      >
        {url ? (
          <img src={url} alt={title} className="size-full object-cover" />
        ) : (
          <span aria-hidden>{editMode && !linked ? "＋" : "☺"}</span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold uppercase tracking-[0.04em]">{title}</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {!noLink && linked && (
              <button
                type="button"
                onClick={() => onOpenPerson(linked.id)}
                className="h-8 rounded-lg border border-link px-3 text-[13px] text-link transition hover:bg-link/10"
              >
                {fullName(linked) || "Персона"}
              </button>
            )}
            {!ro && (
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
        <div className="grid gap-2.5 sm:grid-cols-[120px_repeat(3,minmax(0,1fr))]">
          <TextField
            label="Индекс"
            value={value.personIndex || ""}
            readOnly={ro}
            onChange={(v) => onChange({ personIndex: v })}
          />
          <TextField
            label="Имя"
            value={value.firstName || ""}
            readOnly={ro}
            onChange={(v) => onChange({ firstName: v })}
          />
          <TextField
            label="Отчество"
            value={value.patronymic || ""}
            readOnly={ro}
            onChange={(v) => onChange({ patronymic: v })}
          />
          <TextField
            label="Фамилия"
            value={value.lastName || ""}
            readOnly={ro}
            onChange={(v) => onChange({ lastName: v })}
          />
        </div>
      </div>
    </div>
  );
}
