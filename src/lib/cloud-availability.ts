/**
 * Публичные страницы должны оставаться доступными, даже если переменные
 * Lovable Cloud временно не попали в клиентскую сборку.
 */
export function isCloudConfigured(): boolean {
  return Boolean(
    import.meta.env["VITE_SUPABASE_URL"] &&
      import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
  );
}