import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PersonBirth } from "@/components/annuli/PersonBirth";
import { PersonMain } from "@/components/annuli/PersonMain";
import { PersonEducation } from "@/components/annuli/PersonEducation";
import { PersonCareer } from "@/components/annuli/PersonCareer";
import { PersonService } from "@/components/annuli/PersonService";
import { PersonDeath } from "@/components/annuli/PersonDeath";
import { PersonDocs } from "@/components/annuli/PersonDocs";
import { PersonAlbums } from "@/components/annuli/PersonAlbums";
import { PersonMemories } from "@/components/annuli/PersonMemories";
import { TreeOverlay } from "@/components/annuli/TreeOverlay";

import { PersonSidebar } from "@/components/annuli/PersonSidebar";
import { DbModal } from "@/components/annuli/DbModal";
import { DupeModal } from "@/components/annuli/DupeModal";
import { Lightbox, type LightboxItem } from "@/components/annuli/Lightbox";
import {
  applyResolutions,
  dedupePersonLists,
  findDuplicates,
  type DupeResolution,
  type DupeSlot,
} from "@/lib/annuli/dedupe";
import { imgGet, imgPut, imgDel } from "@/lib/annuli/db";
import { makeThumbnail } from "@/lib/annuli/media";
import { Toaster } from "@/components/ui/sonner";
import { useAnnuli } from "@/hooks/use-annuli";
import { fullName, lifeDates } from "@/lib/annuli/format";
import { downloadBlob } from "@/lib/annuli/archive";
import { personFolderName } from "@/lib/annuli/media";
import {
  buildPersonDocsArchive,
  buildPersonTxt,
  personArchiveName,
} from "@/lib/annuli/person-export";
import { mkPerson, uid, type Page, type Person, type Photo } from "@/lib/annuli/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Annuli — генеалогическая база семьи" },
      {
        name: "description",
        content:
          "Annuli — личная генеалогическая база: персоны, даты, документы и архивные ссылки в браузере.",
      },
      { property: "og:title", content: "Annuli — генеалогическая база семьи" },
      {
        property: "og:description",
        content: "Персоны, даты, документы и архивные ссылки в одной локальной базе.",
      },
    ],
  }),
  component: Index,
});

const TABS = [
  { id: "t1", label: "Основное", ready: true },
  { id: "tb", label: "Рождение", ready: true },
  { id: "te", label: "Учеба", ready: true },
  { id: "tc", label: "Карьера", ready: true },
  { id: "t4", label: "Военная служба", ready: true },
  { id: "td", label: "Смерть", ready: true },
  { id: "t5", label: "Воспоминания", ready: true },
  { id: "t3", label: "Архив", ready: true },
  { id: "t7", label: "Фотоальбом", ready: true },
];


