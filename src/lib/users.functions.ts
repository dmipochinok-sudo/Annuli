import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, avatar_url, is_blocked, created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");
    if (rolesError) throw rolesError;
    return (profiles ?? []).map((p) => ({
      ...p,
      role: roles?.find((r) => r.user_id === p.id)?.role ?? "user",
      isSelf: p.id === userId,
    }));
  });

export const setUserBlocked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; blocked: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");
    if (data.userId === userId) throw new Error("Нельзя заблокировать собственную учётную запись");
    const { error } = await supabase
      .from("profiles")
      .update({ is_blocked: data.blocked, updated_at: new Date().toISOString() })
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });
