import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Сброс пароля — Annuli" },
      { name: "description", content: "Установка нового пароля Annuli." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dark = localStorage.getItem("annuli-theme") !== "light";
    document.documentElement.classList.toggle("dark", dark);
    // Ссылка из письма содержит токен восстановления; ждём событие PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    if (window.location.hash.includes("type=recovery")) setReady(true);
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Пароль обновлён");
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-light p-5">
        <h1 className="text-lg font-semibold text-foreground">Новый пароль</h1>
        {ready ? (
          <form onSubmit={(ev) => void submit(ev)} className="mt-4 flex flex-col gap-3">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              placeholder="Новый пароль"
              aria-label="Новый пароль"
              className="h-10 w-full rounded-lg border border-border bg-surface-dark px-3 text-[14px] text-foreground outline-none transition focus:border-stroke-bright"
            />
            <button
              type="submit"
              disabled={busy}
              className="h-10 rounded-lg bg-primary text-[14px] font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              Сохранить пароль
            </button>
          </form>
        ) : (
          <p className="mt-3 text-[13px] text-muted-foreground">
            Ссылка недействительна или устарела. Запросите сброс пароля на странице входа.
          </p>
        )}
      </div>
      <Toaster />
    </div>
  );
}
