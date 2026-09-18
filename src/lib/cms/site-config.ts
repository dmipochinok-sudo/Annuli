import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { isCloudConfigured } from "@/lib/cloud-availability";

/** Ключи секций лендинга, которыми управляет CMS. */
export const SECTION_KEYS = [
  "approach",
  "process",
  "plans",
  "addons",
  "quote",
  "contact",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_TITLES: Record<SectionKey, { ru: string; en: string }> = {
  approach: { ru: "Подход", en: "Approach" },
  process: { ru: "Процесс", en: "Process" },
  plans: { ru: "Тарифы", en: "Plans" },
  addons: { ru: "Дополнения", en: "Add-ons" },
  quote: { ru: "Цитата", en: "Pull quote" },
  contact: { ru: "Контакты / форма", en: "Contact / form" },
};

export interface SectionRow {
  key: string;
  visible: boolean;
  sort_order: number;
}

export interface AssetRow {
  key: string;
  url: string;
  alt_ru: string;
  alt_en: string;
}

export interface AddonRow {
  id: string;
  sort_order: number;
  code: string;
  name_ru: string;
  name_en: string;
  desc_ru: string;
  desc_en: string;
  price_ru: string;
  price_en: string;
  note_ru: string;
  note_en: string;
  is_visible: boolean;
}

/**
 * Видимость секций лендинга. Отсутствие записи или ошибка запроса —
 * безопасный fallback: секция считается видимой.
 */
export function useSectionVisibility() {
  const query = useQuery<Record<string, boolean>>({
    queryKey: ["site-sections"],
    enabled: isCloudConfigured(),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_sections").select("key, visible");
      if (error) throw error;
      const map: Record<string, boolean> = {};
      for (const row of (data ?? []) as unknown as SectionRow[]) {
        if (row?.key) map[row.key] = row.visible !== false;
      }
      return map;
    },
  });

  const map = query.data ?? {};
  const isVisible = (key: string): boolean => map[key] !== false;
  return { isVisible, map, isLoading: query.isLoading };
}

/** Изображения сайта по ключу (hero_image, logo_image). */
export function useSiteAssets() {
  const query = useQuery<Record<string, AssetRow>>({
    queryKey: ["site-assets"],
    enabled: isCloudConfigured(),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_assets")
        .select("key, url, alt_ru, alt_en");
      if (error) throw error;
      const map: Record<string, AssetRow> = {};
      for (const row of (data ?? []) as unknown as AssetRow[]) {
        if (row?.key) map[row.key] = row;
      }
      return map;
    },
  });

  const map = query.data ?? {};
  return { assets: map, asset: (key: string) => map[key], isLoading: query.isLoading };
}

/** Дополнительные услуги из облака (пусто — используется статический fallback). */
export function useSiteAddons() {
  return useQuery<AddonRow[]>({
    queryKey: ["site-addons"],
    enabled: isCloudConfigured(),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_addons")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as AddonRow[];
    },
  });
}
