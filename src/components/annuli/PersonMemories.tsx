import {
  AddButton,
  CardItem,
  Row,
  Section,
  TextArea,
  TextField,
} from "@/components/annuli/PersonBasic";
import { mkMem, type Memory, type Person } from "@/lib/annuli/types";

interface Props {
  person: Person;
  editMode: boolean;
  onChange: (patch: Partial<Person>) => void;
}

export function PersonMemories({ person: p, editMode, onChange }: Props) {
  const ro = !editMode;
  const patch = (id: string, v: Partial<Memory>) =>
    onChange({ memories: p.memories.map((m) => (m.id === id ? { ...m, ...v } : m)) });

  return (
    <Section title={`Воспоминания (${p.memories.length})`}>
      {p.memories.length === 0 && (
        <p className="mb-2 text-[12px] text-muted-foreground">Воспоминаний пока нет</p>
      )}
      {p.memories.map((m, i) => (
        <CardItem
          key={m.id}
          readOnly={ro}
          title={
            [m.firstName, m.patronymic, m.lastName].filter(Boolean).join(" ") ||
            `Воспоминание ${i + 1}`
          }
          onRemove={() => onChange({ memories: p.memories.filter((x) => x.id !== m.id) })}
        >
          <Row>
            <TextField
              label="Автор — имя"
              value={m.firstName}
              readOnly={ro}
              onChange={(v) => patch(m.id, { firstName: v })}
            />
            <TextField
              label="Автор — отчество"
              value={m.patronymic}
              readOnly={ro}
              onChange={(v) => patch(m.id, { patronymic: v })}
            />
            <TextField
              label="Автор — фамилия"
              value={m.lastName}
              readOnly={ro}
              onChange={(v) => patch(m.id, { lastName: v })}
            />
            <TextField
              label="Дата записи"
              value={m.date}
              readOnly={ro}
              onChange={(v) => patch(m.id, { date: v })}
            />
          </Row>
          <TextArea
            label="Текст"
            rows={5}
            value={m.text}
            readOnly={ro}
            onChange={(v) => patch(m.id, { text: v })}
          />
        </CardItem>
      ))}
      {!ro && (
        <AddButton
          label="+ Добавить воспоминание"
          onClick={() => onChange({ memories: [...p.memories, mkMem()] })}
        />
      )}
    </Section>
  );
}
