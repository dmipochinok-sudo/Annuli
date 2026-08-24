import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AddButton,
  Row,
  Section,
  TextArea,
  TextField,
} from "@/components/annuli/PersonBasic";
import { imgDel, imgGet, imgPut } from "@/lib/annuli/db";
import { downloadBlob } from "@/lib/annuli/archive";
import { makeThumbnail, personFolderName } from "@/lib/annuli/media";
import { mkAlbum, mkPhoto, uid, type Album, type Person, type Photo } from "@/lib/annuli/types";

interface Props {
  person: Person;
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
  /** Открыть фото в лайтбоксе. */
  onOpenPhotos: (photos: Photo[], index: number) => void;
}

/** Плитка фотографии в сетке альбома. */
function PhotoTile({
  photo,
  index,
  active,
  onSelect,
  onOpen,
}: {
  photo: Photo;
  index: number;
  active: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const [url, setUrl] = useState(photo.thumb || "");

  useEffect(() => {
    if (photo.thumb) {
      setUrl(photo.thumb);
      return;
    }
    if (!photo.imageId) {
      setUrl("");
      return;
    }
    let alive = true;
    let obj = "";
    imgGet(photo.imageId)
      .then((blob) => {
        if (!alive || !blob) return;
        obj = URL.createObjectURL(blob);
        setUrl(obj);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [photo.imageId, photo.thumb]);

  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      title={photo.title || photo.imageName || `Фото ${index + 1}`}
      className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition ${
        active
          ? "border-primary bg-surface-light"
          : "border-border bg-card hover:border-stroke-bright"
      }`}
    >
      <span className="grid h-28 w-full place-items-center overflow-hidden rounded-lg bg-muted">
        {url ? (
          <img
            src={url}
            alt={photo.title || `Фото ${index + 1}`}
            loading="lazy"
            className="max-h-28 max-w-full object-contain"
          />
        ) : (
          <span className="text-[11px] text-muted-foreground">нет файла</span>
        )}
      </span>
      <span className="truncate text-[11px] text-muted-foreground">
        {photo.photoId || photo.title || `стр. ${index + 1}`}
      </span>
    </button>
  );
}

/** Вкладка «Фотоальбом»: альбомы, сетка снимков и карточка выбранного снимка. */
export function PersonAlbums({ person: p, editMode, onChange, onOpenPhotos }: Props) {
  const ro = !editMode;
  const albums = p.albums || [];
  const [sel, setSel] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const targetAlbum = useRef<string>("");

  const patchAlbum = (id: string, patch: Partial<Album>) =>
    onChange({ albums: albums.map((a) => (a.id === id ? { ...a, ...patch } : a)) });

  const patchPhoto = (albumId: string, photoId: string, patch: Partial<Photo>) => {
    const a = albums.find((x) => x.id === albumId);
    if (!a) return;
    patchAlbum(albumId, {
      photos: a.photos.map((ph) => (ph.id === photoId ? { ...ph, ...patch } : ph)),
    });
  };

  const pickFiles = (albumId: string) => {
    targetAlbum.current = albumId;
    if (fileRef.current) {
      fileRef.current.value = "";
      fileRef.current.click();
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const albumId = targetAlbum.current;
    const a = albums.find((x) => x.id === albumId);
    if (!a) return;
    const added: Photo[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`Файл «${file.name}» больше 50 МБ`);
        continue;
      }
      const imageId = `img_${uid()}`;
      await imgPut(imageId, file);
      const thumb = file.type.startsWith("image/") ? await makeThumbnail(file, 320, 320) : "";
      added.push({
        ...mkPhoto(),
        imageId,
        imageName: file.name,
        thumb,
        title: file.name.replace(/\.[^.]+$/, ""),
      });
    }
    if (!added.length) return;
    patchAlbum(albumId, { photos: [...a.photos, ...added] });
    setSel((s) => ({ ...s, [albumId]: added[0]?.id ?? "" }));
    toast.success(`Добавлено фото: ${added.length}`);
  };

  const caption = (ph: Photo) =>
    [
      ph.title,
      ph.date && `Дата: ${ph.date}`,
      ph.place && `Место: ${ph.place}`,
      ph.photoId && `Номер в базе: ${ph.photoId}`,
      ph.backText && `Надпись на обороте: ${ph.backText}`,
      ph.comment && `Комментарий: ${ph.comment}`,
    ]
      .filter(Boolean)
      .join("\n");

  const copyText = async (text: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(ok);
    } catch {
      toast.error("Буфер обмена недоступен");
    }
  };

  const downloadPhoto = async (ph: Photo) => {
    if (!ph.imageId) return;
    const blob = await imgGet(ph.imageId).catch(() => null);
    if (!blob) {
      toast.error("Файл не найден в базе");
      return;
    }
    downloadBlob(blob, ph.imageName || `${ph.title || "photo"}.jpg`);
  };

  const removePhoto = async (albumId: string, ph: Photo) => {
    const a = albums.find((x) => x.id === albumId);
    if (!a) return;
    if (!confirm("Удалить фотографию из альбома?")) return;
    if (ph.imageId) await imgDel(ph.imageId).catch(() => {});
    patchAlbum(albumId, { photos: a.photos.filter((x) => x.id !== ph.id) });
    setSel((s) => ({ ...s, [albumId]: "" }));
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(ev) => void onFiles(ev.target.files)}
      />

      {albums.length === 0 && (
        <p className="mb-3 text-[13px] text-muted-foreground">Альбомов пока нет.</p>
      )}

      {albums.map((a, ai) => {
        const selectedId = sel[a.id] || a.photos[0]?.id || "";
        const ph = a.photos.find((x) => x.id === selectedId) || null;
        return (
          <Section
            key={a.id}
            title={`Фотоальбом ${a.albumId || ai + 1}${a.name ? ` — ${a.name}` : ""}`}
          >
            <Row>
              <TextField
                label="Название альбома"
                value={a.name}
                readOnly={ro}
                onChange={(v) => patchAlbum(a.id, { name: v })}
              />
              <TextField
                label="Номер альбома"
                value={a.albumId}
                readOnly={ro}
                onChange={(v) => patchAlbum(a.id, { albumId: v })}
              />
            </Row>
            <TextField
              label="Место хранения оригиналов"
              value={a.storage}
              readOnly={ro}
              onChange={(v) => patchAlbum(a.id, { storage: v })}
            />

            <div className="my-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Фотографии ({a.photos.length})
              </span>
              {!ro && (
                <button
                  type="button"
                  onClick={() => pickFiles(a.id)}
                  className="rounded-md border border-dashed border-primary/50 px-2 py-1 text-[12px] text-primary hover:bg-primary/10"
                >
                  + Добавить фото
                </button>
              )}
            </div>

            {a.photos.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">Снимков нет</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {a.photos.map((x, i) => (
                  <PhotoTile
                    key={x.id}
                    photo={x}
                    index={i}
                    active={x.id === selectedId}
                    onSelect={() => setSel((s) => ({ ...s, [a.id]: x.id }))}
                    onOpen={() => onOpenPhotos(a.photos, i)}
                  />
                ))}
              </div>
            )}

            {ph && (
              <div className="mt-4 border-t border-border pt-4">
                <Row>
                  <TextField
                    label="Дата снимка"
                    value={ph.date}
                    readOnly={ro}
                    onChange={(v) => patchPhoto(a.id, ph.id, { date: v })}
                  />
                  <TextField
                    label="Название снимка"
                    value={ph.title}
                    readOnly={ro}
                    onChange={(v) => patchPhoto(a.id, ph.id, { title: v })}
                  />
                  <TextField
                    label="Номер в базе (P.x.x)"
                    value={ph.photoId}
                    readOnly={ro}
                    onChange={(v) => patchPhoto(a.id, ph.id, { photoId: v })}
                  />
                </Row>
                <TextArea
                  label="Надпись на обороте"
                  rows={5}
                  value={ph.backText}
                  readOnly={ro}
                  onChange={(v) => patchPhoto(a.id, ph.id, { backText: v })}
                />
                <TextField
                  label="Место съёмки"
                  value={ph.place}
                  readOnly={ro}
                  onChange={(v) => patchPhoto(a.id, ph.id, { place: v })}
                />
                <TextArea
                  label="Комментарии к фотографии"
                  rows={2}
                  value={ph.comment}
                  readOnly={ro}
                  onChange={(v) => patchPhoto(a.id, ph.id, { comment: v })}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyText(caption(ph), "Подпись скопирована")}
                    className="h-9 rounded-lg border border-border bg-surface-light px-3 text-[13px] transition hover:border-stroke-bright"
                  >
                    ⧉ Копировать подпись
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(
                        `images/${personFolderName(p)}/${ph.imageName || ph.title || ph.id}`,
                        "Путь к файлу в архиве скопирован",
                      )
                    }
                    className="h-9 rounded-lg border border-border bg-surface-light px-3 text-[13px] transition hover:border-stroke-bright"
                  >
                    🗀 Показать в папке
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadPhoto(ph)}
                    className="h-9 rounded-lg border border-border bg-surface-light px-3 text-[13px] transition hover:border-stroke-bright"
                  >
                    ⭳ Скачать фото
                  </button>
                  {!ro && (
                    <button
                      type="button"
                      onClick={() => void removePhoto(a.id, ph)}
                      className="h-9 rounded-lg border border-destructive/60 px-3 text-[13px] text-destructive transition hover:bg-destructive/10"
                    >
                      🗑 Удалить фото
                    </button>
                  )}
                </div>
              </div>
            )}
          </Section>
        );
      })}

      {!ro && (
        <AddButton
          label="＋ Добавить фотоальбом"
          onClick={() => onChange({ albums: [...albums, mkAlbum()] })}
        />
      )}
    </div>
  );
}
