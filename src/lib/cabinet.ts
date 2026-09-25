import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Shared data hooks for the client cabinet (used by /account and the CMS user card). */

export const ORDER_STATUSES = [
  "new",
  "consultation",
  "brief",
  "prepaid",
  "materials",
  "layout",
  "print",
  "done",
] as const;

export const ORDER_STATUS_LABEL: Record<string, [string, string]> = {
  new: ["новая заявка", "new request"],
  draft: ["новая заявка", "new request"],
  consultation: ["консультация", "consultation"],
  brief: ["бриф", "brief"],
  prepaid: ["предоплата получена", "prepayment received"],
  materials: ["материалы получены", "materials received"],
  layout: ["вёрстка", "layout"],
  print: ["печать", "printing"],
  done: ["завершено", "completed"],
};

export const statusText = (s: string, lang: string) =>
  (ORDER_STATUS_LABEL[s] ?? [s, s])[lang === "en" ? 1 : 0];

export const fmtDate = (d: string | null | undefined, lang: string) =>
  d
    ? new Date(d).toLocaleDateString(lang === "en" ? "en-GB" : "ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

export const fmtMoney = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

export function useCabinetProfile(uid: string | null) {
  return useQuery({
    queryKey: ["cab-profile", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email, phone, city, note")
        .eq("id", uid!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useOrders(uid: string | null) {
  return useQuery({
    queryKey: ["cab-orders", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_projects")
        .select("id, order_no, title, plan, status, amount, paid_amount, due_date, notes, created_at")
        .eq("owner_id", uid!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (data ?? []).map((o) => o.id);
      const { data: stages } = ids.length
        ? await supabase
            .from("project_stages")
            .select("id, project_id, title, status, position, completed_at, created_at")
            .in("project_id", ids)
            .order("position", { ascending: true })
        : { data: [] };
      return (data ?? []).map((o) => ({
        ...o,
        stages: (stages ?? []).filter((s) => s.project_id === o.id),
      }));
    },
  });
}
export type Order = NonNullable<ReturnType<typeof useOrders>["data"]>[number];

export function useBaseStats(uid: string | null) {
  return useQuery({
    queryKey: ["cab-base", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { count } = await supabase
        .from("persons")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", uid!);
      return { persons: count ?? 0 };
    },
  });
}

export function useGrants(uid: string | null) {
  return useQuery({
    queryKey: ["cab-grants", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("base_access_grants")
        .select("id, grantee_id, level, expires_at, consent_at, revoked_at, created_at")
        .eq("owner_id", uid!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSpecialists() {
  return useQuery({
    queryKey: ["cab-specialists"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_specialists");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNotifications(uid: string | null) {
  return useQuery({
    queryKey: ["cab-notifications", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, kind, body, read_at, created_at")
        .eq("user_id", uid!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}
