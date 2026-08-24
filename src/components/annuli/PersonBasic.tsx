import type { ReactNode } from "react";

import { genOf } from "@/lib/annuli/format";
import type { Person } from "@/lib/annuli/types";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="size-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        {title}
      </h3>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">{children}</div>
    </section>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 grid gap-3 last:mb-0 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </span>
  );
}

const inputCls =
  "h-8 rounded-lg border border-border bg-surface-dark px-3 text-[14px] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30";


export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <Label>{label}</Label>
      {readOnly ? (
        <span className="py-1.5 text-[13px] text-foreground">{value || "—"}</span>
      ) : (
        <input
          className={inputCls}
          value={value}
          placeholder={placeholder}
          onChange={(ev) => onChange(ev.target.value)}
        />
      )}
      {hint && !readOnly && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  readOnly,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <Label>{label}</Label>
      {readOnly ? (
        <span className="whitespace-pre-wrap py-1.5 text-[13px] text-foreground">
          {value || "—"}
        </span>
      ) : (
        <textarea
          className={inputCls + " resize-y"}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(ev) => onChange(ev.target.value)}
        />
      )}
    </label>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
  readOnly,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px]">
      <input
        type="checkbox"
        disabled={readOnly}
        checked={checked}
        onChange={(ev) => onChange(ev.target.checked)}
        className="accent-primary"
      />
      {label}
    </label>
  );
}

