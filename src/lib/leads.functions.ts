import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

const leadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  plan: z.string().max(100).default(""),
  message: z.string().max(5000).default(""),
});

/** Приём заявки с лэндинга (публично, без авторизации). */
export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_PUBLISHABLE_KEY']!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase.from("leads").insert({
      name: data.name,
      email: data.email,
      plan: data.plan,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
