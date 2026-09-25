import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  createUserAccount,
  deleteUserAccount,
  listUsers,
  setProductRole,
  setUserAdmin,
  setUserBlocked,
  setUserOwner,
} from "@/lib/users.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AccessPanel,
  BasesPanel,
  NotificationsPanel,
  OrdersPanel,
  ProfilePanel,
} from "@/components/site/cabinet/CabinetPanels";

type RoleChoice = "client" | "specialist" | "admin";
type UserRow = Awaited<ReturnType<typeof listUsers>>["users"][number];

const CARD_TABS: [string, typeof ProfilePanel][] = [
  ["Профиль", ProfilePanel],
  ["Заказы", OrdersPanel],
  ["Материалы и базы", BasesPanel],
  ["Доступы", AccessPanel],
  ["Уведомления", NotificationsPanel],
];

const btn =
  "h-8 rounded-lg border border-border bg-surface-dark px-3 text-[12px] font-medium text-foreground transition hover:border-stroke-bright disabled:opacity-50";
const dangerBtn =
  "h-8 rounded-lg bg-destructive px-3 text-[12px] font-medium text-destructive-foreground transition hover:brightness-110 disabled:opacity-50";
const inputCls =
  "h-9 w-full rounded-lg border border-border bg-surface-dark px-3 text-[13px] text-foreground outline-none transition focus:border-stroke-bright";

/** Вкладка «Пользователи» в CMS: таблица учётных записей и владельческие действия. */
export function UsersTab() {
  const queryClient = useQueryClient();
  const [cardUser, setCardUser] = useState<UserRow | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "client" as RoleChoice,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
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

  const roleName = (u: UserRow) =>
    u.isOwner
      ? "Владелец"
      : u.role === "admin"
        ? "Администратор"
        : u.productRole === "specialist"
          ? "Специалист"
          : "Клиент";

  const changeRole = async (u: UserRow, next: RoleChoice) => {
    const wasAdmin = u.role === "admin";
    if (next === "admin" && !wasAdmin) {
      if (!window.confirm(`Выдать ${u.email} права администратора?`)) return;
      adminMutation.mutate({ userId: u.id, makeAdmin: true });
      return;
    }
    if (wasAdmin && next !== "admin") {
      if (!window.confirm(`Снять с ${u.email} права администратора?`)) return;
      await adminMutation.mutateAsync({ userId: u.id, makeAdmin: false });
    }
    if (next !== "admin" && next !== u.productRole) {
      productMutation.mutate({ userId: u.id, role: next });
    }
  };

  return (
    <div className="cms-users">
      <Sheet open={!!cardUser} onOpenChange={(o) => !o && setCardUser(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          {cardUser && (
            <>
              <SheetHeader>
                <SheetTitle>{cardUser.display_name || cardUser.email}</SheetTitle>
                <p className="text-[12px] text-muted-foreground">
                  {cardUser.email} · {roleName(cardUser)}
                </p>
              </SheetHeader>
              <div className="cab-sheet">
                {CARD_TABS.map(([title, Panel]) => (
                  <section key={title} className="cab-sheet-sec">
                    <h3 className="cab-sheet-h">{title}</h3>
                    <Panel uid={cardUser.id} mode="staff" />
                  </section>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
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
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as RoleChoice })}
            >
              <option value="client">Клиент</option>
              <option value="specialist">Специалист</option>
              <option value="admin">Администратор</option>
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
                      <button className={btn} onClick={() => setCardUser(u)}>
                        Кабинет
                      </button>
                      <Link to="/" search={{ owner: u.id }} className={btn + " inline-flex items-center"}>
                        Открыть базу
                      </Link>
                      {isOwner && (
                        <select
                          className={btn + " pr-7"}
                          aria-label="Роль"
                          disabled={busy || u.isOwner}
                          value={u.role === "admin" ? "admin" : u.productRole}
                          onChange={(e) => void changeRole(u, e.target.value as RoleChoice)}
                        >
                          <option value="client">Клиент</option>
                          <option value="specialist">Специалист</option>
                          <option value="admin">Администратор</option>
                        </select>
                      )}
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
                          {!u.isOwner && (
                            <button
                              className={btn}
                              disabled={busy}
                              onClick={() => {
                                if (window.confirm(`Назначить ${u.email} владельцем?`)) {
                                  ownerMutation.mutate({ userId: u.id, makeOwner: true });
                                }
                              }}
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
  );
}
