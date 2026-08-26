import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

interface MenuProfile {
  display_name: string;
  email: string;
  avatar_url: string;
}

/** Меню пользователя в шапке: профиль, админка (для роли admin), выход. */
export function UserMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const { data: profile } = useQuery<MenuProfile | null>({
    queryKey: ["menu-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, email, avatar_url")
        .eq("id", userId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: isAdmin } = useQuery<boolean>({
    queryKey: ["menu-is-admin", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: userId!, _role: "admin" });
      return !!data;
    },
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const label = profile?.display_name || profile?.email || "Аккаунт";
  const initial = (profile?.display_name || profile?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Меню пользователя"
        className="grid size-8 place-items-center overflow-hidden rounded-full border border-border bg-surface-light text-[13px] font-semibold text-foreground transition hover:border-stroke-bright"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={label} className="size-full object-cover" />
        ) : (
          initial
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-border bg-surface-light p-1.5 shadow-xl">
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-[13px] font-medium text-foreground">{label}</p>
            {profile?.email && (
              <p className="truncate text-[12px] text-muted-foreground">{profile.email}</p>
            )}
          </div>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-[13px] text-foreground transition hover:bg-surface-dark"
          >
            Профиль
          </Link>
          {isAdmin && (
            <Link
              to="/admin/users"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-[13px] text-foreground transition hover:bg-surface-dark"
            >
              Управление пользователями
            </Link>
          )}
          <button
            onClick={() => void signOut()}
            className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-foreground transition hover:bg-surface-dark"
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
