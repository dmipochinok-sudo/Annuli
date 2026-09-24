import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  createUserAccount,
  deleteUserAccount,
  listUsers,
  setProductRole,
  setUserAdmin,
  setUserBlocked,
  setUserOwner,
} from "@/lib/users.functions";
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

const btn =
  "h-8 rounded-lg border border-border bg-surface-dark px-3 text-[12px] font-medium text-foreground transition hover:border-stroke-bright disabled:opacity-50";
const dangerBtn =
  "h-8 rounded-lg bg-destructive px-3 text-[12px] font-medium text-destructive-foreground transition hover:brightness-110 disabled:opacity-50";
const inputCls =
  "h-9 w-full rounded-lg border border-border bg-surface-dark px-3 text-[13px] text-foreground outline-none transition focus:border-stroke-bright";

function AdminUsersPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "client" as "client" | "specialist",
  });

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["admin-check", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("is_admin");
      return !!data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin === true,
    queryFn: () => listUsers(),
  });

  const users = data?.users;
  const isOwner = !!data?.viewerIsOwner;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };
  const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : String(e));

  const blockMutation = useMutation({
    mutationFn: (args: { userId: string; blocked: boolean }) => setUserBlocked({ data: args }),
    onSuccess: async (_v, args) => {
      await refresh();
      toast.success(args.blocked ? "Пользователь заблокирован" : "Пользователь разблокирован");
    },
    onError,
  });

  const productMutation = useMutation({
    mutationFn: (args: { userId: string; role: "client" | "specialist" }) =>
      setProductRole({ data: args }),
    onSuccess: async (_v, args) => {
      await refresh();
      toast.success(args.role === "client" ? "Роль: Клиент" : "Роль: Специалист");
    },
    onError,
  });

  const adminMutation = useMutation({
    mutationFn: (args: { userId: string; makeAdmin: boolean }) => setUserAdmin({ data: args }),
    onSuccess: async (_v, args) => {
      await refresh();
      toast.success(args.makeAdmin ? "Назначен администратором" : "Права администратора сняты");
    },
    onError,
  });

  const ownerMutation = useMutation({
    mutationFn: (args: { userId: string; makeOwner: boolean }) => setUserOwner({ data: args }),
    onSuccess: async (_v, args) => {
      await refresh();
      toast.success(args.makeOwner ? "Назначен владельцем" : "Права владельца сняты");
    },
    onError,
  });

  const createMutation = useMutation({
    mutationFn: (args: typeof newUser) => createUserAccount({ data: args }),
    onSuccess: async () => {
      await refresh();
      setNewUser({ email: "", password: "", displayName: "", role: "client" });
      toast.success("Учётная запись создана");
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (args: { userId: string }) => deleteUserAccount({ data: args }),
    onSuccess: async () => {
      await refresh();
      toast.success("Учётная запись удалена");
    },
    onError,
  });

  const busy =
    blockMutation.isPending ||
    productMutation.isPending ||
    adminMutation.isPending ||
    ownerMutation.isPending ||
    createMutation.isPending ||
    deleteMutation.isPending;

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

  const roleName = (u: NonNullable<typeof users>[number]) =>
    u.isOwner
      ? "Владелец"
      : u.role === "admin"
        ? "Администратор"
        : u.productRole === "specialist"
          ? "Специалист"
          : "Клиент";

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Управление пользователями</h1>
          <Link to="/" className="text-[13px] text-link hover:underline">
            ← К базе персон
          </Link>
        </div>

        {isOwner && (
          <div className="mb-4 rounded-2xl border border-border bg-surface-light p-4">
            <h2 className="mb-3 text-[15px] font-semibold text-foreground">
              Создать учётную запись
            </h2>
            <div className="grid gap-3 sm:grid-cols-4">
              <input
                className={inputCls}
                placeholder="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="Имя"
                value={newUser.displayName}
                onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="Пароль (мин. 8 символов)"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
              <select
                className={inputCls}
                aria-label="Роль"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value as "client" | "specialist" })
                }
              >
                <option value="client">Клиент</option>
                <option value="specialist">Специалист</option>
              </select>
            </div>
            <button
              className={`${btn} mt-3`}
              disabled={busy || !newUser.email || newUser.password.length < 8}
              onClick={() => createMutation.mutate(newUser)}
            >
              {createMutation.isPending ? "Создаём…" : "Создать"}
            </button>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface-light">
          <table className="w-full min-w-[720px] text-left text-[13px]">
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
                  <tr key={u.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-4 py-3 text-foreground">
                      {u.display_name || "—"}
                      {u.isSelf && (
                        <span className="ml-2 text-[11px] text-muted-foreground">(вы)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-foreground">{roleName(u)}</td>
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
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link to="/" search={{ owner: u.id }} className={btn + " inline-flex items-center"}>
                          Открыть базу
                        </Link>
                        {!u.isSelf && (
                          <button
                            onClick={() =>
                              blockMutation.mutate({ userId: u.id, blocked: !u.is_blocked })
                            }
                            disabled={busy}
                            className={u.is_blocked ? btn : dangerBtn}
                          >
                            {u.is_blocked ? "Разблокировать" : "Заблокировать"}
                          </button>
                        )}
                        {isOwner && (
                          <>
                            <button
                              className={btn}
                              disabled={busy || u.productRole === "client"}
                              onClick={() =>
                                productMutation.mutate({ userId: u.id, role: "client" })
                              }
                            >
                              Сделать клиентом
                            </button>
                            <button
                              className={btn}
                              disabled={busy || u.productRole === "specialist"}
                              onClick={() =>
                                productMutation.mutate({ userId: u.id, role: "specialist" })
                              }
                            >
                              Сделать специалистом
                            </button>
                            <button
                              className={btn}
                              disabled={busy || u.isOwner}
                              onClick={() =>
                                adminMutation.mutate({
                                  userId: u.id,
                                  makeAdmin: u.role !== "admin",
                                })
                              }
                            >
                              {u.role === "admin" ? "Снять администратора" : "Назначить администратором"}
                            </button>
                            {!u.isOwner && (
                              <button
                                className={btn}
                                disabled={busy}
                                onClick={() =>
                                  ownerMutation.mutate({ userId: u.id, makeOwner: true })
                                }
                              >
                                Назначить владельцем
                              </button>
                            )}
                            {u.isOwner && !u.isSelf && (
                              <button
                                className={dangerBtn}
                                disabled={busy}
                                onClick={() => {
                                  if (window.confirm(`Снять владельца с ${u.email}?`)) {
                                    ownerMutation.mutate({ userId: u.id, makeOwner: false });
                                  }
                                }}
                              >
                                Снять владельца
                              </button>
                            )}
                            {!u.isSelf && !u.isOwner && (
                              <button
                                className={dangerBtn}
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Удалить учётную запись ${u.email}? Действие необратимо.`,
                                    )
                                  ) {
                                    deleteMutation.mutate({ userId: u.id });
                                  }
                                }}
                              >
                                Удалить
                              </button>
                            )}
                          </>
                        )}
                      </div>
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
