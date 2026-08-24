import { useEffect, useRef, useState } from "react";

import { imgDel, imgGet, imgPut } from "@/lib/annuli/db";
import { makeThumbnail } from "@/lib/annuli/media";
import { mkPage, uid, type Page } from "@/lib/annuli/types";

interface Props {
  label?: string;
  pages: Page[];
  editMode: boolean;
  onChange: (pages: Page[]) => void;
  /** Открыть скан в лайтбоксе. */
  onOpen: (pages: Page[], index: number) => void;
}

const MAX_PAGES = 30;

/** Список сканов документа: загрузка файла, миниатюра, транскрипция, просмотр. */
export function PagesEditor({ label = "Сканы", pages, editMode, onChange, onOpen }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const targetIdx = useRef<number>(-1);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    const urls: string[] = [];
    (async () => {
      const next: Record<string, string> = {};
      for (const pg of pages) {
        if (!pg.imageId) continue;
        if (pg.thumb) {
          next[pg.imageId] = pg.thumb;
          continue;
        }
        const blob = await imgGet(pg.imageId).catch(() => null);
        if (!blob) continue;
        const u = URL.createObjectURL(blob);
        urls.push(u);
        next[pg.imageId] = u;
      }
      if (alive) setThumbs(next);
      else urls.forEach((u) => URL.revokeObjectURL(u));
    })();
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [pages]);

  const patchPage = (i: number, patch: Partial<Page>) =>
    onChange(pages.map((pg, k) => (k === i ? { ...pg, ...patch } : pg)));

  const pickFor = (i: number) => {
    targetIdx.current = i;
    if (fileRef.current) {
      fileRef.current.value = "";
      fileRef.current.click();
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const i = targetIdx.current;
    if (i < 0) return;
    if (file.size > 50 * 1024 * 1024) {
      alert("Файл слишком большой (>50 МБ)");
      return;
    }
    const prev = pages[i];
    if (prev?.imageId) await imgDel(prev.imageId).catch(() => {});
    const imageId = `img_${uid()}`;
    await imgPut(imageId, file);
    const thumb = file.type.startsWith("image/") ? await makeThumbnail(file) : "";
    patchPage(i, { imageId, imageName: file.name, thumb });
  };

  return (
    <div className="mt-3">
      <input
        ref={fileRef}
        type="file"
        accept=".tif,.tiff,.jpg,.jpeg,.png,.webp,image/*"
        className="hidden"
        onChange={(ev) => void onFile(ev.target.files?.[0])}
      />
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {label} ({pages.length})
        </span>
        {editMode && pages.length < MAX_PAGES && (
          <button
            type="button"
            onClick={() => onChange([...pages, mkPage()])}
            className="rounded-md border border-dashed border-primary/50 px-2 py-1 text-[12px] text-primary hover:bg-primary/10"
          >
            + Страница
          </button>
        )}
      </div>

      {pages.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">Сканы не добавлены</p>
      ) : (
        <div className="flex flex-col gap-2">
          {pages.map((pg, i) => (
            <div
              key={pg.id || i}
              className="flex flex-col gap-2 rounded-lg border border-border p-2 sm:flex-row"
            >
              <div className="shrink-0">
                {pg.imageId ? (
                  <button
                    type="button"
                    onClick={() => onOpen(pages, i)}
                    className="block size-24 overflow-hidden rounded-md border border-border bg-muted"
                    title="Открыть скан"
                  >
                    {thumbs[pg.imageId] ? (
                      <img
                        src={thumbs[pg.imageId]}
                        alt={pg.imageName || `Скан ${i + 1}`}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-[11px] text-muted-foreground">
                        …
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="grid size-24 place-items-center rounded-md border border-dashed border-border text-[11px] text-muted-foreground">
                    нет скана
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="truncate text-[12px] text-muted-foreground">
                    {pg.imageName || `Страница ${i + 1}`}
                  </span>
                  {editMode && (
                    <>
                      <button
                        type="button"
                        onClick={() => pickFor(i)}
                        className="rounded-md border border-border px-2 py-0.5 text-[12px] hover:bg-muted"
                      >
                        {pg.imageId ? "Заменить" : "Загрузить"}
                      </button>
                      {pg.imageId && (
                        <button
                          type="button"
                          onClick={async () => {
                            await imgDel(pg.imageId).catch(() => {});
                            patchPage(i, { imageId: "", imageName: "", thumb: "" });
                          }}
                          className="rounded-md border border-border px-2 py-0.5 text-[12px] hover:bg-muted"
                        >
                          Убрать скан
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (pg.imageId) await imgDel(pg.imageId).catch(() => {});
                          onChange(pages.filter((_, k) => k !== i));
                        }}
                        className="rounded-md border border-destructive/40 px-2 py-0.5 text-[12px] text-destructive hover:bg-destructive/10"
                      >
                        Удалить страницу
                      </button>
                    </>
                  )}
                </div>
                {editMode ? (
                  <textarea
                    rows={3}
                    value={pg.transcription || ""}
                    placeholder="Транскрипция страницы"
                    onChange={(ev) => patchPage(i, { transcription: ev.target.value })}
                    className="w-full resize-y rounded-md border border-border bg-card px-2.5 py-2 text-[13px] outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-[13px]">{pg.transcription || "—"}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
