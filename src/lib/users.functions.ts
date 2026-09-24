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
    const { data: productRoles } = await supabase
      .from("user_product_roles")
      .select("user_id, product_role");
    const { data: isOwner } = await supabase.rpc("is_owner");
    let ownerIds: string[] = [];
    if (isOwner) {
      const { data: full } = await supabase.rpc("owner_list_users");
      ownerIds = (full ?? []).filter((r) => r.is_owner).map((r) => r.id);
    }
    return {
      viewerIsOwner: !!isOwner,
      users: (profiles ?? []).map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.id)?.role ?? "user",
        productRole:
          (productRoles?.find((r) => r.user_id === p.id)?.product_role as
            | "client"
            | "specialist") ?? "client",
        isOwner: ownerIds.includes(p.id),
        isSelf: p.id === userId,
      })),
    };
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

/** Владелец меняет продуктовую роль пользователя (проверка владельца — в функции базы). */
export const setProductRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "client" | "specialist" }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("set_user_product_role", {
      target_user: data.userId,
      new_role: data.role,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Владелец назначает или снимает администратора. */
export const setUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; makeAdmin: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("set_user_admin", {
      target_user: data.userId,
      make_admin: data.makeAdmin,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Владелец назначает или снимает владельца (с защитами внутри функции базы). */
export const setUserOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; makeOwner: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("set_user_owner", {
      target_user: data.userId,
      make_owner: data.makeOwner,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Владелец создаёт учётную запись вручную. */
export const createUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      email: string;
      password: string;
      displayName: string;
      role: "client" | "specialist";
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { data: isOwner } = await context.supabase.rpc("is_owner");
    if (!isOwner) throw new Error("Только владелец может создавать учётные записи");
    if (!data.email.includes("@")) throw new Error("Некорректный адрес почты");
    if (data.password.length < 8) throw new Error("Пароль должен быть не короче 8 символов");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.displayName },
    });
    if (error) throw new Error(error.message);
    const newId = created.user?.id;
    if (!newId) throw new Error("Не удалось создать учётную запись");

    await context.supabase.rpc("set_user_product_role", {
      target_user: newId,
      new_role: data.role,
    });
    return { ok: true, id: newId };
  });

/** Владелец удаляет учётную запись (кроме себя и других владельцев). */
export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isOwner } = await supabase.rpc("is_owner");
    if (!isOwner) throw new Error("Только владелец может удалять учётные записи");
    if (data.userId === userId) throw new Error("Нельзя удалить собственную учётную запись");

    const { data: rows } = await supabase.rpc("owner_list_users");
    const target = (rows ?? []).find((r) => r.id === data.userId);
    if (!target) throw new Error("Пользователь не найден");
    if (target.is_owner) throw new Error("Нельзя удалить учётную запись владельца");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
