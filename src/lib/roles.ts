import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "admin" | "specialist" | "client";
export type ProductRole = "client" | "specialist";

const LABELS: Record<AppRole, { ru: string; en: string }> = {
  owner: { ru: "Владелец", en: "Owner" },
  admin: { ru: "Администратор", en: "Admin" },
  specialist: { ru: "Специалист", en: "Specialist" },
  client: { ru: "Клиент", en: "Client" },
};

export function roleLabel(role: AppRole | null | undefined, lang: "ru" | "en" = "ru") {
  if (!role) return "";
  return LABELS[role][lang];
}

/** Итоговая роль текущего пользователя: owner → admin → specialist → client. */
export function useAppRole(userId?: string | null) {
  return useQuery<AppRole>({
    queryKey: ["current-app-role", userId ?? "self"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("current_app_role");
      if (error) throw error;
      return (data as AppRole) ?? "client";
    },
  });
}

/** Продуктовая роль пользователя (клиент/специалист), null — ещё не выбрана. */
export function useProductRole(userId: string | null | undefined) {
  return useQuery<ProductRole | null>({
    queryKey: ["product-role", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_product_roles")
        .select("product_role")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.product_role as ProductRole) ?? null;
    },
  });
}

/** Первичный выбор роли — сохраняется один раз и позже не меняется пользователем. */
export async function registerProductRole(role: ProductRole) {
  const { error } = await supabase.rpc("register_product_role", { requested_role: role });
  if (error) throw error;
}
