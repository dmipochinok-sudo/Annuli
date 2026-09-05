import type { ReactNode } from "react";

import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { useScrollReveal } from "./Reveal";

/** Оболочка публичных страниц сайта. */
export function SiteLayout({ children }: { children: ReactNode }) {
  useScrollReveal();
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
