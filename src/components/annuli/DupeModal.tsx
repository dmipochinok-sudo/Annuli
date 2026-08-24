import { candidateLabel, slotTitle, type DupeResolution, type DupeSlot } from "@/lib/annuli/dedupe";
import { lifeDates } from "@/lib/annuli/format";

interface Props {
  slots: DupeSlot[];
  resolutions: Map<string, DupeResolution>;
  onResolve: (key: string, res: DupeResolution) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Диалог подтверждения автопривязки родственников к персонам базы. */
export function DupeModal({ slots, resolutions, onResolve, onConfirm, onCancel }: Props) {
  const allResolved = slots.every((s) => resolutions.has(s.key));

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onCancel();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-[14px] font-bold">🔍 Найдены совпадения с персонами в базе</h3>
          <button onClick={onCancel} className="px-2 text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {slots.map((s) => {
            const res = resolutions.get(s.key);
            return (
              <div key={s.key} className="mb-3 rounded-lg border border-border p-3">
                <div className="mb-1 text-[13px] font-bold">
                  {slotTitle(s)}
                  {s.auto && (
                    <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                      уверенное совпадение
                    </span>
                  )}
                </div>
                <p className="mb-2 text-[12px] text-muted-foreground">
                  Похожие записи — выберите, кому соответствует упоминание:
                </p>
                <div className="flex flex-col gap-1">
                  {s.candidates.map((c) => {
                    const sel = res?.type === "link" && res.id === c.person.id;
                    return (
                      <label
                        key={c.person.id}
                        className={
                          "flex cursor-pointer items-start gap-2 rounded-md p-2 text-[13px] " +
                          (sel ? "bg-primary/10" : "hover:bg-muted")
                        }
                      >
                        <input
                          type="radio"
                          name={`dupe_${s.key}`}
                          checked={sel}
                          onChange={() => onResolve(s.key, { type: "link", id: c.person.id })}
                          className="mt-1"
                        />
                        <span className="min-w-0">
                          <span className="font-medium">{candidateLabel(c)}</span>{" "}
                          <span className="text-[12px] text-muted-foreground">
                            {lifeDates(c.person)}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {c.reasons.join(", ")} · совпадение {c.score}%
                          </span>
                        </span>
                      </label>
                    );
                  })}
                  <label
                    className={
                      "flex cursor-pointer items-center gap-2 rounded-md p-2 text-[13px] " +
                      (res?.type === "new" ? "bg-primary/10" : "hover:bg-muted")
                    }
                  >
                    <input
                      type="radio"
                      name={`dupe_${s.key}`}
                      checked={res?.type === "new"}
                      onChange={() => onResolve(s.key, { type: "new" })}
                    />
                    <span className="text-muted-foreground">
                      Это другой человек — не привязывать
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <span className="text-[12px] text-muted-foreground">
            {allResolved ? "Всё готово для сохранения" : "Выберите вариант для каждой позиции"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="rounded-md border border-border bg-secondary px-3 py-2 text-[13px] font-semibold hover:bg-muted"
            >
              Отмена
            </button>
            <button
              disabled={!allResolved}
              onClick={onConfirm}
              className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"
            >
              💾 Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
