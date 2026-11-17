import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Supabase Auth is the only trusted source of authenticated sessions.
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session?.user) {
        return { user: data.session.user };
      }
    } catch (error) {
      console.error("[AuthGuard] Impossible de vérifier la session Supabase :", error);
    }

    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
