import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { SecHead } from "@/components/site/sections";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Личный кабинет — Annuli" },
      {
        name: "description",
        content:
          "Личный кабинет Annuli: проект семейной книги, этапы работы, заявки, сообщения и родословная база.",
      },
      { property: "og:title", content: "Личный кабинет — Annuli" },
      { property: "og:description", content: "Ваш проект книги и родословная база в одном месте." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setEmail(data.user?.email ?? "");
    });
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["account-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", userId!)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile?.display_name !== undefined) {
      setDisplayName(profile.display_name);
      setSavedName(profile.display_name);
    }
  }, [profile?.display_name]);

  const { data: persons } = useQuery({
    queryKey: ["account-persons-count", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count } = await supabase
        .from("persons")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId!);
      return count ?? 0;
    },
  });

  const { data: project } = useQuery({
    queryKey: ["account-project", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("book_projects")
        .select("id, title, plan, status, due_date, notes")
        .eq("owner_id", userId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: stages } = useQuery({
    queryKey: ["account-stages", project?.id],
    enabled: !!project?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("project_stages")
        .select("id, title, status, position")
        .eq("project_id", project!.id)
        .order("position", { ascending: true });
      return data ?? [];
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["account-leads", email],
    enabled: !!email,
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, plan, status, message, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["account-messages", project?.id],
    enabled: !!project?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, body, created_at, sender_id")
        .eq("project_id", project!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const saveName = async () => {
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").update({ display_name: displayName }).eq("id", userId);
    setSavedName(displayName);
    setSaving(false);
    void queryClient.invalidateQueries({ queryKey: ["account-profile", userId] });
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const statusLabel = (s: string) =>
    ({
      draft: t("Черновик", "Draft"),
      active: t("В работе", "In progress"),
      review: t("На согласовании", "In review"),
      done: t("Завершён", "Completed"),
      pending: t("Ожидает", "Pending"),
      new: t("Новая", "New"),
    })[s] ?? s;

  return (
    <SiteLayout>
      <section>
        <SecHead
          title={t("Личный кабинет", "Your Account")}
          sub={savedName || email || t("Аккаунт", "Account")}
        />

        <div className="account-grid">
          <div className="account-card">
            <div className="contact-kicker">{t("Родословная база", "Family Database")}</div>
            <p className="ap-card-desc">
              {t(
                "Загружайте персон, фотографии и документы — эти материалы становятся основой книги.",
                "Add people, photos and documents — this material becomes the basis of the book.",
              )}
            </p>
            <div className="plan-price">
              {persons ?? 0}
              <span className="plan-price-note"> {t("персон", "people")}</span>
            </div>
            <Link to="/app" className="btn btn--primary">
              {t("Открыть приложение", "Open the app")}
            </Link>
          </div>

          <div className="account-card">
            <div className="contact-kicker">{t("Проект книги", "Book Project")}</div>
            {project ? (
              <>
                <div className="plan-name">{project.title || t("Без названия", "Untitled")}</div>
                <ul className="plan-specs">
                  <li>
                    <span>{t("План", "Plan")}</span>
                    <span>{project.plan || "—"}</span>
                  </li>
                  <li>
                    <span>{t("Статус", "Status")}</span>
                    <span>{statusLabel(project.status)}</span>
                  </li>
                  <li>
                    <span>{t("Срок", "Due")}</span>
                    <span>{project.due_date ?? "—"}</span>
                  </li>
                </ul>
                {!!stages?.length && (
                  <ul className="plan-specs">
                    {stages.map((s) => (
                      <li key={s.id}>
                        <span>{s.title}</span>
                        <span>{statusLabel(s.status)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <p className="ap-card-desc">
                  {t(
                    "Активного проекта пока нет. Оставьте заявку — мы обсудим формат и запустим работу.",
                    "No active project yet. Send a request and we'll discuss the format and get started.",
                  )}
                </p>
                <Link to="/contact" className="btn btn--primary">
                  {t("Начать проект", "Start a project")}
                </Link>
              </>
            )}
          </div>

          <div className="account-card">
            <div className="contact-kicker">{t("Заявки", "Requests")}</div>
            {leads?.length ? (
              <ul className="plan-specs">
                {leads.map((l) => (
                  <li key={l.id}>
                    <span>{new Date(l.created_at).toLocaleDateString("ru-RU")}</span>
                    <span>
                      {l.plan || "—"} · {statusLabel(l.status)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ap-card-desc">{t("Заявок пока нет.", "No requests yet.")}</p>
            )}
          </div>

          <div className="account-card">
            <div className="contact-kicker">{t("Сообщения", "Messages")}</div>
            {messages?.length ? (
              <ul className="plan-specs">
                {messages.map((m) => (
                  <li key={m.id}>
                    <span>{new Date(m.created_at).toLocaleDateString("ru-RU")}</span>
                    <span>{m.body.slice(0, 60)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ap-card-desc">
                {t("Переписка появится после старта проекта.", "Messages appear once a project starts.")}
              </p>
            )}
          </div>

          <div className="account-card">
            <div className="contact-kicker">{t("Профиль", "Profile")}</div>
            <div className="form-field">
              <label className="form-lbl">{t("Имя", "Name")}</label>
              <input
                className="form-inp"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-lbl">Email</label>
              <input className="form-inp" value={email} readOnly />
            </div>
            <button className="form-btn" onClick={() => void saveName()} disabled={saving}>
              {saving ? t("Сохраняем…", "Saving…") : t("Сохранить", "Save")}
            </button>
            <button className="btn btn--ghost" onClick={() => void signOut()}>
              {t("Выйти", "Sign out")}
            </button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
