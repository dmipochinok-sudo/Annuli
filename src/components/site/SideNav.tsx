/** Общая боковая навигация CMS и личных кабинетов: номер, название, красный маркер, счётчик. */
export interface SideNavItem<K extends string> {
  key: K;
  label: string;
  count?: number;
}

export function SideNav<K extends string>({
  items,
  active,
  onSelect,
  label,
  heading,
}: {
  items: SideNavItem<K>[];
  active: K;
  onSelect: (key: K) => void;
  label: string;
  heading?: string;
}) {
  return (
    <nav className="snav" aria-label={label}>
      {heading && <div className="snav-head">{heading}</div>}
      <div className="snav-list" role="tablist" aria-orientation="vertical">
        {items.map((x, i) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            aria-selected={active === x.key}
            className={`snav-tab${active === x.key ? " is-active" : ""}`}
            onClick={() => onSelect(x.key)}
          >
            <span className="snav-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="snav-label">{x.label}</span>
            {!!x.count && x.count > 0 && <span className="snav-count">{x.count > 99 ? "99+" : x.count}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}
