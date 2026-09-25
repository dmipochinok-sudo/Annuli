import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { SiteLayout } from "@/components/site/SiteLayout";
import {
  AccessPanel,
  AppPanel,
  BasesPanel,
  NotificationsPanel,
  OrdersPanel,
  ProfilePanel,
} from "@/components/site/cabinet/CabinetPanels";
import { InquiriesPanel, useInquiries } from "@/components/site/cabinet/InquiriesPanel";
import { SpecialistCabinet } from "@/components/site/cabinet/SpecialistCabinet";
import { SectionNav } from "@/components/site/SectionNav";
import { useI18n } from "@/lib/i18n";
import { useNotifications } from "@/lib/cabinet";
import { supabase } from "@/integrations/supabase/client";
import {
  registerProductRole,
  roleLabel,
  useAppRole,
  useProductRole,
  type ProductRole,
} from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Личный кабинет — Annuli" },
      {
        name: "description",
        content:
          "Личный кабинет Annuli: профиль, заказы семейной книги, материалы и базы, доступы специалистов и уведомления.",
      },
      { property: "og:title", content: "Личный кабинет — Annuli" },
      { property: "og:description", content: "Заказы, базы и доступы в одном месте." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

type TabKey = "profile" | "orders" | "inquiries" | "bases" | "access" | "app" | "notifications";

function AccountPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("profile");
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: appRole } = useAppRole(userId);
  const { data: productRole } = useProductRole(userId);
  const { data: notes } = useNotifications(userId);
  const { data: inquiries } = useInquiries(userId ?? "");
  const unread = notes?.filter((n) => !n.read_at).length ?? 0;
  const unreadInquiries = inquiries?.filter((item) => item.client_id === userId && item.unread_count > 0).length ?? 0;

  const chooseRole = async (role: ProductRole) => {
    setSavingRole(true);
    try {
      await registerProductRole(role);
      await queryClient.invalidateQueries({ queryKey: ["product-role", userId] });
      await queryClient.invalidateQueries({ queryKey: ["current-app-role", userId] });
    } finally {
      setSavingRole(false);
    }
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "profile", label: t("Профиль", "Profile") },
    { key: "orders", label: t("Мои заказы", "My orders") },
    { key: "inquiries", label: t("Заявки и чат", "Inquiries & chat") },
    { key: "bases", label: t("Материалы и базы", "Materials & databases") },
    { key: "access", label: t("Доступы", "Access") },
    { key: "app", label: t("Приложение", "App") },
    { key: "notifications", label: t("Уведомления", "Notifications") },
  ];
  const current = tabs.find((x) => x.key === tab) ?? tabs[0];

  if (userId && productRole === "specialist") {
    return (
      <SiteLayout>
        <SpecialistCabinet uid={userId} roleText={roleLabel(appRole, lang)} />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="cab">
        <SectionNav
          label={t("Разделы кабинета", "Account sections")}
          title={`${t("Кабинет", "Account")} · ${roleLabel(appRole, lang)}`}
          items={tabs.map((x) => ({
            ...x,
            badge: x.key === "notifications" ? unread : x.key === "inquiries" ? unreadInquiries : 0,
          }))}
          active={tab}
          onChange={setTab}
        />

        <div className="cab-body">
          <h1 className="cab-title">{current.label}</h1>
          {productRole === null && appRole !== "owner" && appRole !== "admin" && (
            <div className="cab-card cab-card--muted">
              <div className="form-lbl">
                {t("Укажите, кто вы — это сохранится один раз", "Tell us who you are — saved once")}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn--ghost" onClick={() => void chooseRole("client")} disabled={savingRole}>
                  {t("Клиент", "Client")}
                </button>
                <button className="btn btn--ghost" onClick={() => void chooseRole("specialist")} disabled={savingRole}>
                  {t("Специалист", "Specialist")}
                </button>
              </div>
            </div>
          )}
          {userId && (
            <>
              {tab === "profile" && <ProfilePanel uid={userId} mode="self" />}
              {tab === "orders" && <OrdersPanel uid={userId} mode="self" />}
              {tab === "inquiries" && <InquiriesPanel uid={userId} perspective="client" />}
              {tab === "bases" && <BasesPanel uid={userId} mode="self" />}
              {tab === "access" && <AccessPanel uid={userId} mode="self" />}
              {tab === "app" && <AppPanel />}
              {tab === "notifications" && <NotificationsPanel uid={userId} mode="self" />}
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
