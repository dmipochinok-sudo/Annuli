import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import {
  ORDER_STATUSES,
  fmtDate,
  fmtMoney,
  statusText,
  useBaseStats,
  useCabinetProfile,
  useGrants,
  useNotifications,
  useOrders,
  useSpecialists,
  type Order,
} from "@/lib/cabinet";

type Mode = "self" | "staff";
interface PanelProps {
  uid: string;
  mode: Mode;
}

const logAction = (action: string, target: string, details: Record<string, unknown> = {}) =>
  supabase.rpc("log_action", { _category: "users", _action: action, _target: target, _details: details as never });

/* ───────────── 01 Профиль ───────────── */
export function ProfilePanel({ uid, mode }: PanelProps) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: p } = useCabinetProfile(uid);
  const [form, setForm] = useState({ display_name: "", phone: "", city: "", note: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (p) setForm({ display_name: p.display_name, phone: p.phone, city: p.city, note: p.note });
  }, [p]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", uid);
    setSaving(false);
    if (error) return toast.error(error.message);
    if (mode === "staff") void logAction("update_profile", uid);
    toast.success(t("Профиль сохранён", "Profile saved"));
    void qc.invalidateQueries({ queryKey: ["cab-profile", uid] });
  };

  const field = (key: keyof typeof form, label: string, textarea = false) => (
    <div className="form-field">
      <label className="form-lbl">{label}</label>
      {textarea ? (
        <textarea
          className="form-inp"
          rows={3}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      ) : (
        <input
          className="form-inp"
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      )}
    </div>
  );

  return (
    <div className="cab-form">
      <div className="cab-grid2">
        {field("display_name", t("Имя", "Name"))}
        <div className="form-field">
          <label className="form-lbl">Email</label>
          <input className="form-inp" value={p?.email ?? ""} readOnly />
        </div>
        {field("phone", t("Телефон", "Phone"))}
        {field("city", t("Город", "City"))}
      </div>
      {field("note", t("Комментарий", "Comment"), true)}
      <button className="form-btn" onClick={() => void save()} disabled={saving}>
        {saving ? t("Сохраняем…", "Saving…") : t("Сохранить", "Save")}
      </button>
    </div>
  );
}

/* ───────────── 02 Заказы ───────────── */
export function OrdersPanel({ uid, mode }: PanelProps) {
  const { t, lang } = useI18n();
  const { data: orders } = useOrders(uid);
  return (
    <div className="cab-list">
      {mode === "staff" && <NewOrderForm uid={uid} />}
      {!orders?.length && (
        <p className="ap-card-desc">
          {t(
            "Заказов пока нет. Оставьте заявку — мы свяжемся и оформим заказ.",
            "No orders yet. Send a request and we'll set up your order.",
          )}
        </p>
      )}
      {orders?.map((o) =>
        mode === "staff" ? (
          <OrderEditor key={o.id} uid={uid} order={o} />
        ) : (
          <div className="cab-card" key={o.id}>
            <div className="cab-card-head">
              <span className="cab-kicker">{o.order_no}</span>
              <span className={`cab-badge${o.status === "done" ? " cab-badge--done" : ""}`}>
                {statusText(o.status, lang)}
              </span>
            </div>
            <div className="cab-card-title">{o.title || t("Без названия", "Untitled")}</div>
            <div className="cab-meta">
              {[o.plan, fmtMoney(o.amount) + " · " + t("оплачено", "paid") + ": " + fmtMoney(o.paid_amount)]
                .filter(Boolean)
                .join(" · ")}
            </div>
            <StageList order={o} />
          </div>
        ),
      )}
    </div>
  );
}

function StageList({ order }: { order: Order }) {
  const { lang } = useI18n();
  const rows = [
    { id: "created", title: statusText("new", lang), at: order.created_at },
    ...order.stages.map((s) => ({ id: s.id, title: s.title, at: s.completed_at ?? s.created_at })),
  ];
  return (
    <ul className="cab-stages">
      {rows.map((r) => (
        <li key={r.id}>
          <span>{r.title}</span>
          <span>{fmtDate(r.at, lang)}</span>
        </li>
      ))}
    </ul>
  );
}

