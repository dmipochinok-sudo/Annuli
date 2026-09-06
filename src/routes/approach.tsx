import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Approach, PullQuote } from "@/components/site/sections";

export const Route = createFileRoute("/approach")({
  head: () => ({
    meta: [
      { title: "Подход — Annuli" },
      {
        name: "description",
        content:
          "Как Annuli работает с семейной историей: только под ключ, живые интервью, честный дизайн и книга на века.",
      },
      { property: "og:title", content: "Подход — Annuli" },
      { property: "og:description", content: "Методология создания семейной книги Annuli." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SiteLayout>
      <Approach />
      <PullQuote />
    </SiteLayout>
  ),
});
