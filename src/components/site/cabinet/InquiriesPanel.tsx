import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { sendInquiryMessage } from "@/lib/inquiries.functions";
import { fmtDate } from "@/lib/cabinet";
import { useI18n } from "@/lib/i18n";

export type Inquiry = {
  id: string;
  client_id: string;
  specialist_id: string;
  client_name: string;
  specialist_name: string;
  subject: string;
  rate_name: string;
  body: string;
  status: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
};

const STATUS: Record<string, [string, string]> = {
  new: ["Новая", "New"],
  in_progress: ["В работе", "In progress"],
  closed: ["Закрыта", "Closed"],
};

export function useInquiries(uid: string) {
  return useQuery({
    queryKey: ["specialist-inquiries", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_my_specialist_inquiries");
      if (error) throw error;
      return (data ?? []) as Inquiry[];
    },
  });
}

export function InquiriesPanel({ uid, perspective }: { uid: string; perspective: "client" | "specialist" }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data } = useInquiries(uid);
  const items = useMemo(
    () => (data ?? []).filter((i) => (perspective === "client" ? i.client_id === uid : i.specialist_id === uid)),
    [data, perspective, uid],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((i) => i.id === selectedId) ?? items[0] ?? null;

  useEffect(() => {
    const channel = supabase
      .channel(`inquiries-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "specialist_inquiries" }, () => {
        void qc.invalidateQueries({ queryKey: ["specialist-inquiries", uid] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "inquiry_messages" }, () => {
        void qc.invalidateQueries({ queryKey: ["inquiry-messages"] });
        void qc.invalidateQueries({ queryKey: ["specialist-inquiries", uid] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [qc, uid]);

  if (!items.length) {
    return <p className="cab-meta">{t("Заявок пока нет.", "No inquiries yet.")}</p>;
  }

  return (
    <div className="inq-layout">
      <div className="inq-list" aria-label={t("Список заявок", "Inquiry list")}>
        {items.map((item) => (
          <button key={item.id} className={`inq-item${selected?.id === item.id ? " is-active" : ""}`} onClick={() => setSelectedId(item.id)}>
            <span className="inq-item-head"><strong>{perspective === "client" ? item.specialist_name : item.client_name}</strong>{item.unread_count > 0 && <span className="cab-dot">{item.unread_count}</span>}</span>
            <span>{item.subject}</span>
            <small>{fmtDate(item.updated_at, lang)} · {(STATUS[item.status] ?? [item.status, item.status])[lang === "en" ? 1 : 0]}</small>
          </button>
        ))}
      </div>
      {selected && <InquiryConversation key={selected.id} inquiry={selected} uid={uid} perspective={perspective} />}
    </div>
  );
}

function InquiryConversation({ inquiry, uid, perspective }: { inquiry: Inquiry; uid: string; perspective: "client" | "specialist" }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const sendMessage = useServerFn(sendInquiryMessage);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { data: messages } = useQuery({
    queryKey: ["inquiry-messages", inquiry.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("inquiry_messages").select("*").eq("inquiry_id", inquiry.id).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    void supabase.from("inquiry_messages").update({ is_read: true }).eq("inquiry_id", inquiry.id).neq("sender_id", uid).eq("is_read", false).then(() => {
      void qc.invalidateQueries({ queryKey: ["specialist-inquiries", uid] });
    });
    inputRef.current?.focus();
  }, [inquiry.id, qc, uid]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await sendMessage({ data: { inquiryId: inquiry.id, body } });
      setText("");
      await qc.invalidateQueries({ queryKey: ["inquiry-messages", inquiry.id] });
      inputRef.current?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Не удалось отправить сообщение", "Could not send message"));
    } finally {
      setSending(false);
    }
  };

  const setStatus = async (status: string) => {
    const { error } = await supabase.from("specialist_inquiries").update({ status }).eq("id", inquiry.id);
    if (error) toast.error(error.message);
    else void qc.invalidateQueries({ queryKey: ["specialist-inquiries", uid] });
  };

  const otherName = perspective === "client" ? inquiry.specialist_name : inquiry.client_name;
  return (
    <section className="inq-chat" aria-label={t("Диалог по заявке", "Inquiry conversation")}>
      <header className="inq-chat-head">
        <div><div className="cab-kicker">{otherName}</div><h2>{inquiry.subject}</h2></div>
        {perspective === "specialist" ? (
          <select className="form-inp inq-status" value={inquiry.status} onChange={(e) => void setStatus(e.target.value)} aria-label={t("Статус заявки", "Inquiry status")}>
            <option value="new">{t("Новая", "New")}</option><option value="in_progress">{t("В работе", "In progress")}</option><option value="closed">{t("Закрыта", "Closed")}</option>
          </select>
        ) : <span className="cab-badge">{(STATUS[inquiry.status] ?? [inquiry.status, inquiry.status])[lang === "en" ? 1 : 0]}</span>}
      </header>
      <div className="inq-brief"><strong>{inquiry.rate_name || t("Без выбранного тарифа", "No selected rate")}</strong><p>{inquiry.body}</p></div>
      <div className="inq-messages" aria-live="polite">
        {!messages?.length && <p className="cab-meta">{t("Диалог ещё не начат.", "The conversation has not started yet.")}</p>}
        {messages?.map((message) => (
          <article key={message.id} className={`inq-message${message.sender_id === uid ? " is-mine" : ""}`}>
            <p>{message.body}</p><time>{new Date(message.created_at).toLocaleString(lang === "en" ? "en-GB" : "ru-RU")}</time>
          </article>
        ))}
      </div>
      <div className="inq-composer">
        <textarea ref={inputRef} className="form-inp" rows={3} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Сообщение…", "Message…")} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} />
        <button className="btn btn--primary inq-send" onClick={() => void send()} disabled={sending || !text.trim()} aria-label={t("Отправить", "Send")} title={t("Отправить", "Send")}><Send size={17} /></button>
      </div>
    </section>
  );
}