import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Plans } from "@/components/site/sections";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Тарифные планы — Annuli" },
      {
        name: "description",
        content:
          "Четыре плана семейной книги: Базовый $500, Стандарт $850, Премиум $1750 и Эксклюзив $4000.",
      },
      { property: "og:title", content: "Тарифные планы — Annuli" },
      { property: "og:description", content: "Стоимость и состав каждого плана семейной книги." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SiteLayout>
      <Plans />
    </SiteLayout>
  ),
});
