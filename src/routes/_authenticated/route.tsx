import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["own-profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, is_blocked")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        Проверка доступа…
      </div>
    );
  }

  if (profile?.is_blocked) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-light p-6 text-center">
          <h1 className="text-lg font-semibold text-foreground">Доступ ограничен</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Ваша учётная запись заблокирована администратором. Если вы считаете это ошибкой,
            свяжитесь с администратором.
          </p>
          <button
            onClick={() => void signOut()}
            className="mt-5 h-9 w-full rounded-lg border border-border bg-surface-dark text-[14px] text-foreground transition hover:border-stroke-bright"
          >
            Выйти
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
