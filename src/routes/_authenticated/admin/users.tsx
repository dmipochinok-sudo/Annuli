import { createFileRoute, redirect } from "@tanstack/react-router";

// Управление пользователями переехало в единую CMS (/admin/cms, вкладка «Пользователи»).
export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/cms" });
  },
});