function Index() {
  const { persons, loading, error, savePerson, deletePerson, reload } = useAnnuli();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Person | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [tab, setTab] = useState("t1");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [dbOpen, setDbOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);

  const [dupeSlots, setDupeSlots] = useState<DupeSlot[]>([]);
  const [dupeRes, setDupeRes] = useState<Map<string, DupeResolution>>(new Map());
  const [pendingSave, setPendingSave] = useState<Person | null>(null);
  const [lbItems, setLbItems] = useState<LightboxItem[]>([]);
  const [lbIndex, setLbIndex] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("annuli-theme") !== "light";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("annuli-theme", next ? "dark" : "light");
  };

  const selected = useMemo(
    () => persons.find((p) => p.id === selectedId) ?? null,
    [persons, selectedId],
  );
  const current = draft ?? selected;
  const currentAvatarId = current?.avatarImageId || "";

  useEffect(() => {
    let alive = true;
    let objUrl = "";
    if (!currentAvatarId) {
      setAvatarUrl("");
      return;
    }
    imgGet(currentAvatarId)
      .then((blob) => {
        if (!alive || !blob) return;
        objUrl = URL.createObjectURL(blob);
        setAvatarUrl(objUrl);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [currentAvatarId]);


  const selectPerson = (id: string) => {
    setSelectedId(id);
    setDraft(null);
    setEditMode(false);
    setIsNew(false);
    setTab("t1");
    setSidebarOpen(false);
  };

  const newPerson = () => {
    const p = mkPerson();
    setDraft(p);
    setSelectedId(p.id);
    setEditMode(true);
    setIsNew(true);
    setTab("t1");
    setSidebarOpen(false);
  };

  const patchDraft = (patch: Partial<Person>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const startEdit = () => {
    if (!selected) return;
    setDraft({ ...selected });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditMode(false);
    if (isNew) setSelectedId(null);
    setIsNew(false);
  };

  /** Записывает персону и синхронизирует встречные связи у супругов. */
  const persist = async (p: Person) => {
    const saved = await savePerson(p);
    for (const m of saved.marriages || []) {
      if (!m.spouseLinkedId) continue;
      const sp = persons.find((x) => x.id === m.spouseLinkedId);
      if (!sp) continue;
      if ((sp.marriages || []).some((sm) => sm.spouseLinkedId === saved.id)) continue;
      await savePerson({
        ...sp,
        marriages: [
          ...(sp.marriages || []),
          {
            id: uid(),
            marriageDate: m.marriageDate,
            marriagePlace: m.marriagePlace,
            marriageEnded: false,
            marriageEndDate: "",
            marriageEndReason: "",
            spouseLastName: saved.lastName,
            spouseFirstName: saved.firstName,
            spousePatronymic: saved.patronymic,
            spouseLinkedId: saved.id,
            marriageDocName: "",
            marriageDocId: "",
            marriageDocPath: "",
            marriageDocPages: [],
            marriageDocArchive: "",
            marriageDocFund: "",
            marriageDocOpis: "",
            marriageDocDelo: "",
            marriageDocList: "",
          },
        ],
      });
    }
    setSelectedId(saved.id);
    setDraft(null);
    setEditMode(false);
    setIsNew(false);
    toast.success("Персона сохранена");
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.personIndex.trim()) {
      toast.error("Укажите индекс персоны (например N.5.3)");
      return;
    }
    const clean = dedupePersonLists(draft);
    const slots = findDuplicates(clean, persons);
    if (slots.length) {
      const preset = new Map<string, DupeResolution>();
      for (const sl of slots) {
        if (sl.auto && sl.candidates[0])
          preset.set(sl.key, { type: "link", id: sl.candidates[0].person.id });
      }
      setDupeSlots(slots);
      setDupeRes(preset);
      setPendingSave(clean);
      return;
    }
    try {
      await persist(clean);
    } catch (e) {
      toast.error("Не удалось сохранить: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const confirmDupes = async () => {
    if (!pendingSave) return;
    const linked = applyResolutions(pendingSave, dupeSlots, dupeRes, persons);
    setDupeSlots([]);
    setDupeRes(new Map());
    setPendingSave(null);
    try {
      await persist(linked);
    } catch (e) {
      toast.error("Не удалось сохранить: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const openPhotos = useCallback((photos: Photo[], index: number) => {
    const items = photos
      .filter((ph) => ph.imageId)
      .map((ph) => ({ imageId: ph.imageId, title: ph.title || ph.imageName || "Фото" }));
    if (!items.length) return;
    const target = photos[index]?.imageId;
    const i = Math.max(
      0,
      items.findIndex((it) => it.imageId === target),
    );
    setLbItems(items);
    setLbIndex(i);
  }, []);

  const openScans = useCallback((pages: Page[], index: number) => {
    const items = pages
      .filter((pg) => pg.imageId)
      .map((pg) => ({ imageId: pg.imageId, title: pg.imageName || "Скан" }));
    if (!items.length) return;
    const target = pages[index]?.imageId;
    const i = Math.max(
      0,
      items.findIndex((it) => it.imageId === target),
    );
    setLbItems(items);
    setLbIndex(i);
  }, []);

  const loadImage = useCallback((id: string) => imgGet(id).catch(() => null), []);

  const onAvatarFile = async (file: File | undefined) => {
    if (!file || !draft) return;
    if (draft.avatarImageId) await imgDel(draft.avatarImageId).catch(() => {});
    const imageId = `img_${uid()}`;
    await imgPut(imageId, file);
    const thumb = await makeThumbnail(file, 240, 240);
    patchDraft({ avatarImageId: imageId, avatarImageName: file.name, avatarThumb: thumb });
  };

  const exportTxt = () => {
    if (!selected) return;
    const blob = new Blob([buildPersonTxt(selected)], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `${personFolderName(selected)}.txt`);
    toast.success("Текстовое досье сохранено");
  };

  const exportDocsArchive = async () => {
    if (!selected) return;
    setExporting(true);
    try {
      const { blob, files } = await buildPersonDocsArchive(selected);
      if (!files) {
        toast.error("У персоны нет прикреплённых сканов документов");
        return;
      }
      downloadBlob(blob, personArchiveName(selected));
      toast.success(`Архивный раздел готов: ${files} документов со сканами`);
    } catch (e) {
      toast.error("Ошибка экспорта: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setExporting(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!confirm(`Удалить персону «${fullName(selected) || "Без имени"}»?`)) return;
    await deletePerson(selected.id);
    setSelectedId(null);
    setDraft(null);
    setEditMode(false);
    toast.success("Персона удалена");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-auto shrink-0 flex-wrap items-center gap-3 border-b border-border bg-header px-4 py-3 text-header-foreground sm:px-6">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Список персон"
          className="h-8 rounded-sm border border-border px-2.5 font-ui text-[14px] transition hover:border-stroke-bright md:hidden"
        >
          ☰
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <svg viewBox="0 0 100 100" className="size-6 text-primary" aria-hidden>
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="5" />
            <circle
              cx="50"
              cy="50"
              r="32"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              opacity=".7"
            />
            <circle
              cx="50"
              cy="50"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              opacity=".45"
            />
          </svg>
          <h1 className="font-display text-[24px] tracking-tight text-foreground">Annuli</h1>
        </div>

        <div className="order-last flex min-w-0 flex-1 basis-full items-center gap-2 sm:order-none sm:basis-auto">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 font-ui text-[12px] text-muted-foreground">
              ⌕
            </span>
            <input
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="ПОИСК ПО АРХИВУ…"
              aria-label="Поиск персоны"
              className="h-8 w-full border-b border-border bg-transparent pl-6 pr-6 font-ui text-[10px] uppercase tracking-[0.22em] text-foreground outline-none transition placeholder:text-dim focus:border-primary"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Очистить поиск"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="h-8 shrink-0 border-b border-border px-2 font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
          >
            Найти
          </button>
        </div>

        <div className="flex items-center gap-5 sm:ml-auto">
          <button
            onClick={() => setTreeOpen(true)}
            className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
          >
            Древо
          </button>
          <button
            onClick={() => setDbOpen(true)}
            className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
          >
            База
          </button>
          <button
            onClick={toggleTheme}
            className="hidden font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground sm:block"
          >
            {dark ? "Светлая тема" : "Тёмная тема"}
          </button>
          <span className="hidden h-5 w-px bg-border sm:block" />
          <button
            onClick={newPerson}
            className="rounded-sm border border-primary px-4 py-1.5 font-ui text-[10px] uppercase tracking-[0.2em] text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            ＋ Новая персона
          </button>
        </div>
      </header>



      <div className="relative flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <button
            aria-label="Закрыть список"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 z-10 bg-black/40 md:hidden"
          />
        )}
        <PersonSidebar
          persons={persons}
          query={query}
          onQueryChange={setQuery}
          selectedId={selectedId}
          onSelect={selectPerson}
          onNew={newPerson}
          className={
            "absolute inset-y-0 left-0 z-20 max-w-[85%] border-r shadow-xl transition-transform md:static md:z-auto md:max-w-none md:translate-x-0 md:shadow-none " +
            (sidebarOpen ? "translate-x-0" : "-translate-x-full")
          }
        />

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">
          {loading ? (
            <p className="font-ui text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Загрузка базы…
            </p>
          ) : error ? (
            <p className="font-ui text-[11px] uppercase tracking-[0.2em] text-destructive">
              Ошибка доступа к базе: {error}
            </p>
          ) : !current ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <h2 className="font-display text-5xl italic text-foreground">Annuli</h2>
              <p className="max-w-md text-[14px] italic">
                Выберите персону слева или создайте новую. Данные хранятся локально в браузере.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-start md:gap-10">
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(ev) => void onAvatarFile(ev.target.files?.[0])}
                />
                <div className="relative shrink-0">
                  <span className="pointer-events-none absolute -inset-2 border border-border" />
                  <button
                    type="button"
                    onClick={() => {
                      if (editMode) {
                        if (avatarInput.current) {
                          avatarInput.current.value = "";
                          avatarInput.current.click();
                        }
                      } else if (currentAvatarId) {
                        setLbItems([
                          { imageId: currentAvatarId, title: current.avatarImageName || "Портрет" },
                        ]);
                        setLbIndex(0);
                      }
                    }}
                    title={editMode ? "Загрузить портрет" : "Открыть портрет"}
                    className="relative grid h-[168px] w-[132px] place-items-center overflow-hidden border border-border bg-muted font-ui text-[13px] font-bold text-muted-foreground"
                  >
                    {avatarUrl || current.avatarThumb ? (
                      <img
                        src={avatarUrl || current.avatarThumb}
                        alt={`Портрет: ${fullName(current) || "персона"}`}
                        className="size-full object-cover grayscale contrast-[1.05]"
                      />
                    ) : (
                      <span>{editMode ? "＋" : "?"}</span>
                    )}
                  </button>
                  {current.personIndex && (
                    <span className="absolute -bottom-3 -left-3 border border-border bg-background px-2 py-1 font-ui text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                      {current.personIndex}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[34px] italic leading-[1.05] text-foreground sm:text-[46px]">
                    {fullName(current) || "Новая персона"}
                  </h2>
                  <p className="mt-3 font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {lifeDates(current) || "Даты не указаны"}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                    {editMode ? (
                      <>
                        <button
                          onClick={save}
                          className="rounded-sm border border-primary bg-primary px-4 py-1.5 font-ui text-[10px] uppercase tracking-[0.2em] text-primary-foreground transition hover:brightness-110"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
                        >
                          Отмена
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={startEdit}
                          className="rounded-sm border border-primary px-4 py-1.5 font-ui text-[10px] uppercase tracking-[0.2em] text-primary transition hover:bg-primary hover:text-primary-foreground"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={exportTxt}
                          disabled={isNew}
                          className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground disabled:opacity-40"
                        >
                          Экспорт в .TXT
                        </button>
                        <button
                          onClick={() => void exportDocsArchive()}
                          disabled={exporting || isNew}
                          className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground disabled:opacity-40"
                        >
                          {exporting ? "Готовим архив…" : "Создать архивный раздел"}
                        </button>
                        <button
                          onClick={remove}
                          className="font-ui text-[10px] uppercase tracking-[0.2em] text-destructive transition hover:brightness-125"
                        >
                          Удалить
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-8 -mx-4 flex gap-8 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    disabled={!t.ready}
                    onClick={() => setTab(t.id)}
                    className={
                      "-mb-px shrink-0 border-b-2 pb-4 pt-1 font-ui text-[10px] font-bold uppercase tracking-[0.2em] transition " +
                      (tab === t.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground") +
                      (t.ready ? "" : " cursor-not-allowed opacity-40")
                    }
                    title={t.ready ? undefined : "Появится на следующем этапе миграции"}
                  >
                    {t.label}
                  </button>
                ))}
              </div>



              {tab === "t1" && (
                <PersonMain
                  person={current}
                  persons={persons}
                  editMode={editMode}
                  onChange={patchDraft}
                  onOpenPerson={selectPerson}
                />
              )}
              {tab === "tb" && (
                <PersonBirth
                  person={current}
                  persons={persons}
                  editMode={editMode}
                  onChange={patchDraft}
                  onOpenPerson={selectPerson}
                  onOpenScans={openScans}
                />
              )}
              {tab === "t3" && (
                <PersonDocs
                  person={current}
                  editMode={editMode}
                  onChange={patchDraft}
                  onOpenScans={openScans}
                />
              )}
              {tab === "te" && (
                <PersonEducation
                  person={current}
                  editMode={editMode}
                  onChange={patchDraft}
                  onOpenScans={openScans}
                />
              )}
              {tab === "tc" && (
                <PersonCareer
                  person={current}
                  editMode={editMode}
                  onChange={patchDraft}
                  onOpenScans={openScans}
                />
              )}
              {tab === "t4" && (
                <PersonService
                  person={current}
                  editMode={editMode}
                  onChange={patchDraft}
                  onOpenScans={openScans}
                />
              )}
              {tab === "td" && (
                <PersonDeath
                  person={current}
                  editMode={editMode}
                  onChange={patchDraft}
                  onOpenScans={openScans}
                />
              )}
              {tab === "t5" && (
                <PersonMemories person={current} editMode={editMode} onChange={patchDraft} />
              )}
              {tab === "t7" && (
                <PersonAlbums
                  person={current}
                  editMode={editMode}
                  onChange={patchDraft}
                  onOpenPhotos={openPhotos}
                />
              )}

            </>
          )}
        </main>
      </div>
      {treeOpen && (
        <TreeOverlay
          persons={persons}
          currentId={selectedId}
          onSelect={(id) => {
            selectPerson(id);
            setTreeOpen(false);
          }}
          onClose={() => setTreeOpen(false)}
        />
      )}
      {dbOpen && (

        <DbModal
          persons={persons}
          onClose={() => setDbOpen(false)}
          onImported={async () => {
            await reload();
            setSelectedId(null);
            setDraft(null);
            setEditMode(false);
          }}
        />
      )}

      {dupeSlots.length > 0 && (
        <DupeModal
          slots={dupeSlots}
          resolutions={dupeRes}
          onResolve={(key, res) =>
            setDupeRes((prev) => {
              const next = new Map(prev);
              next.set(key, res);
              return next;
            })
          }
          onConfirm={() => void confirmDupes()}
          onCancel={() => {
            setDupeSlots([]);
            setDupeRes(new Map());
            setPendingSave(null);
          }}
        />
      )}

      {lbItems.length > 0 && (
        <Lightbox
          items={lbItems}
          index={lbIndex}
          onIndexChange={setLbIndex}
          onClose={() => setLbItems([])}
          loadImage={loadImage}
        />
      )}

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-header px-4 py-2 text-[12px] text-muted-foreground">
        <span>Annuli 2026 — Genealogical data management system</span>
        <span>Developer: Dmitry Pochinok. All rights reserved. © 2026</span>
      </footer>

      <Toaster />
    </div>
  );
}
