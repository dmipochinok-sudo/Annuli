import type { ReactNode } from "react";

export interface SectionNavItem<K extends string> {
  key: K;
  label: string;
  badge?: number;
}

export function SectionNav<K extends string>({
  label,
  title,
  items,
  active,
  onChange,
}: {
  label: string;
  title?: ReactNode;
  items: SectionNavItem<K>[];
  active: K;
  onChange: (key: K) => void;
}) {
  return (
    <aside className="section-nav" aria-label={label}>
      {title && <div className="section-nav-title">{title}</div>}
      <div className="section-nav-list" role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active === item.key}
            className={`section-nav-item${active === item.key ? " is-active" : ""}`}
            onClick={() => onChange(item.key)}
          >
            <span className="section-nav-number">{String(index + 1).padStart(2, "0")}</span>
            <span>{item.label}</span>
            {!!item.badge && <span className="section-nav-badge">{item.badge}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
}