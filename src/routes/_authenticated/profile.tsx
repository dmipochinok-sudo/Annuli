import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Профиль — Annuli" },
      { name: "description", content: "Настройки учётной записи Annuli." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["own-profile-full", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, avatar_url, created_at")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: role } = useQuery({
    queryKey: ["own-role", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return data ? "Администратор" : "Пользователь";
    },
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  const saveProfile = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
      await queryClient.invalidateQueries();
      toast.success("Профиль сохранён");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      toast.success("Пароль обновлён");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "h-10 w-full rounded-lg border border-border bg-surface-dark px-3 text-[14px] text-foreground outline-none transition focus:border-stroke-bright";

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Профиль</h1>
          <Link to="/" className="text-[13px] text-link hover:underline">
            ← К базе персон
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-surface-light p-5">
          <div className="mb-4 text-[13px] text-muted-foreground">
            <p>
              Email: <span className="text-foreground">{user.email}</span>
            </p>
            <p>
              Роль: <span className="text-foreground">{role ?? "…"}</span>
            </p>
          </div>

          <form onSubmit={(ev) => void saveProfile(ev)} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-[12px] text-muted-foreground">
              Отображаемое имя
              <input
                value={displayName}
                onChange={(ev) => setDisplayName(ev.target.value)}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] text-muted-foreground">
              Ссылка на аватар
              <input
                value={avatarUrl}
                onChange={(ev) => setAvatarUrl(ev.target.value)}
                placeholder="https://…"
                className={inputCls}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="h-10 rounded-lg bg-primary text-[14px] font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              Сохранить
            </button>
          </form>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface-light p-5">
          <h2 className="text-[15px] font-semibold text-foreground">Смена пароля</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Доступно для учётных записей с входом по электронной почте.
          </p>
          <form onSubmit={(ev) => void changePassword(ev)} className="mt-3 flex flex-col gap-3">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              placeholder="Новый пароль"
              aria-label="Новый пароль"
              className={inputCls}
            />
            <button
              type="submit"
              disabled={busy}
              className="h-10 rounded-lg border border-border bg-surface-dark text-[14px] font-medium text-foreground transition hover:border-stroke-bright disabled:opacity-50"
            >
              Обновить пароль
            </button>
          </form>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
