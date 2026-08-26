import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход — Annuli" },
      { name: "description", content: "Вход в генеалогическую базу Annuli." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dark = localStorage.getItem("annuli-theme") !== "light";
    document.documentElement.classList.toggle("dark", dark);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  const oauth = async (provider: "google" | "apple") => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Ошибка входа: " + result.error.message);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Письмо со ссылкой для сброса пароля отправлено");
        setMode("signin");
        return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Проверьте почту и подтвердите регистрацию");
          setMode("signin");
          return;
        }
        navigate({ to: "/", replace: true });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "h-10 w-full rounded-lg border border-border bg-surface-dark px-3 text-[14px] text-foreground outline-none transition focus:border-stroke-bright";

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <svg viewBox="0 0 100 100" className="size-12 text-foreground" aria-hidden>
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="5" />
            <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="4" opacity=".7" />
            <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="3" opacity=".45" />
          </svg>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Annuli</h1>
          <p className="text-[13px] text-muted-foreground">
            Приложение для работы с генеалогической базой данных
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-light p-5">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => void oauth("google")}
              disabled={busy}
              className="h-10 rounded-lg border border-border bg-surface-dark text-[14px] font-medium text-foreground transition hover:border-stroke-bright disabled:opacity-50"
            >
              Войти через Google
            </button>
            <button
              onClick={() => void oauth("apple")}
              disabled={busy}
              className="h-10 rounded-lg border border-border bg-surface-dark text-[14px] font-medium text-foreground transition hover:border-stroke-bright disabled:opacity-50"
            >
              Войти через Apple
            </button>
          </div>

          <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            или по электронной почте
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={(ev) => void submit(ev)} className="flex flex-col gap-3">
            {mode === "signup" && (
              <input
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="Отображаемое имя"
                aria-label="Отображаемое имя"
                className={inputCls}
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="Email"
              aria-label="Email"
              className={inputCls}
            />
            {mode !== "forgot" && (
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                placeholder="Пароль"
                aria-label="Пароль"
                className={inputCls}
              />
            )}
            <button
              type="submit"
              disabled={busy}
              className="h-10 rounded-lg bg-primary text-[14px] font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              {mode === "signin" && "Войти"}
              {mode === "signup" && "Зарегистрироваться"}
              {mode === "forgot" && "Отправить ссылку"}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[13px]">
            {mode === "signin" ? (
              <>
                <button onClick={() => setMode("forgot")} className="text-link hover:underline">
                  Забыли пароль?
                </button>
                <button onClick={() => setMode("signup")} className="text-link hover:underline">
                  Создать аккаунт
                </button>
              </>
            ) : (
              <button onClick={() => setMode("signin")} className="text-link hover:underline">
                ← Назад ко входу
              </button>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
