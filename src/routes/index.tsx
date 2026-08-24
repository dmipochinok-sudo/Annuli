import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PersonBasic } from "@/components/annuli/PersonBasic";
import { PersonSidebar } from "@/components/annuli/PersonSidebar";
import { Toaster } from "@/components/ui/sonner";
import { useAnnuli } from "@/hooks/use-annuli";
import { fullName, lifeDates } from "@/lib/annuli/format";
import { mkPerson, type Person } from "@/lib/annuli/types";

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
  { id: "t2", label: "Семья", ready: false },
  { id: "t3", label: "Документы", ready: false },
  { id: "t4", label: "Служба", ready: false },
  { id: "t5", label: "Воспоминания", ready: false },
  { id: "t6", label: "Дерево", ready: false },
];

function Index() {
  const { persons, loading, error, savePerson, deletePerson } = useAnnuli();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Person | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [tab, setTab] = useState("t1");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const selectPerson = (id: string) => {
    setSelectedId(id);
    setDraft(null);
    setEditMode(false);
    setIsNew(false);
    setTab("t1");
  };

  const newPerson = () => {
    const p = mkPerson();
    setDraft(p);
    setSelectedId(p.id);
    setEditMode(true);
    setIsNew(true);
    setTab("t1");
  };

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

  const save = async () => {
    if (!draft) return;
    if (!draft.personIndex.trim()) {
      toast.error("Укажите индекс персоны (например N.5.3)");
      return;
    }
    try {
      const saved = await savePerson(draft);
      setSelectedId(saved.id);
      setDraft(null);
      setEditMode(false);
      setIsNew(false);
      toast.success("Персона сохранена");
    } catch (e) {
      toast.error("Не удалось сохранить: " + (e instanceof Error ? e.message : String(e)));
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
      <header className="grid h-13 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 bg-header px-3 py-3 text-header-foreground sm:px-4">
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
        <button
          onClick={toggleTheme}
          className="rounded-md border border-white/15 px-2.5 py-1 text-[12px] transition hover:bg-white/10"
        >
          {dark ? "☀︎ Светлая" : "☾ Тёмная"}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <PersonSidebar
          persons={persons}
          selectedId={selectedId}
          onSelect={selectPerson}
          onNew={newPerson}
        />

        <main className="flex-1 overflow-y-auto p-5">
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
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[22px] font-bold tracking-tight">
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

              <div className="mb-4 flex flex-wrap gap-1 rounded-t-xl bg-card px-1 shadow-sm">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    disabled={!t.ready}
                    onClick={() => setTab(t.id)}
                    className={
                      "-mb-px border-b-2 px-3 py-2.5 text-[12px] font-medium transition " +
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
                <PersonBasic
                  person={current}
                  editMode={editMode}
                  onChange={(patch) => setDraft((d) => (d ? { ...d, ...patch } : d))}
                />
              )}
            </>
          )}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