function NewOrderForm({ uid }: { uid: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", plan: "", amount: "" });
  const create = async () => {
    if (!f.title.trim()) return toast.error(t("Укажите название", "Enter a title"));
    const { data, error } = await supabase
      .from("book_projects")
      .insert({ owner_id: uid, title: f.title, plan: f.plan, amount: Number(f.amount) || 0, status: "new" })
      .select("order_no")
      .single();
    if (error) return toast.error(error.message);
    void supabase.rpc("log_action", {
      _category: "orders",
      _action: "create_order",
      _target: uid,
      _details: { order: data.order_no, title: f.title } as never,
    });
    setF({ title: "", plan: "", amount: "" });
    toast.success(t("Заказ создан", "Order created"));
    void qc.invalidateQueries({ queryKey: ["cab-orders", uid] });
  };
  return (
    <div className="cab-card cab-card--muted">
      <div className="cab-kicker">{t("Новый заказ", "New order")}</div>
      <div className="cab-grid3">
        <input className="form-inp" placeholder={t("Название", "Title")} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className="form-inp" placeholder={t("Тариф", "Plan")} value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })} />
        <input className="form-inp" inputMode="numeric" placeholder={t("Сумма, ₽", "Amount, ₽")} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
      </div>
      <button className="btn btn--ghost" onClick={() => void create()}>
        {t("Создать заказ", "Create order")}
      </button>
    </div>
  );
}

function OrderEditor({ uid, order }: { uid: string; order: Order }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [f, setF] = useState({
    title: order.title,
    plan: order.plan,
    amount: String(order.amount),
    paid: String(order.paid_amount),
    status: order.status,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const statusChanged = f.status !== order.status;
    const { error } = await supabase
      .from("book_projects")
      .update({
        title: f.title,
        plan: f.plan,
        amount: Number(f.amount) || 0,
        paid_amount: Number(f.paid) || 0,
        status: f.status,
      })
      .eq("id", order.id);
    if (!error && statusChanged) {
      await supabase.from("project_stages").insert({
        project_id: order.id,
        title: statusText(f.status, "ru"),
        status: "done",
        position: order.stages.length + 1,
        completed_at: new Date().toISOString(),
      });
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    void supabase.rpc("log_action", {
      _category: "orders",
      _action: statusChanged ? "order_status" : "update_order",
      _target: uid,
      _details: { order: order.order_no, status: f.status, paid: Number(f.paid) || 0 } as never,
    });
    toast.success(t("Заказ сохранён", "Order saved"));
    void qc.invalidateQueries({ queryKey: ["cab-orders", uid] });
  };

  return (
    <div className="cab-card">
      <div className="cab-card-head">
        <span className="cab-kicker">{order.order_no}</span>
        <span className="cab-badge">{statusText(order.status, lang)}</span>
      </div>
      <div className="cab-grid2">
        <input className="form-inp" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className="form-inp" placeholder={t("Тариф", "Plan")} value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })} />
        <label className="cab-inline">
          <span className="form-lbl">{t("Сумма, ₽", "Amount, ₽")}</span>
          <input className="form-inp" inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        </label>
        <label className="cab-inline">
          <span className="form-lbl">{t("Оплачено, ₽", "Paid, ₽")}</span>
          <input className="form-inp" inputMode="numeric" value={f.paid} onChange={(e) => setF({ ...f, paid: e.target.value })} />
        </label>
      </div>
      <label className="cab-inline">
        <span className="form-lbl">{t("Статус", "Status")}</span>
        <select className="form-inp" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusText(s, lang)}
            </option>
          ))}
        </select>
      </label>
      <StageList order={order} />
      <button className="btn btn--ghost" onClick={() => void save()} disabled={saving}>
        {saving ? t("Сохраняем…", "Saving…") : t("Сохранить заказ", "Save order")}
      </button>
    </div>
  );
}

