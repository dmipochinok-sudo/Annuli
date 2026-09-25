import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtDate } from "@/lib/cabinet";
import { imgDel, setActiveOwner } from "@/lib/annuli/db";
import { collectImageIds } from "@/lib/annuli/media";
import { normalizePerson, type Person } from "@/lib/annuli/types";
import { SpecialistDialog, type PublicSpecialist } from "@/components/site/SpecialistsSection";
import { InquiriesPanel, useInquiries } from "@/components/site/cabinet/InquiriesPanel";
import { SectionNav } from "@/components/site/SectionNav";

type Tab = "card" | "rates" | "inquiries" | "reviews" | "bases" | "limits";

interface Props {
  uid: string;
  roleText: string;
}

export function SpecialistCabinet({ uid, roleText }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("card");
  const { data: inquiries } = useInquiries(uid);
  const unread = inquiries?.filter((item) => item.specialist_id === uid && item.unread_count > 0).length ?? 0;
  const tabs: { key: Tab; label: string }[] = [
    { key: "card", label: t("Карточка", "Card") },
    { key: "rates", label: t("Тарифы", "Rates") },
    { key: "inquiries", label: t("Заявки", "Inquiries") },
    { key: "reviews", label: t("Отзывы", "Reviews") },
    { key: "bases", label: t("Базы", "Databases") },
    { key: "limits", label: t("Лимиты", "Limits") },
  ];
  const current = tabs.find((x) => x.key === tab) ?? tabs[0];
  return (
    <section className="cab">
      <SectionNav
        label={t("Разделы кабинета", "Account sections")}
        title={`${t("Кабинет специалиста", "Specialist account")} · ${roleText}`}
        items={tabs.map((x) => ({ ...x, badge: x.key === "inquiries" ? unread : 0 }))}
        active={tab}
        onChange={setTab}
      />
      <div className="cab-body">
        <h1 className="cab-title">{current.label}</h1>
        {tab === "card" && <CardPanel uid={uid} />}
        {tab === "rates" && <RatesPanel uid={uid} />}
        {tab === "inquiries" && <InquiriesPanel uid={uid} perspective="specialist" />}
        {tab === "reviews" && <ReviewsPanel uid={uid} />}
        {tab === "bases" && <SpecBasesPanel uid={uid} />}
        {tab === "limits" && <LimitsPanel uid={uid} />}
      </div>
    </section>
  );
}

/* ───────── данные ───────── */
const EMPTY = {
  first_name: "",
  last_name: "",
  avatar_url: "",
  specialization_ru: "", specialization_en: "",
  about_ru: "", about_en: "",
  regions_ru: "", regions_en: "",
  archives_ru: "", archives_en: "",
  activities_ru: "", activities_en: "",
  is_visible: false,
  accepts_clients: true,
};
type CardForm = typeof EMPTY;

