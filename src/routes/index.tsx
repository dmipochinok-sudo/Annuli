import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PersonBasic } from "@/components/annuli/PersonBasic";
import { PersonDocs } from "@/components/annuli/PersonDocs";
import { PersonFamily } from "@/components/annuli/PersonFamily";
import { PersonMemories } from "@/components/annuli/PersonMemories";
import { PersonMilitary } from "@/components/annuli/PersonMilitary";
import { PersonTree } from "@/components/annuli/PersonTree";
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
import { mkPerson, uid, type Page, type Person } from "@/lib/annuli/types";

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
  { id: "t2", label: "Семья", ready: true },
  { id: "t3", label: "Документы", ready: true },
  { id: "t4", label: "Служба", ready: true },
  { id: "t5", label: "Воспоминания", ready: true },
  { id: "t6", label: "Дерево", ready: true },
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
  const [dbOpen, setDbOpen] = useState(false);
  const [dupeSlots, setDupeSlots] = useState<DupeSlot[]>([]);
  const [dupeRes, setDupeRes] = useState<Map<string, DupeResolution>>(new Map());
  const [pendingSave, setPendingSave] = useState<Person | null>(null);
  const [lbItems, setLbItems] = useState<LightboxItem[]>([]);
  const [lbIndex, setLbIndex] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("annuli-theme") === "dark";
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
      <header className="grid h-13 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 bg-header md:grid-cols-[minmax(0,1fr)_auto] px-3 py-3 text-header-foreground sm:px-4">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Список персон"
          className="rounded-md border border-white/15 px-2 py-1 text-[13px] transition hover:bg-white/10 md:hidden"
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
          <h1 className="text-[15px] font-bold tracking-tight">Annuli</h1>
          <span className="text-[11px] opacity-60">генеалогическая база</span>
        </div>
        <div className="flex items-center gap-2 justify-self-end">
        <button
          onClick={() => setDbOpen(true)}
          className="rounded-md border border-white/15 px-2.5 py-1 text-[12px] transition hover:bg-white/10"
        >
          💾 База
        </button>
        <button
          onClick={toggleTheme}
          className="justify-self-end rounded-md border border-white/15 px-2.5 py-1 text-[12px] transition hover:bg-white/10"
        >
          {dark ? "☀︎ Светлая" : "☾ Тёмная"}
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
          selectedId={selectedId}
          onSelect={selectPerson}
          onNew={newPerson}
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
                Выберите персону слева или создайте новую. Данные хранятся локально в браузере.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-[minmax(0,1fr)] items-center gap-2 sm:flex sm:flex-wrap">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[18px] font-bold tracking-tight sm:text-[22px]">
                    {fullName(current) || "Новая персона"}
                  </h2>
                  <p className="text-[12px] text-muted-foreground">
                    {[current.personIndex, lifeDates(current)].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {editMode ? (
                  <>
                    <button
                      onClick={save}
                      className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground hover:brightness-110"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-md border border-border bg-secondary px-3 py-2 text-[13px] font-semibold hover:bg-muted"
                    >
                      Отмена
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startEdit}
                      className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground hover:brightness-110"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={remove}
                      className="rounded-md bg-destructive px-3 py-2 text-[13px] font-semibold text-destructive-foreground hover:brightness-110"
                    >
                      Удалить
                    </button>
                  </>
                )}
              </div>

              <div className="mb-4 -mx-3 flex gap-1 overflow-x-auto rounded-t-xl bg-card px-3 shadow-sm sm:mx-0 sm:flex-wrap sm:px-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    disabled={!t.ready}
                    onClick={() => setTab(t.id)}
                    className={
                      "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-[12px] font-medium transition " +
                      (tab === t.id
                        ? "border-primary font-bold text-primary"
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
                <PersonBasic person={current} editMode={editMode} onChange={patchDraft} />
              )}
              {tab === "t2" && (
                <PersonFamily person={current} editMode={editMode} onChange={patchDraft} />
              )}
              {tab === "t3" && (
                <PersonDocs
                  person={current}
                  editMode={editMode}
                  onChange={patchDraft}
                  onOpenScans={openScans}
                />
              )}
              {tab === "t4" && (
                <PersonMilitary
                  person={current}
                  editMode={editMode}
                  onChange={patchDraft}
                  onOpenScans={openScans}
                />
              )}
              {tab === "t5" && (
                <PersonMemories person={current} editMode={editMode} onChange={patchDraft} />
              )}
              {tab === "t6" && (
                <PersonTree person={current} persons={persons} onSelect={selectPerson} />
              )}
            </>
          )}
        </main>
      </div>
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

      <Toaster />
    </div>
  );
}