export function CardItem({
  title,
  onRemove,
  readOnly,
  children,
}: {
  title: string;
  onRemove: () => void;
  readOnly?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mb-2.5 rounded-lg border border-border bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-[12px] font-bold text-foreground">{title}</span>
        {!readOnly && (
          <button
            onClick={onRemove}
            className="shrink-0 rounded-md border border-border px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10"
          >
            Удалить
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-dashed border-primary px-3 py-2 text-[12px] font-semibold text-primary hover:bg-primary/10"
    >
      {label}
    </button>
  );
}

interface Props {
  person: Person;
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
}

export function PersonBasic({ person: p, editMode, onChange }: Props) {
  const ro = !editMode;
  const set = (patch: Partial<Person>) => onChange(patch);

  return (
    <div>
      <Section title="Идентификация">
        <Row>
          <TextField
            label="Индекс персоны *"
            value={p.personIndex}
            readOnly={ro}
            placeholder="N.5.3"
            hint="Формат: N.Поколение.Номер (например: N.5.3)"
            onChange={(v) => set({ personIndex: v, generation: genOf(v) })}
          />
          <label className="flex flex-col gap-1">
            <Label>Пол</Label>
            {ro ? (
              <span className="py-1.5 text-[13px]">
                {p.gender === "М" ? "Мужской" : p.gender === "Ж" ? "Женский" : "—"}
              </span>
            ) : (
              <select
                className={inputCls}
                value={p.gender}
                onChange={(ev) => set({ gender: ev.target.value })}
              >
                <option value="">— не указан —</option>
                <option value="М">Мужской</option>
                <option value="Ж">Женский</option>
              </select>
            )}
          </label>
          <TextField
            label="Сословие"
            value={p.estate}
            readOnly={ro}
            placeholder="Крестьянин, мещанин…"
            onChange={(v) => set({ estate: v })}
          />
        </Row>
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            disabled={ro}
            checked={p.isLateral}
            onChange={(ev) => set({ isLateral: ev.target.checked })}
            className="accent-primary"
          />
          Боковая ветвь (не на главной линии)
        </label>
      </Section>

      <Section title="Фамилия, имя, отчество">
        <Row>
          <TextField
            label="Имя"
            value={p.firstName}
            readOnly={ro}
            placeholder="Иван"
            onChange={(v) => set({ firstName: v })}
          />
          <TextField
            label="Отчество"
            value={p.patronymic}
            readOnly={ro}
            placeholder="Иванович"
            onChange={(v) => set({ patronymic: v })}
          />
          <TextField
            label="Фамилия"
            value={p.lastName}
            readOnly={ro}
            placeholder="Иванов"
            onChange={(v) => set({ lastName: v })}
          />
        </Row>
      </Section>

      <Section title="Дата и место рождения">
        <label className="mb-2 flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            disabled={ro}
            checked={p.birthDateApprox}
            onChange={(ev) => set({ birthDateApprox: ev.target.checked })}
            className="accent-primary"
          />
          Приблизительная дата
        </label>
        <Row>
          {p.birthDateApprox ? (
            <>
              <TextField
                label="Год от"
                value={p.birthYearFrom}
                readOnly={ro}
                onChange={(v) => set({ birthYearFrom: v })}
              />
              <TextField
                label="Год до"
                value={p.birthYearTo}
                readOnly={ro}
                onChange={(v) => set({ birthYearTo: v })}
              />
            </>
          ) : (
            <TextField
              label="Дата рождения"
              value={p.birthDate}
              readOnly={ro}
              placeholder="дд.мм.гггг или год"
              onChange={(v) => set({ birthDate: v })}
            />
          )}
          <TextField
            label="Место рождения"
            value={p.birthPlace}
            readOnly={ro}
            placeholder="Деревня, уезд, губерния…"
            onChange={(v) => set({ birthPlace: v })}
          />
        </Row>
      </Section>

      <Section title="Дата и место смерти">
        <label className="mb-2 flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            disabled={ro}
            checked={p.deathDateApprox}
            onChange={(ev) => set({ deathDateApprox: ev.target.checked })}
            className="accent-primary"
          />
          Приблизительная дата
        </label>
        <Row>
          {p.deathDateApprox ? (
            <>
              <TextField
                label="Год от"
                value={p.deathYearFrom}
                readOnly={ro}
                onChange={(v) => set({ deathYearFrom: v })}
              />
              <TextField
                label="Год до"
                value={p.deathYearTo}
                readOnly={ro}
                onChange={(v) => set({ deathYearTo: v })}
              />
            </>
          ) : (
            <TextField
              label="Дата смерти"
              value={p.deathDate}
              readOnly={ro}
              placeholder="дд.мм.гггг или год"
              onChange={(v) => set({ deathDate: v })}
            />
          )}
          <TextField
            label="Место смерти"
            value={p.deathPlace}
            readOnly={ro}
            onChange={(v) => set({ deathPlace: v })}
          />
          <TextField
            label="Место захоронения"
            value={p.burialPlace}
            readOnly={ro}
            onChange={(v) => set({ burialPlace: v })}
          />
          <TextField
            label="Причина смерти"
            value={p.deathCause}
            readOnly={ro}
            onChange={(v) => set({ deathCause: v })}
          />
        </Row>
      </Section>

      <Section title="Родители">
        <Row>
          <TextField
            label="Отец — имя"
            value={p.fatherFirstName}
            readOnly={ro}
            onChange={(v) => set({ fatherFirstName: v })}
          />
          <TextField
            label="Отец — отчество"
            value={p.fatherPatronymic}
            readOnly={ro}
            onChange={(v) => set({ fatherPatronymic: v })}
          />
          <TextField
            label="Отец — фамилия"
            value={p.fatherLastName}
            readOnly={ro}
            onChange={(v) => set({ fatherLastName: v })}
          />
        </Row>
        <Row>
          <TextField
            label="Мать — имя"
            value={p.motherFirstName}
            readOnly={ro}
            onChange={(v) => set({ motherFirstName: v })}
          />
          <TextField
            label="Мать — отчество"
            value={p.motherPatronymic}
            readOnly={ro}
            onChange={(v) => set({ motherPatronymic: v })}
          />
          <TextField
            label="Мать — фамилия"
            value={p.motherLastName}
            readOnly={ro}
            onChange={(v) => set({ motherLastName: v })}
          />
        </Row>
      </Section>
    </div>
  );
}
