import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  applyImport,
  buildArchive,
  downloadBlob,
  readImportFile,
  type ImportPayload,
} from "@/lib/annuli/archive";
import { buildGEDCOM } from "@/lib/annuli/gedcom";
import { buildLocalArchive } from "@/lib/annuli/local-export";
import { fullName } from "@/lib/annuli/format";
import type { Person } from "@/lib/annuli/types";

interface Props {
  persons: Person[];
  onClose: () => void;
  onImported: () => void | Promise<void>;
}

/** Диалог резервного копирования: экспорт ZIP/GEDCOM и импорт с восстановлением сканов. */
export function DbModal({ persons, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string>("");
  const [percent, setPercent] = useState<number | null>(null);
  const [payload, setPayload] = useState<ImportPayload | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  /** Приёмник прогресса: текст этапа + доля выполнения для полосы. */
  const progress = (msg: string, done?: number, total?: number) => {
    setBusy(msg);
    setPercent(
      typeof done === "number" && typeof total === "number" && total > 0
        ? Math.min(100, Math.round((done / total) * 100))
        : null,
    );
  };

  const reset = () => {
    setBusy("");
    setPercent(null);
  };

  const exportZip = async () => {
    if (!persons.length) {
      toast.error("База пуста");
      return;
    }
    progress("Подготовка архива…", 0, persons.length);
    try {
      const blob = await buildArchive(persons, progress);
      downloadBlob(blob, `Annuli_${new Date().toISOString().slice(0, 10)}.zip`);
      toast.success("Архив с данными, сканами и GEDCOM сохранён");
    } catch (e) {
      toast.error("Ошибка экспорта: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      reset();
    }
  };

  const exportGed = () => {
    if (!persons.length) {
      toast.error("База пуста");
      return;
    }
    const blob = new Blob([buildGEDCOM(persons)], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `Annuli_${new Date().toISOString().slice(0, 10)}.ged`);
    toast.success("GEDCOM сохранён");
  };

  const exportLocal = async () => {
    progress("Чтение локальной базы браузера…");
    try {
      const { blob, count } = await buildLocalArchive(progress);
      if (!count) {
        toast.error("В браузере нет сохранённой локальной базы");
        return;
      }
      downloadBlob(blob, `Annuli_local_${new Date().toISOString().slice(0, 10)}.zip`);
      toast.success(`Локальная база выгружена: ${count} персон`);
    } catch (e) {
      toast.error("Ошибка выгрузки: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      reset();
    }
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    progress("Чтение файла…");
    try {
      const data = await readImportFile(file);
      setPayload(data);
      setSelected(new Set(data.persons.map((_, i) => i)));
    } catch (e) {
      toast.error("Ошибка чтения: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      reset();
    }
  };

  const runImport = async (mode: "add" | "replace") => {
    if (!payload) return;
    const chosen = payload.persons.filter((_, i) => selected.has(i));
    if (!chosen.length) {
      toast.error("Выберите персон");
      return;
    }
    if (mode === "replace" && !confirm(`Заменить все ${persons.length} персон в базе?`)) return;
    progress("Импорт…", 0, chosen.length);
    try {
      const res = await applyImport(payload, chosen, mode, persons, progress);
      await onImported();
      toast.success(
        `Импорт завершён: добавлено ${res.added}, обновлено ${res.updated}, сканов ${res.images}`,
      );
      setPayload(null);
      onClose();
    } catch (e) {
      toast.error("Ошибка импорта: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      reset();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-[14px] font-bold">💾 База данных</h3>
          <button onClick={onClose} className="px-2 text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <section className="mb-4">
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Экспорт
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportZip}
                disabled={!!busy}
                className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"
              >
                📦 ZIP: данные + сканы + GEDCOM
              </button>
              <button
                onClick={exportGed}
                disabled={!!busy}
                className="rounded-md border border-border bg-secondary px-3 py-2 text-[13px] font-semibold hover:bg-muted disabled:opacity-40"
              >
                🌳 Только GEDCOM
              </button>
            </div>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              В архиве: {persons.length} персон, оригиналы сканов и файл annuli.ged.
            </p>
            <button
              onClick={() => void exportLocal()}
              disabled={!!busy}
              className="mt-2 rounded-md border border-border bg-secondary px-3 py-2 text-[13px] font-semibold hover:bg-muted disabled:opacity-40"
            >
              ⬇ Скачать старую локальную базу браузера
            </button>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              Разовая операция: выгружает данные, сохранённые в браузере до перехода в облако.
              Полученный ZIP можно сразу импортировать ниже.
            </p>
          </section>

          <section>
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Импорт
            </h4>
            <input
              ref={fileRef}
              type="file"
              accept=".zip,.json,.ged"
              className="hidden"
              onChange={(ev) => void pickFile(ev.target.files?.[0])}
            />
            {!payload ? (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={!!busy}
                className="rounded-md border border-border bg-secondary px-3 py-2 text-[13px] font-semibold hover:bg-muted disabled:opacity-40"
              >
                📂 Выбрать файл (.zip / .json / .ged)
              </button>
            ) : (
              <div>
                <p className="mb-2 text-[12px] text-muted-foreground">
                  <strong className="text-foreground">{payload.persons.length} персон</strong>
                  {payload.exportDate
                    ? ` · ${new Date(payload.exportDate).toLocaleString("ru-RU")}`
                    : ""}
                  {payload.source === "gedcom"
                    ? ` · GEDCOM, семей: ${payload.famCount ?? 0}`
                    : payload.hasMedia
                      ? " · со сканами"
                      : " · без сканов"}
                </p>
                <div className="mb-2 flex gap-2 text-[12px]">
                  <button
                    className="underline"
                    onClick={() => setSelected(new Set(payload.persons.map((_, i) => i)))}
                  >
                    Выбрать все
                  </button>
                  <button className="underline" onClick={() => setSelected(new Set())}>
                    Снять все
                  </button>
                  <span className="text-muted-foreground">
                    Выбрано: {selected.size} из {payload.persons.length}
                  </span>
                </div>
                <div className="mb-3 max-h-56 overflow-y-auto rounded-md border border-border p-1">
                  {payload.persons.map((p, i) => (
                    <label
                      key={p.id + i}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-[13px] hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={(ev) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (ev.target.checked) next.add(i);
                            else next.delete(i);
                            return next;
                          })
                        }
                      />
                      <span className="min-w-0 flex-1 truncate">{fullName(p) || "Без имени"}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {p.personIndex}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void runImport("add")}
                    disabled={!!busy}
                    className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"
                  >
                    ➕ Добавить
                  </button>
                  <button
                    onClick={() => void runImport("replace")}
                    disabled={!!busy}
                    className="rounded-md bg-destructive px-3 py-2 text-[13px] font-semibold text-destructive-foreground disabled:opacity-40"
                  >
                    🔄 Заменить всё
                  </button>
                  <button
                    onClick={() => setPayload(null)}
                    className="rounded-md border border-border bg-secondary px-3 py-2 text-[13px] font-semibold hover:bg-muted"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {busy && (
          <div className="border-t border-border px-4 py-3">
            <div className="mb-1.5 flex items-center justify-between text-[12px] text-muted-foreground">
              <span className="min-w-0 truncate">{busy}</span>
              {percent !== null && (
                <span className="ml-2 font-mono tabular-nums text-foreground">{percent}%</span>
              )}
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Прогресс операции"
              {...(percent !== null
                ? { "aria-valuenow": percent, "aria-valuemin": 0, "aria-valuemax": 100 }
                : {})}
            >
              <div
                className={
                  percent !== null
                    ? "h-full rounded-full bg-primary transition-[width] duration-200"
                    : "h-full w-1/3 animate-pulse rounded-full bg-primary"
                }
                {...(percent !== null ? { style: { width: `${percent}%` } } : {})}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
