import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Contact } from "@/components/site/sections";

interface ContactSearch {
  plan: string | undefined;
}

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>): ContactSearch => ({
    plan: typeof search['plan'] === "string" && search['plan'] ? String(search['plan']) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Начать проект — Annuli" },
      {
        name: "description",
        content:
          "Оставьте заявку на семейную книгу: ответим в течение 24 часов, первая консультация бесплатно.",
      },
      { property: "og:title", content: "Начать проект — Annuli" },
      { property: "og:description", content: "Расскажите о вашей семье — мы предложим формат книги." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { plan } = Route.useSearch();
  return (
    <SiteLayout>
      <Contact initialPlan={plan ?? ""} />
    </SiteLayout>
  );
}