function useSpecProfile(uid: string) {
  return useQuery({
    queryKey: ["spec-profile", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialist_profiles").select("*").eq("user_id", uid).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function useBases(uid: string) {
  return useQuery({
    queryKey: ["spec-bases", uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("genealogy_bases")
        .select("id, title, created_at")
        .eq("owner_id", uid)
        .order("created_at");
      if (error) throw error;
      const rows = data ?? [];
      const counts = await Promise.all(
        rows.map((b) =>
          supabase.from("persons").select("id", { count: "exact", head: true }).eq("base_id", b.id),
        ),
      );
      return rows.map((b, i) => ({ ...b, persons: counts[i]?.count ?? 0 }));
    },
  });
}

/* ───────── 01 Карточка ───────── */
function CardPanel({ uid }: { uid: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: prof } = useSpecProfile(uid);
  const [form, setForm] = useState<CardForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [legacyName, setLegacyName] = useState("");

  useEffect(() => {
    if (prof) {
      const next = { ...EMPTY };
      (Object.keys(EMPTY) as (keyof CardForm)[]).forEach((k) => {
        (next as Record<string, unknown>)[k] = (prof as Record<string, unknown>)[k];
      });
      setForm(next);
    }
  }, [prof]);
  useEffect(() => {
    supabase.from("profiles").select("display_name").eq("id", uid).maybeSingle().then(({ data }) => setLegacyName(data?.display_name ?? ""));
  }, [uid]);

  const set = <K extends keyof CardForm>(k: K, v: CardForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (patch?: Partial<CardForm>) => {
    setSaving(true);
    const row = { ...form, ...patch, user_id: uid };
    const { error } = await supabase.from("specialist_profiles").upsert(row, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("Карточка сохранена", "Card saved"));
    void qc.invalidateQueries({ queryKey: ["spec-profile", uid] });
    void qc.invalidateQueries({ queryKey: ["featured-specialists"] });
  };

  const upload = async (file: File) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { toast.error(t("Нужен PNG, JPEG или WebP", "PNG, JPEG or WebP required")); return; }
    setUploading(true);
    try {
      const blob = await squareResize(file, 256);
      const path = `specialists/${uid}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("site-assets").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      const url = supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
      set("avatar_url", url);
      await save({ avatar_url: url });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  const pair = (base: "specialization" | "about" | "regions" | "archives" | "activities", label: string, rows = 2) => (
    <div className="form-field">
      <label className="form-lbl">{label} · RU / EN</label>
      <div className="cab-grid2">
        <textarea className="form-inp" rows={rows} placeholder="RU" value={form[`${base}_ru`]} onChange={(e) => set(`${base}_ru`, e.target.value)} />
        <textarea className="form-inp" rows={rows} placeholder="EN" value={form[`${base}_en`]} onChange={(e) => set(`${base}_en`, e.target.value)} />
      </div>
    </div>
  );

  const previewData: PublicSpecialist = {
    user_id: uid,
    full_name: [form.first_name, form.last_name].filter(Boolean).join(" ") || legacyName || t("Специалист", "Specialist"),
    ...form, featured_order: 0, rates: [], reviews: [],
  };

  return (
    <div className="cab-form">
      <div className="cab-card-head">
        <span className={`cab-badge${form.is_visible ? " cab-badge--done" : ""}`}>
          {t("Карточка", "Card")}: {form.is_visible ? t("опубликована", "published") : t("скрыта", "hidden")}
        </span>
        {prof?.featured && <span className="cab-badge cab-badge--done">{t("На главной", "On home page")}</span>}
      </div>
      <div className="cab-card">
        <div className="form-lbl">{t("Аватар специалиста", "Specialist avatar")}</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="" width={96} height={96} style={{ objectFit: "cover", border: "1px solid var(--border)" }} />
          ) : (
            <div style={{ width: 96, height: 96, border: "1px dashed var(--border)" }} />
          )}
          <label className="btn btn--ghost" style={{ cursor: "pointer" }}>
            {uploading ? t("Загрузка…", "Uploading…") : t("Загрузить", "Upload")}
            <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
          </label>
          {form.avatar_url && (
            <button className="btn btn--ghost" onClick={() => { set("avatar_url", ""); void save({ avatar_url: "" }); }}>✕</button>
          )}
        </div>
        <div className="cab-meta">{t("Квадратное фото, масштабируется до 256 px", "Square photo, scaled to 256 px")}</div>
      </div>
      <div className="cab-grid2">
        <label className="form-field"><span className="form-lbl">{t("Имя", "First name")}</span><input className="form-inp" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} /></label>
        <label className="form-field"><span className="form-lbl">{t("Фамилия", "Last name")}</span><input className="form-inp" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} /></label>
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <label className="cab-check"><input type="checkbox" checked={form.is_visible} onChange={(e) => set("is_visible", e.target.checked)} />{t("Видимость карточки", "Card visible")}</label>
        <label className="cab-check"><input type="checkbox" checked={form.accepts_clients} onChange={(e) => set("accepts_clients", e.target.checked)} />{t("Принимает новых клиентов", "Accepting new clients")}</label>
      </div>
      {pair("specialization", t("Специализация", "Specialization"))}
      {pair("about", t("О себе", "About"), 4)}
      {pair("regions", t("Регионы работы", "Regions"))}
      {pair("archives", t("Архивные учреждения", "Archives"))}
      {pair("activities", t("Виды деятельности", "Activities"))}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn--primary" onClick={() => void save()} disabled={saving}>
          {saving ? t("Сохранение…", "Saving…") : t("Сохранить", "Save")}
        </button>
        <button className="btn btn--ghost" onClick={() => setPreview(true)}>{t("Предпросмотр", "Preview")}</button>
      </div>
      {preview && <SpecialistDialog s={previewData} onClose={() => setPreview(false)} />}
    </div>
  );
}

async function squareResize(file: File, size: number): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  canvas.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size);
  return await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("resize"))), "image/jpeg", 0.88));
}

/* ───────── 02 Тарифы ───────── */
type Rate = {
  id: string; kind: string; sort_order: number;
  name_ru: string; name_en: string; price_ru: string; price_en: string;
  term_ru: string; term_en: string; includes_ru: string; includes_en: string;
};

function RatesPanel({ uid }: { uid: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["spec-rates", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialist_rates").select("*").eq("user_id", uid).order("sort_order").order("created_at");
      if (error) throw error;
      return (data ?? []) as Rate[];
    },
  });
  const [rows, setRows] = useState<Rate[]>([]);
  useEffect(() => { if (data) setRows(data); }, [data]);
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["spec-rates", uid] }); void qc.invalidateQueries({ queryKey: ["featured-specialists"] }); };

  const add = async (kind: "fixed" | "open") => {
    const { error } = await supabase.from("specialist_rates").insert({ user_id: uid, kind, sort_order: rows.length, price_ru: kind === "open" ? "по договорённости" : "", price_en: kind === "open" ? "by agreement" : "" });
    if (error) toast.error(error.message); else refresh();
  };
  const saveRow = async (r: Rate) => {
    const { id, ...rest } = r;
    const { error } = await supabase.from("specialist_rates").update(rest).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(t("Тариф сохранён", "Rate saved")); refresh(); }
  };
  const del = async (id: string) => {
    if (!window.confirm(t("Удалить тариф?", "Delete rate?"))) return;
    const { error } = await supabase.from("specialist_rates").delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };
  const upd = (id: string, k: keyof Rate, v: string) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  const fixed = rows.filter((r) => r.kind === "fixed").length;
  const open = rows.filter((r) => r.kind === "open").length;

  const f = (r: Rate, k: keyof Rate, label: string) => (
    <div className="cab-inline">
      <label className="form-lbl">{label}</label>
      <input className="form-inp" value={String(r[k])} onChange={(e) => upd(r.id, k, e.target.value)} />
    </div>
  );

  return (
    <div className="cab-list">
      <p className={`cab-meta`} style={{ color: fixed < 2 || open < 1 ? "var(--primary)" : undefined }}>
        {t("Минимум: 2 фиксированных тарифа и 1 открытый («по договорённости»).", "Minimum: 2 fixed rates and 1 open (“by agreement”).")}
      </p>
      {rows.map((r) => (
        <div className="cab-card" key={r.id}>
          <div className="cab-card-head">
            <span className="cab-kicker">{r.kind === "open" ? t("открытый", "open") : t("фиксированный", "fixed")}</span>
            <button className="btn btn--ghost" onClick={() => void del(r.id)}>✕</button>
          </div>
          <div className="cab-grid2">
            {f(r, "name_ru", t("Имя RU", "Name RU"))}{f(r, "name_en", t("Имя EN", "Name EN"))}
            {f(r, "price_ru", t("Цена RU", "Price RU"))}{f(r, "price_en", t("Цена EN", "Price EN"))}
            {f(r, "term_ru", t("Срок RU", "Term RU"))}{f(r, "term_en", t("Срок EN", "Term EN"))}
            {f(r, "includes_ru", t("Что входит RU", "Includes RU"))}{f(r, "includes_en", t("Что входит EN", "Includes EN"))}
          </div>
          <div><button className="btn btn--primary" onClick={() => void saveRow(r)}>{t("Сохранить", "Save")}</button></div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn--ghost" onClick={() => void add("fixed")}>+ {t("Фиксированный", "Fixed")}</button>
        <button className="btn btn--ghost" onClick={() => void add("open")}>+ {t("По договорённости", "By agreement")}</button>
      </div>
    </div>
  );
}

/* ───────── 03 Отзывы ───────── */
function ReviewsPanel({ uid }: { uid: string }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["spec-reviews", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialist_reviews").select("*").eq("specialist_id", uid).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [replies, setReplies] = useState<Record<string, string>>({});
  const save = async (id: string) => {
    const { error } = await supabase.from("specialist_reviews").update({ reply: replies[id] ?? "" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(t("Ответ сохранён", "Reply saved")); void qc.invalidateQueries({ queryKey: ["spec-reviews", uid] }); }
  };
  if (!data?.length) return <p className="cab-meta">{t("Отзывов пока нет.", "No reviews yet.")}</p>;
  return (
    <div className="cab-list">
      {data.map((r) => (
        <div className="cab-card" key={r.id}>
          <div className="cab-card-head">
            <span className="cab-card-title">{r.client_name || t("Клиент", "Client")}</span>
            <span className="cab-kicker">{fmtDate(r.created_at, lang)}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {r.is_published && <span className="cab-badge cab-badge--done">{t("Опубликован", "Published")}</span>}
            {r.order_confirmed && <span className="cab-badge">{t("Подтверждённый заказ", "Confirmed order")}</span>}
          </div>
          <p style={{ margin: 0 }}>{r.body}</p>
          <label className="form-lbl">{t("Ответить", "Reply")}</label>
          <textarea className="form-inp" rows={2} value={replies[r.id] ?? r.reply} onChange={(e) => setReplies((m) => ({ ...m, [r.id]: e.target.value }))} />
          <div><button className="btn btn--primary" onClick={() => void save(r.id)}>{t("Сохранить", "Save")}</button></div>
        </div>
      ))}
    </div>
  );
}

/* ───────── 04 Базы ───────── */
function SpecBasesPanel({ uid }: { uid: string }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data: bases } = useBases(uid);
  const { data: prof } = useSpecProfile(uid);
  const limit = prof?.bases_limit ?? 10;
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: grants } = useQuery({
    queryKey: ["spec-client-grants", uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("base_access_grants")
        .select("id, owner_id, level, expires_at, created_at, revoked_at")
        .eq("grantee_id", uid)
        .is("revoked_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const now = Date.now();
      const active = (data ?? []).filter((g) => !g.expires_at || new Date(g.expires_at).getTime() > now);
      const owners = [...new Set(active.map((g) => g.owner_id))];
      const { data: cb } = owners.length
        ? await supabase.from("genealogy_bases").select("id, title, owner_id").in("owner_id", owners)
        : { data: [] as { id: string; title: string; owner_id: string }[] };
      return active.map((g) => ({ ...g, bases: (cb ?? []).filter((b) => b.owner_id === g.owner_id) }));
    },
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: ["spec-bases", uid] });
  const count = bases?.length ?? 0;

  const create = async () => {
    setBusy(true);
    const { error } = await supabase.from("genealogy_bases").insert({ owner_id: uid, title: title.trim() || t("Новая база", "New database") });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setTitle("");
    toast.success(t("База создана", "Database created"));
    refresh();
  };

  const remove = async (id: string, name: string) => {
    if (!window.confirm(t(`Удалить базу «${name}» вместе со всеми персонами и файлами? Это необратимо.`, `Delete “${name}” with all people and files? This cannot be undone.`))) return;
    setBusy(true);
    try {
      const { data: rows } = await supabase.from("persons").select("data").eq("base_id", id);
      setActiveOwner(uid);
      for (const r of rows ?? []) {
        const p = normalizePerson(r.data as Partial<Person>);
        for (const img of collectImageIds(p)) await imgDel(img).catch(() => {});
      }
      const { error } = await supabase.from("genealogy_bases").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("База удалена", "Database deleted"));
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cab-list">
      <h2 className="cab-sheet-h">{t("Мои базы", "My databases")} · {count} / {limit}</h2>
      {(bases ?? []).map((b) => (
        <div className="cab-card" key={b.id}>
          <div className="cab-card-head">
            <span className="cab-card-title">{b.title}</span>
            <span className="cab-kicker">{b.persons} {t("персон", "people")} · {fmtDate(b.created_at, lang)}</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link to="/app" search={{ base: b.id }} className="btn btn--primary">{t("Открыть приложение", "Open the app")}</Link>
            <button className="btn btn--ghost" disabled={busy} onClick={() => void remove(b.id, b.title)}>{t("Удалить", "Delete")}</button>
          </div>
        </div>
      ))}
      <div className="cab-card cab-card--muted">
        <label className="form-lbl">{t("Название новой базы", "New database title")}</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="form-inp" style={{ flex: 1, minWidth: 200 }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("Например: Архив семьи Ивановых", "e.g. Ivanov family archive")} />
          <button className="btn btn--primary" disabled={busy || count >= limit} onClick={() => void create()}>{t("Создать базу", "Create database")}</button>
        </div>
        {count >= limit && <div className="cab-meta">{t("Лимит баз по тарифу исчерпан.", "Database limit reached.")}</div>}
      </div>

      <h2 className="cab-sheet-h" style={{ marginTop: 16 }}>{t("Клиентские базы", "Client databases")}</h2>
      <p className="cab-meta">
        {t("Вы видите только те базы, к которым клиент выдал вам доступ. Работа — только в рамках выданных прав; передача доступа третьим лицам запрещена.",
          "You only see databases a client has shared with you. Work only within the granted rights; sharing access with third parties is prohibited.")}
      </p>
      {!grants?.length && <p className="cab-meta">{t("Доступов пока нет.", "No access yet.")}</p>}
      {(grants ?? []).map((g) => (
        <div className="cab-card" key={g.id}>
          <div className="cab-card-head">
            <span className="cab-badge cab-badge--done">{t("Активен", "Active")}</span>
            <span className="cab-kicker">
              {g.level === "edit" ? t("редактирование", "edit") : t("просмотр", "view")} · {g.expires_at ? `${t("до", "until")} ${fmtDate(g.expires_at, lang)}` : t("бессрочно", "no limit")}
            </span>
          </div>
          {(g.bases.length ? g.bases : [{ id: "", title: t("База клиента", "Client database") }]).map((b) => (
            <div key={b.id || g.id} className="cab-card-head">
              <span className="cab-card-title">{b.title}</span>
              <a href={`/app?owner=${g.owner_id}${b.id ? `&base=${b.id}` : ""}`} className="btn btn--ghost">{t("Открыть приложение", "Open the app")}</a>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ───────── 05 Лимиты ───────── */
function LimitsPanel({ uid }: { uid: string }) {
  const { t } = useI18n();
  const { data: prof } = useSpecProfile(uid);
  const { data: bases } = useBases(uid);
  const gb = ((prof?.storage_limit_mb ?? 1024) / 1024).toLocaleString();
  return (
    <div className="cab-list">
      <div className="cab-kicker">{t("Тариф", "Plan")} {(prof?.plan ?? "free").toUpperCase()}</div>
      <div className="cab-grid3">
        <div className="cab-card"><div className="cab-kicker">{t("Базы", "Databases")}</div><div className="cab-card-title">{bases?.length ?? 0} / {prof?.bases_limit ?? 10}</div></div>
        <div className="cab-card"><div className="cab-kicker">{t("Хранилище", "Storage")}</div><div className="cab-card-title">{gb} {t("ГБ", "GB")}</div></div>
        <div className="cab-card"><div className="cab-kicker">{t("Тариф", "Plan")}</div><div className="cab-card-title">{(prof?.plan ?? "free").toUpperCase()}</div></div>
      </div>
      <p className="cab-meta">{t("Лимиты меняет администрация издательства; кабинет показывает текущий статус.", "Limits are set by the publisher; the account shows the current status.")}</p>
    </div>
  );
}
