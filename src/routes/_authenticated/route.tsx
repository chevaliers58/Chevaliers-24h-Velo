import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

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
  component: AuthenticatedOutlet,
});

function AuthenticatedOutlet() {
  const { user } = useAuth();
  const { user: routeUser } = Route.useRouteContext();
  // The async route guard may still refer to the previous session. Hide the
  // private subtree until it agrees with the current identity and remount it
  // on identity changes, including local form state and in-flight responses.
  if (!user || user.id !== routeUser.id) return null;
  return <Outlet key={user.id} />;
}
