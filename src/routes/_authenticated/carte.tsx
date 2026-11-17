import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/useAuth";
import { AdminActivitiesManager } from "@/components/AdminActivitiesManager";

export const Route = createFileRoute("/_authenticated/carte")({
  ssr: false,
  component: StaffRoutes,
});

function StaffRoutes() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Parcours GPS privés</h1>
      {!isAdmin ? (
        <p>Accès réservé au staff pour la validation des sorties.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Les traces ne sont plus affichées sur une carte partagée. Le staff peut télécharger les
            GPX des sorties pour les vérifier.
          </p>
          <AdminActivitiesManager />
        </>
      )}
      <Link to="/" className="font-semibold text-primary">
        Retour aux classements
      </Link>
    </main>
  );
}
