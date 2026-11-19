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
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const { user: routeUser } = Route.useRouteContext();
  // The async route guard may still refer to the previous session. Hide the
  // private subtree until it agrees with the current identity and remount it
  // on identity changes, including local form state and in-flight responses.
  if (!user || user.id !== routeUser.id) return null;
  if (loading) return null;
  if (!profile?.member_approved) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Inscription en attente de validation</h1>
        <p>
          Le staff doit confirmer ton inscription avant que tu puisses accéder aux espaces membres.
        </p>
        <button
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => void refreshProfile()}
        >
          Vérifier mon statut
        </button>
        <button className="block mx-auto underline" onClick={() => void signOut()}>
          Se déconnecter
        </button>
      </main>
    );
  }
  return <Outlet key={user.id} />;
}
