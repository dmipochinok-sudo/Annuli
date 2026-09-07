import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/site/Logo";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход — Annuli" },
      {
        name: "description",
        content: "Вход в личный кабинет Annuli: проект книги, заявки и родословная база.",
      },
      { property: "og:title", content: "Вход — Annuli" },
      { property: "og:description", content: "Личный кабинет Annuli." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/account", replace: true });
    });
  }, [navigate]);

  const oauth = async (provider: "google" | "apple") => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error(t("Ошибка входа: ", "Sign-in error: ") + result.error.message);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/account", replace: true });
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
        toast.success(
          t("Письмо со ссылкой для сброса пароля отправлено", "Password reset email sent"),
        );
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
          toast.success(
            t("Проверьте почту и подтвердите регистрацию", "Check your email to confirm sign-up"),
          );
          setMode("signin");
          return;
        }
        navigate({ to: "/account", replace: true });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/account", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-brand">
        <Logo size={32} />
        <span className="masthead-name auth-brand-name">Annuli</span>
      </Link>

      <div className="auth-card">
        <div className="contact-kicker">
          {mode === "signup"
            ? t("Регистрация", "Create account")
            : mode === "forgot"
              ? t("Восстановление пароля", "Password recovery")
              : t("Вход в кабинет", "Sign in")}
        </div>
        <p className="ap-card-desc">
          {t(
            "Личный кабинет: проект книги, заявки и ваша родословная база.",
            "Your account: book project, requests and your family database.",
          )}
        </p>

        <div className="auth-oauth">
          <button className="btn btn--ghost" onClick={() => void oauth("google")} disabled={busy}>
            {t("Войти через Google", "Continue with Google")}
          </button>
          <button className="btn btn--ghost" onClick={() => void oauth("apple")} disabled={busy}>
            {t("Войти через Apple", "Continue with Apple")}
          </button>
        </div>

        <div className="auth-sep">
          <span>{t("или по электронной почте", "or with email")}</span>
        </div>

        <form className="form" onSubmit={(ev) => void submit(ev)}>
          {mode === "signup" && (
            <div className="form-field">
              <label className="form-lbl">{t("Отображаемое имя", "Display name")}</label>
              <input
                className="form-inp"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
              />
            </div>
          )}
          <div className="form-field">
            <label className="form-lbl">Email</label>
            <input
              className="form-inp"
              type="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
            />
          </div>
          {mode !== "forgot" && (
            <div className="form-field">
              <label className="form-lbl">{t("Пароль", "Password")}</label>
              <input
                className="form-inp"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </div>
          )}
          <button className="form-btn" type="submit" disabled={busy}>
            {mode === "signin" && t("Войти", "Sign in")}
            {mode === "signup" && t("Зарегистрироваться", "Create account")}
            {mode === "forgot" && t("Отправить ссылку", "Send link")}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "signin" ? (
            <>
              <button onClick={() => setMode("forgot")}>
                {t("Забыли пароль?", "Forgot password?")}
              </button>
              <button onClick={() => setMode("signup")}>
                {t("Создать аккаунт", "Create account")}
              </button>
            </>
          ) : (
            <button onClick={() => setMode("signin")}>
              {t("← Назад ко входу", "← Back to sign in")}
            </button>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
