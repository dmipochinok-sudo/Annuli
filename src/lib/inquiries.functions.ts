import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createInquirySchema = z.object({
  specialistId: z.string().uuid(),
  subject: z.string().trim().min(1).max(160),
  rateName: z.string().trim().max(200).default(""),
  body: z.string().trim().min(1).max(5000),
});

export const createSpecialistInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createInquirySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: role, error: roleError } = await context.supabase.rpc("current_app_role");
    if (roleError) throw new Error(roleError.message);
    if (role !== "client") throw new Error("Заявку специалисту может отправить только клиент");

    // Клиенту закрыто чтение чужих профилей специалистов (RLS), поэтому
    // проверку и создание выполняем серверным клиентом после проверки роли.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: specialist, error: specialistError } = await supabaseAdmin
      .from("specialist_profiles")
      .select("user_id")
      .eq("user_id", data.specialistId)
      .eq("is_visible", true)
      .eq("accepts_clients", true)
      .maybeSingle();
    if (specialistError) throw new Error(specialistError.message);
    if (!specialist) throw new Error("Специалист сейчас не принимает заявки");

    const { data: inquiry, error } = await supabaseAdmin
      .from("specialist_inquiries")
      .insert({
        client_id: context.userId,
        specialist_id: data.specialistId,
        subject: data.subject,
        rate_name: data.rateName,
        body: data.body,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return inquiry;
  });

const messageSchema = z.object({
  inquiryId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
});

export const sendInquiryMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => messageSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: inquiry, error: inquiryError } = await context.supabase
      .from("specialist_inquiries")
      .select("id, client_id, specialist_id")
      .eq("id", data.inquiryId)
      .maybeSingle();
    if (inquiryError) throw new Error(inquiryError.message);
    if (!inquiry || (inquiry.client_id !== context.userId && inquiry.specialist_id !== context.userId)) {
      throw new Error("Нет доступа к этому диалогу");
    }

    const { data: message, error } = await context.supabase
      .from("inquiry_messages")
      .insert({ inquiry_id: data.inquiryId, sender_id: context.userId, body: data.body })
      .select("id, inquiry_id, sender_id, body, is_read, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return message;
  });