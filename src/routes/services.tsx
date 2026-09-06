import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Addons } from "@/components/site/sections";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Дополнительные услуги — Annuli" },
      {
        name: "description",
        content:
          "Доп. экземпляры, цифровой архив, реставрация фото, перевод книги, экспресс-срок и постер с древом.",
      },
      { property: "og:title", content: "Дополнительные услуги — Annuli" },
      { property: "og:description", content: "Услуги, которые можно добавить к любому плану." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SiteLayout>
      <Addons />
    </SiteLayout>
  ),
});