/* ───────────── 03 Материалы и базы ───────────── */
export function BasesPanel({ uid, mode }: PanelProps) {
  const { t } = useI18n();
  const { data: stats } = useBaseStats(uid);
  const { data: p } = useCabinetProfile(uid);
  const name = p?.display_name ? `${t("Архив", "Archive")}: ${p.display_name}` : t("Семейный архив", "Family archive");
  return (
    <div className="cab-list">
      <p className="ap-card-desc">
        {t(
          "Материалы передаются через облако по защищённой ссылке — доступ пришлём после консультации. Базы собираются в генеалогическом приложении.",
          "Materials are shared via a secure cloud link after the consultation. Databases are built in the genealogy app.",
        )}
      </p>
      <div className="cab-card">
        <div className="cab-card-title">{name}</div>
        <div className="cab-kicker">
          {stats?.persons ?? 0} {t("персон", "people")}
        </div>
        {mode === "self" ? (
          <Link to="/app" className="btn btn--primary">
            {t("Открыть приложение", "Open the app")}
          </Link>
        ) : (
          <a href={`/app?owner=${uid}`} className="btn btn--ghost">
            {t("Открыть базу", "Open database")}
          </a>
        )}
      </div>
    </div>
  );
}

/* ───────────── 04 Доступы ───────────── */
const TERMS = [
  { v: "1", ru: "1 месяц", en: "1 month" },
  { v: "3", ru: "3 месяца", en: "3 months" },
  { v: "6", ru: "6 месяцев", en: "6 months" },
  { v: "12", ru: "12 месяцев", en: "12 months" },
  { v: "0", ru: "Бессрочно", en: "No limit" },
];

