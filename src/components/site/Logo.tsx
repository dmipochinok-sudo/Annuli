/** Знак Annuli — концентрические кольца (срез дерева). */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className="logo-svg"
      aria-hidden="true"
    >
      <circle className="ring-ink" cx="18" cy="18" r="17.5" />
      <circle className="ring-bg" cx="18" cy="18" r="13.5" />
      <circle className="ring-ink" cx="18" cy="18" r="9.5" />
      <circle className="ring-bg" cx="18" cy="18" r="5.5" />
      <circle cx="18" cy="18" r="3" fill="#B8251A" />
      <circle className="ring-bg" cx="18" cy="18" r="1" />
    </svg>
  );
}
