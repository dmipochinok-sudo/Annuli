/** Stroke-марка Annuli — концентрические кольца со смещёнными центрами. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className="logo-svg"
      aria-hidden="true"
    >
      <circle className="logo-ring ring-ink" cx="32" cy="32" r="31.5" />
      <circle className="logo-ring ring-ink" cx="34" cy="30.72" r="25.1" />
      <circle className="logo-ring ring-ink" cx="32" cy="32" r="18.7" />
      <circle className="logo-ring ring-ink" cx="34" cy="30.72" r="12.3" />
      <circle className="logo-ring ring-ink" cx="32" cy="32" r="5.9" />
    </svg>
  );
}