export function AccessPanel({ uid, mode }: PanelProps) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data: grants } = useGrants(uid);
  const { data: specialists } = useSpecialists();
  const [f, setF] = useState({ grantee: "", level: "view", term: "3", consent: false });
  const [busy, setBusy] = useState(false);
  const nameOf = (id: string) => specialists?.find((s) => s.id === id)?.display_name ?? "—";
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["cab-grants", uid] });
    void qc.invalidateQueries({ queryKey: ["cab-notifications", uid] });
  };

  const grant = async () => {
    if (!f.grantee) return toast.error(t("Выберите специалиста", "Choose a specialist"));
    if (!f.consent) return toast.error(t("Подтвердите согласие", "Confirm consent"));
    setBusy(true);
    const months = Number(f.term);
    const expires = months ? new Date(Date.now() + months * 30 * 864e5).toISOString() : null;
    const { error } = await supabase.from("base_access_grants").insert({
      owner_id: uid,
      grantee_id: f.grantee,
      level: f.level,
      expires_at: expires,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setF({ grantee: "", level: "view", term: "3", consent: false });
    toast.success(t("Доступ выдан", "Access granted"));
    refresh();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase
      .from("base_access_grants")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    if (mode === "staff") void logAction("revoke_access", uid, { grant: id });
    toast.success(t("Доступ отозван", "Access revoked"));
    refresh();
  };

  const active = (g: NonNullable<typeof grants>[number]) =>
    !g.revoked_at && (!g.expires_at || new Date(g.expires_at) > new Date());

  return (
    <div className="cab-list">
      {mode === "self" && (
        <>
          <p className="ap-card-desc">
            {t(
              "Вы выдаёте доступ к своей генеалогической базе специалисту. Отзыв возможен в любой момент.",
              "You grant a specialist access to your genealogy database. You can revoke it at any time.",
            )}
          </p>
          <div className="cab-card cab-card--muted">
            <div className="cab-grid2">
              <label className="cab-inline">
                <span className="form-lbl">{t("Специалист", "Specialist")}</span>
                <select className="form-inp" value={f.grantee} onChange={(e) => setF({ ...f, grantee: e.target.value })}>
                  <option value="">{t("— выберите —", "— choose —")}</option>
                  {specialists?.filter((s) => s.id !== uid).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.display_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cab-inline">
                <span className="form-lbl">{t("Уровень", "Level")}</span>
                <select className="form-inp" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>
                  <option value="view">{t("просмотр", "view")}</option>
                  <option value="edit">{t("редактирование", "edit")}</option>
                </select>
              </label>
              <label className="cab-inline">
                <span className="form-lbl">{t("Срок", "Term")}</span>
                <select className="form-inp" value={f.term} onChange={(e) => setF({ ...f, term: e.target.value })}>
                  {TERMS.map((x) => (
                    <option key={x.v} value={x.v}>
                      {lang === "en" ? x.en : x.ru}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="cab-check">
              <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
              <span>
                {t(
                  "Подтверждаю согласие на передачу данных базы выбранному специалисту (152-ФЗ)",
                  "I consent to sharing my database with the selected specialist",
                )}
              </span>
            </label>
            <button className="form-btn" onClick={() => void grant()} disabled={busy}>
              {t("Выдать доступ", "Grant access")}
            </button>
          </div>
        </>
      )}
      <div className="cab-kicker">{t("Выданные доступы", "Granted access")}</div>
      {!grants?.length && <p className="ap-card-desc">{t("Доступов пока нет.", "No access granted yet.")}</p>}
      {grants?.map((g) => (
        <div className="cab-card" key={g.id}>
          <div className="cab-card-head">
            <span className="cab-card-title">→ {nameOf(g.grantee_id)}</span>
            <span className={`cab-badge${active(g) ? " cab-badge--done" : ""}`}>
              {g.revoked_at ? t("отозван", "revoked") : active(g) ? t("активен", "active") : t("истёк", "expired")}
            </span>
          </div>
          <div className="cab-meta">
            {g.level === "edit" ? t("редактирование", "edit") : t("просмотр", "view")} ·{" "}
            {g.expires_at ? `${t("до", "until")} ${fmtDate(g.expires_at, lang)}` : t("бессрочно", "no limit")}
          </div>
          <ul className="cab-stages">
            <li>
              <span>{t("Доступ выдан", "Granted")}</span>
              <span>{fmtDate(g.created_at, lang)}</span>
            </li>
            <li>
              <span>{t("Согласие подтверждено (152-ФЗ)", "Consent confirmed")}</span>
              <span>{fmtDate(g.consent_at, lang)}</span>
            </li>
            {g.revoked_at && (
              <li>
                <span>{t("Отозван", "Revoked")}</span>
                <span>{fmtDate(g.revoked_at, lang)}</span>
              </li>
            )}
          </ul>
          {active(g) && (
            <button className="btn btn--ghost" onClick={() => void revoke(g.id)}>
              {t("Отозвать", "Revoke")}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ───────────── 05 Приложение ───────────── */
export function AppPanel() {
  const { t } = useI18n();
  return (
    <div className="cab-list">
      <p className="ap-card-desc">
        {t(
          "Сбор материалов, древо и экспорт для вёрстки происходят в отдельном генеалогическом приложении. Кабинет показывает ваши базы и доступы; файлы хранятся приватно.",
          "Collecting materials, the family tree and export for layout happen in the separate genealogy app. The cabinet shows your databases and access; files are stored privately.",
        )}
      </p>
      <p className="ap-card-desc">
        {t(
          "Издательство получает доступ к базе только при оформлении заказа — для передачи материалов в вёрстку.",
          "The publisher gets access to your database only once an order is placed — to pass materials to layout.",
        )}
      </p>
      <div>
        <Link to="/app" className="btn btn--primary">
          {t("Открыть приложение", "Open the app")}
        </Link>
      </div>
    </div>
  );
}

/* ───────────── 06 Уведомления ───────────── */
export function NotificationsPanel({ uid, mode }: PanelProps) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data: items } = useNotifications(uid);
  const unread = items?.filter((n) => !n.read_at).length ?? 0;

  const markAll = async () => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", uid).is("read_at", null);
    void qc.invalidateQueries({ queryKey: ["cab-notifications", uid] });
  };

  return (
    <div className="cab-list">
      {mode === "self" && unread > 0 && (
        <div>
          <button className="btn btn--ghost" onClick={() => void markAll()}>
            {t("Отметить все прочитанными", "Mark all as read")}
          </button>
        </div>
      )}
      {!items?.length && <p className="ap-card-desc">{t("Уведомлений пока нет.", "No notifications yet.")}</p>}
      {items?.map((n) => (
        <div className={`cab-note${n.read_at ? "" : " cab-note--new"}`} key={n.id}>
          <div>{n.body}</div>
          <div className="cab-kicker">{fmtDate(n.created_at, lang)}</div>
        </div>
      ))}
    </div>
  );
}
