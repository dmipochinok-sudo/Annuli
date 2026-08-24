import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Иконки системы — глифы SF Symbols, отрисованные шрифтом SF Pro.
 * Использование: <SFIcon glyph={SF.personBadgePlus} />
 */
export const SF = {
  personBadgePlus: "\u{100716}", // 􀜖
} as const;

interface Props {
  glyph: string;
  className?: string;
  size?: number | string;
  style?: CSSProperties;
  label?: string;
}

export function SFIcon({ glyph, className, size = "1.1em", style, label }: Props) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      className={cn("sf-icon", className)}
      style={{ fontSize: size, ...style }}
    >
      {glyph}
    </span>
  );
}
