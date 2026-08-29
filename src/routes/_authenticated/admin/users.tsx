import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listUsers, setUserBlocked } from "@/lib/users.functions";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Пользователи — Annuli" },
      { name: "description", content: "Управление учётными записями Annuli." },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["admin-check", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("is_admin");
      return !!data;
    },
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin === true,
    queryFn: () => listUsers(),
  });

  const blockMutation = useMutation({
    mutationFn: (args: { userId: string; blocked: boolean }) => setUserBlocked({ data: args }),
    onSuccess: async (_v, args) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(args.blocked ? "Пользователь заблокирован" : "Пользователь разблокирован");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

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

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Управление пользователями</h1>
          <Link to="/" className="text-[13px] text-link hover:underline">
            ← К базе персон
          </Link>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface-light">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Роль</th>
                <th className="px-4 py-3 font-medium">Регистрация</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {isLoading || !users ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Загрузка…
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">
                      {u.display_name || "—"}
                      {u.isSelf && (
                        <span className="ml-2 text-[11px] text-muted-foreground">(вы)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-foreground">
                      {u.role === "admin" ? "Администратор" : "Пользователь"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[11px] " +
                          (u.is_blocked
                            ? "bg-destructive/15 text-destructive"
                            : "bg-primary/15 text-foreground")
                        }
                      >
                        {u.is_blocked ? "Заблокирован" : "Активен"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/"
                        search={{ owner: u.id }}
                        className="mr-2 inline-flex h-8 items-center rounded-lg border border-border bg-surface-dark px-3 text-[12px] font-medium text-foreground transition hover:border-stroke-bright"
                      >
                        Открыть базу
                      </Link>
                      {!u.isSelf && (
                        <button
                          onClick={() =>
                            blockMutation.mutate({ userId: u.id, blocked: !u.is_blocked })
                          }
                          disabled={blockMutation.isPending}
                          className={
                            "h-8 rounded-lg px-3 text-[12px] font-medium transition disabled:opacity-50 " +
                            (u.is_blocked
                              ? "border border-border bg-surface-dark text-foreground hover:border-stroke-bright"
                              : "bg-destructive text-destructive-foreground hover:brightness-110")
                          }
                        >
                          {u.is_blocked ? "Разблокировать" : "Заблокировать"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
