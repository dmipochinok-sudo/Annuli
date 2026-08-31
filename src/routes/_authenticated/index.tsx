import { createFileRoute, Link } from "@tanstack/react-router";
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
import { UserMenu } from "@/components/annuli/UserMenu";
import { Lightbox, type LightboxItem } from "@/components/annuli/Lightbox";
import {
  applyResolutions,
  dedupePersonLists,
  findDuplicates,
  type DupeResolution,
  type DupeSlot,
} from "@/lib/annuli/dedupe";
import { imgGet, imgPut, imgDel } from "@/lib/annuli/db";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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

interface IndexSearch {
  owner?: string | undefined;
}

export const Route = createFileRoute("/_authenticated/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    owner: typeof search['owner'] === "string" && search['owner'] ? String(search['owner']) : undefined,
  }),
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
  const { user } = Route.useRouteContext();
  const { owner } = Route.useSearch();
  const foreign = !!owner && owner !== user.id;
  const { data: ownerName } = useQuery({
    queryKey: ["owner-name", owner],
    enabled: foreign,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", owner!)
        .maybeSingle();
      return data?.display_name || data?.email || "пользователь";
    },
  });
  const { persons, loading, error, savePerson, deletePerson, reload } = useAnnuli(owner ?? user.id);
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Закрытие мобильного меню действий по клику вне него.
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (ev: MouseEvent | TouchEvent) => {
      if (moreRef.current && !moreRef.current.contains(ev.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [moreOpen]);

  // Прокрутка панели вкладок к активной вкладке.
  useEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLElement>(`[data-tab="${tab}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [tab]);



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
    <div className="flex h-[100svh] flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-header pt-[env(safe-area-inset-top)] text-header-foreground">
        <div className="flex h-14 items-center gap-2 px-3 sm:h-auto sm:flex-wrap sm:py-2.5 sm:px-4">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Список персон"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface-light text-[16px] transition hover:border-stroke-bright md:hidden"
          >
            ☰
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <svg viewBox="0 0 100 100" className="size-7 shrink-0 text-foreground" aria-hidden>
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
            <h1 className="truncate text-[20px] font-semibold tracking-tight">Annuli</h1>
          </div>

          {/* Поиск: на десктопе всегда в строке, на мобильном — раскрывается отдельной строкой */}
          <div className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">
                ⌕
              </span>
              <input
                value={query}
                onChange={(ev) => setQuery(ev.target.value)}
                placeholder="Поиск по имени или индексу…"
                aria-label="Поиск персоны"
                className="h-8 w-full rounded-lg border border-border bg-surface-dark pl-8 pr-8 text-[14px] text-foreground outline-none transition focus:border-stroke-bright"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Очистить поиск"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-8 shrink-0 rounded-lg border border-border bg-surface-light px-3 text-[14px] transition hover:border-stroke-bright"
            >
              Найти
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Мобильные кнопки: поиск и меню действий */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Поиск персоны"
              className="grid size-10 place-items-center rounded-lg border border-border bg-surface-light text-[16px] sm:hidden"
            >
              ⌕
            </button>
            <div className="relative sm:hidden" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((v) => !v)}
                aria-label="Ещё действия"
                aria-expanded={moreOpen}
                className="grid size-10 place-items-center rounded-lg border border-border bg-surface-light text-[16px]"
              >
                ⋯
              </button>
              {moreOpen && (
                <div className="absolute right-0 top-12 z-40 w-60 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl">
                  {[
                    { label: "＋ Добавить персону", run: newPerson },
                    { label: "Древо", run: () => setTreeOpen(true) },
                    { label: "Импорт / Экспорт базы", run: () => setDbOpen(true) },
                    { label: dark ? "☀︎ Светлая тема" : "☾ Тёмная тема", run: toggleTheme },
                  ].map((it) => (
                    <button
                      key={it.label}
                      onClick={() => {
                        setMoreOpen(false);
                        it.run();
                      }}
                      className="block w-full rounded-lg px-3 py-3 text-left text-[15px] text-popover-foreground transition hover:bg-surface-light"
                    >
                      {it.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Десктопные кнопки */}
            <button
              onClick={toggleTheme}
              className="hidden h-8 items-center gap-2 rounded-lg px-2 text-[14px] text-foreground sm:flex"
            >
              <span>{dark ? "☾ Тёмная тема" : "☀︎ Светлая тема"}</span>
              <span
                className={
                  "relative h-5 w-9 rounded-full transition " +
                  (dark ? "bg-primary" : "bg-surface-light")
                }
              >
                <span
                  className={
                    "absolute top-0.5 size-4 rounded-full bg-foreground transition-all " +
                    (dark ? "left-[18px]" : "left-0.5")
                  }
                />
              </span>
            </button>
            <button
              onClick={newPerson}
              className="hidden h-8 rounded-lg border border-border bg-surface-light px-3 text-[14px] transition hover:border-stroke-bright sm:block"
            >
              <span className="whitespace-nowrap">＋ Добавить персону</span>
            </button>
            <button
              onClick={() => setTreeOpen(true)}
              className="hidden h-8 rounded-lg border border-border bg-surface-light px-3 text-[14px] transition hover:border-stroke-bright sm:block"
            >
              <span className="whitespace-nowrap">Древо</span>
            </button>
            <button
              onClick={() => setDbOpen(true)}
              className="hidden h-8 rounded-lg border border-border bg-surface-light px-3 text-[14px] transition hover:border-stroke-bright sm:block"
            >
              <span className="whitespace-nowrap">Импорт / Экспорт базы</span>
            </button>
            <UserMenu />
          </div>
        </div>

        {searchOpen && (
          <div className="relative px-3 pb-2.5 sm:hidden">
            <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
              ⌕
            </span>
            <input
              autoFocus
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="Поиск по имени или индексу…"
              aria-label="Поиск персоны"
              className="h-11 w-full rounded-lg border border-border bg-surface-dark pl-9 pr-9 text-[16px] text-foreground outline-none transition focus:border-stroke-bright"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Очистить поиск"
                className="absolute right-6 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </header>


      {foreign && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface-light px-3 py-2 text-[13px] text-foreground sm:px-4">
          <span>
            Вы работаете в базе: <strong>{ownerName ?? "…"}</strong>
          </span>
          <Link
            to="/"
            search={{}}
            className="ml-auto rounded-lg border border-border bg-surface-dark px-3 py-1 transition hover:border-stroke-bright"
          >
            Вернуться в свою базу
          </Link>
        </div>
      )}


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
          
          className={
            "absolute inset-y-0 left-0 z-20 max-w-[85%] border-r shadow-xl transition-transform md:static md:z-auto md:max-w-none md:translate-x-0 md:shadow-none " +
            (sidebarOpen ? "translate-x-0" : "-translate-x-full")
          }
        />

        <main className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-5">
          {loading ? (
            <p className="text-[13px] text-muted-foreground">Загрузка базы…</p>
          ) : error ? (
            <p className="text-[13px] text-destructive">Ошибка доступа к базе: {error}</p>
          ) : !current ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <h2 className="text-2xl font-bold text-foreground">Annuli</h2>
              <p className="text-[13px]">
                Выберите персону слева или создайте новую. Данные хранятся в облаке и доступны на любом устройстве.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-[minmax(0,1fr)] items-center gap-2 sm:flex sm:flex-wrap">
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(ev) => void onAvatarFile(ev.target.files?.[0])}
                />
                <div className="flex items-center gap-3">
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
                    className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted text-[13px] font-bold text-muted-foreground"
                  >
                    {avatarUrl || current.avatarThumb ? (
                      <img
                        src={avatarUrl || current.avatarThumb}
                        alt={`Портрет: ${fullName(current) || "персона"}`}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span>{editMode ? "＋" : "?"}</span>
                    )}
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[18px] font-bold tracking-tight sm:text-[22px]">
                    {fullName(current) || "Новая персона"}
                  </h2>
                  <p className="text-[12px] text-muted-foreground">
                    {[current.personIndex, lifeDates(current)].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:overflow-visible sm:px-0">
                  {editMode ? (
                    <>
                      <button
                        onClick={save}
                        className="h-10 shrink-0 rounded-lg bg-primary px-4 text-[14px] font-semibold text-primary-foreground hover:brightness-110"
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="h-10 shrink-0 rounded-lg border border-border bg-secondary px-4 text-[14px] font-semibold hover:bg-muted"
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={startEdit}
                        className="h-10 shrink-0 rounded-lg border border-border bg-surface-light px-4 text-[14px] transition hover:border-stroke-bright"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={exportTxt}
                        disabled={isNew}
                        className="h-10 shrink-0 rounded-lg border border-border bg-surface-light px-4 text-[14px] transition hover:border-stroke-bright disabled:opacity-40"
                      >
                        Экспорт в .TXT
                      </button>
                      <button
                        onClick={() => void exportDocsArchive()}
                        disabled={exporting || isNew}
                        className="h-10 shrink-0 rounded-lg border border-border bg-surface-light px-4 text-[14px] transition hover:border-stroke-bright disabled:opacity-40"
                      >
                        {exporting ? "Готовим архив…" : "Создать архивный раздел"}
                      </button>
                      <button
                        onClick={remove}
                        className="h-10 shrink-0 rounded-lg bg-destructive px-4 text-[14px] font-medium text-destructive-foreground transition hover:brightness-110"
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Панель вкладок: только горизонтальная прокрутка, один ряд */}
              <div className="relative mb-4">
                <div
                  ref={tabsRef}
                  className="no-scrollbar flex snap-x snap-mandatory gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-xl border border-border bg-surface-light px-2"
                >
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      data-tab={t.id}
                      disabled={!t.ready}
                      onClick={() => setTab(t.id)}
                      className={
                        "shrink-0 snap-start whitespace-nowrap border-b-2 px-3 py-3 text-[14px] font-medium uppercase tracking-[0.03em] transition " +
                        (tab === t.id
                          ? "border-link text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground") +
                        (t.ready ? "" : " cursor-not-allowed opacity-40")
                      }
                      title={t.ready ? undefined : "Появится на следующем этапе миграции"}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-y-px left-px w-6 rounded-l-xl bg-gradient-to-r from-surface-light to-transparent" />
                <div className="pointer-events-none absolute inset-y-px right-px w-6 rounded-r-xl bg-gradient-to-l from-surface-light to-transparent" />
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
