import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Process } from "@/components/site/sections";

export const Route = createFileRoute("/process")({
  head: () => ({
    meta: [
      { title: "Процесс — Annuli" },
      {
        name: "description",
        content:
          "Четыре шага создания книги: знакомство, сбор историй, создание и печать с передачей семье.",
      },
      { property: "og:title", content: "Процесс — Annuli" },
      { property: "og:description", content: "Четыре шага от первого созвона до готовой книги." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SiteLayout>
      <Process />
    </SiteLayout>
  ),
});
