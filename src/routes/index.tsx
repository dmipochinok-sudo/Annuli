import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Hero, Approach, Process, Plans, Addons, PullQuote, Contact } from "@/components/site/sections";
import { SpecialistsSection } from "@/components/site/SpecialistsSection";
import { useSectionVisibility } from "@/lib/cms/site-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Annuli — книги семейной истории под ключ" },
      {
        name: "description",
        content:
          "Annuli создаёт книги о вашей семье: интервью, тексты, дизайн, генеалогическое древо и печать. Полностью под ключ.",
      },
      { property: "og:title", content: "Annuli — книги семейной истории под ключ" },
      {
        property: "og:description",
        content: "От первого интервью до готового тома в твёрдом переплёте.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { isVisible } = useSectionVisibility();
  return (
    <SiteLayout>
      <Hero />
      {isVisible("approach") && <Approach />}
      {isVisible("process") && <Process />}
      {isVisible("plans") && <Plans />}
      {isVisible("addons") && <Addons />}
      {isVisible("specialists") && <SpecialistsSection />}
      {isVisible("quote") && <PullQuote />}
      {isVisible("contact") && <Contact />}
    </SiteLayout>
  );
}
