import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { CmsPanel } from "@/components/site/CmsPanel";
import { useSiteContent } from "@/lib/cms/content";

export const Route = createFileRoute("/_authenticated/admin/cms")({
  head: () => ({
    meta: [
      { title: "Управление сайтом — Annuli" },
      { name: "description", content: "Редактирование содержимого главной страницы Annuli." },
    ],
  }),
  component: AdminCmsPage,
});

function AdminCmsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["admin-check", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("is_admin");
      return !!data;
    },
  });

  const content = useSiteContent();

  if (!roleLoading && !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-light p-6 text-center">
          <h1 className="text-lg font-semibold text-foreground">Нет доступа</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Этот раздел доступен только администраторам.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-5 h-9 w-full rounded-lg border border-border bg-surface-dark text-[14px] text-foreground transition hover:border-stroke-bright"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  if (roleLoading || content.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <p className="text-[13px] text-muted-foreground">Загрузка…</p>
      </div>
    );
  }

  return <CmsPanel content={content} onClose={() => navigate({ to: "/" })} onSiteHome={() => navigate({ to: "/" })} />;
}

export { Link };
