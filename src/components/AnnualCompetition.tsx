import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Lock, Trophy, Zap } from "lucide-react";
import { supabase as client } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { formatKm } from "@/lib/appData";

const db = client as unknown as SupabaseClient;
const formatPoints = (value: number) =>
  Number(value).toLocaleString("fr-BE", { maximumFractionDigits: 2 });
const panel = "space-y-3 rounded-2xl border bg-card p-4";
const field = "w-full rounded-lg border bg-background px-3 py-2 text-sm";

type PointsRow = { patrol_id: string; patrol_name: string; points: number; km: number };
type PrivateRow = { user_id: string; display_name: string; km: number };
type Challenge = {
  id: string;
  title: string;
  description: string;
  starts_on: string;
  ends_on: string;
  multiplier: number;
  enabled: boolean;
};

export function AnnualPatrolPoints() {
  const q = useQuery<PointsRow[]>({
    queryKey: ["annual-patrol-points"],
    queryFn: async () => {
      const { data, error } = await db.rpc("annual_patrol_points");
      if (error) throw error;
      return (data ?? []) as PointsRow[];
    },
    retry: false,
  });
  return (
    <section className={panel}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Trophy className="h-5 w-5 text-amber-500" /> Patrouilles — points de l’année
      </h2>
      <p className="text-sm text-muted-foreground">
        1re/2e : 2 pts/km · 3e/4e : 1 pt/km. Bonus de groupe et de défi. Staff hors points.
      </p>
      {q.isPending ? (
        <p className="text-sm">Chargement…</p>
      ) : q.isError ? (
        <p className="text-sm text-muted-foreground">
          Le calcul annuel n’est pas encore activé sur cette base de prévisualisation.
        </p>
      ) : (
        <ol className="divide-y">
          {q.data.map((r, i) => (
            <li key={r.patrol_id} className="flex items-center gap-3 py-2">
              <span className="text-muted-foreground">{i + 1}.</span>
              <span className="flex-1 font-semibold">{r.patrol_name}</span>
              <strong className="tabular-nums">{formatPoints(r.points)} pts</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function MyPatrolRanking() {
  const { user, isAdmin } = useAuth();
  const q = useQuery<PrivateRow[]>({
    queryKey: ["private-patrol-ranking", user?.id, isAdmin],
    enabled: !!user,
    gcTime: 0,
    retry: false,
    queryFn: async () => {
      const { data, error } = await db.rpc("annual_my_patrol_ranking");
      if (error) throw error;
      return (data ?? []) as PrivateRow[];
    },
  });
  if (!user) return null;
  return (
    <section className={panel}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Lock className="h-5 w-5 text-primary" />
        {isAdmin ? "Classement privé du staff" : "Classement privé de ma patrouille"}
      </h2>
      <p className="text-sm text-muted-foreground">Distance validée, visible dans ton groupe.</p>
      {q.isPending ? (
        <p className="text-sm">Chargement…</p>
      ) : q.isError ? (
        <p className="text-sm text-muted-foreground">
          Ce classement sera disponible après activation du nouveau schéma.
        </p>
      ) : q.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ton affectation doit être confirmée par le staff.
        </p>
      ) : (
        <ol className="divide-y">
          {q.data.map((r, i) => (
            <li key={r.user_id} className="flex items-center gap-3 py-2">
              <span className="text-muted-foreground">{i + 1}.</span>
              <span className="flex-1 font-semibold">
                {r.display_name}
                {r.user_id === user.id ? " (toi)" : ""}
              </span>
              <strong>{formatKm(r.km)} km</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function AnnualChallenges({ manage = false }: { manage?: boolean }) {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const editable = manage && isAdmin;
  const q = useQuery<Challenge[]>({
    queryKey: ["annual-challenges", user?.id ?? null, editable],
    gcTime: 0,
    retry: false,
    queryFn: async () => {
      const { data, error } = await db
        .from("annual_double_points_challenges")
        .select("id,title,description,starts_on,ends_on,multiplier,enabled")
        .order("starts_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Challenge[];
    },
  });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [mult, setMult] = useState("2");
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    if (!editable || busy || q.isError) return;
    const multiplier = Number(mult);
    if (
      title.trim().length < 3 ||
      !start ||
      !end ||
      end < start ||
      multiplier < 1 ||
      multiplier > 10 ||
      !Number.isFinite(multiplier)
    ) {
      setMessage("Vérifie le titre, les dates et le multiplicateur (1 à 10).");
      return;
    }
    setBusy(true);
    try {
      const row = { title: title.trim(), description, starts_on: start, ends_on: end, multiplier };
      const table = db.from("annual_double_points_challenges");
      const res = editing ? await table.update(row).eq("id", editing) : await table.insert(row);
      if (res.error) throw res.error;
      setTitle("");
      setDescription("");
      setStart("");
      setEnd("");
      setMult("2");
      setEditing(null);
      setMessage("Défi enregistré.");
      await qc.invalidateQueries({ queryKey: ["annual-challenges"] });
      await qc.invalidateQueries({ queryKey: ["annual-patrol-points"] });
    } catch {
      setMessage("Impossible d’enregistrer le défi. Vérifie les droits et la connexion.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={panel}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Zap className="h-5 w-5 text-amber-500" /> Défis à multiplicateur
      </h2>
      <p className="text-sm text-muted-foreground">
        Les sorties validées pendant un défi gagnent le bonus choisi. Si deux défis se chevauchent,
        le plus grand multiplicateur s’applique. Le bonus de groupe peut s’y ajouter.
      </p>
      {q.isError && (
        <p className="text-sm text-muted-foreground">
          Fonctions en attente d’activation sur la base de prévisualisation.
        </p>
      )}
      {editable && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <label className="block text-sm font-semibold">
            Titre du défi
            <input
              className={field}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={120}
            />
          </label>
          <label className="block text-sm font-semibold">
            Description
            <textarea
              className={field}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Début
              <input
                className={field}
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </label>
            <label className="text-sm font-semibold">
              Fin
              <input
                className={field}
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Multiplicateur des points (×)
            <input
              className={field}
              type="number"
              min="1"
              max="10"
              step="0.01"
              value={mult}
              onChange={(e) => setMult(e.target.value)}
              required
            />
          </label>
          <button
            disabled={busy || q.isError || q.isPending}
            className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50"
          >
            {editing ? "Modifier le défi" : "Créer le défi"}
          </button>
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
        </form>
      )}
      {q.data?.map((c) => (
        <div key={c.id} className="rounded-xl border p-3">
          <div className="flex items-center justify-between gap-2">
            <strong>{c.title}</strong>
            <span className="font-bold text-primary">×{formatPoints(c.multiplier)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {c.starts_on} → {c.ends_on}
          </p>
          {c.description && <p className="mt-1 text-sm">{c.description}</p>}
          {editable && (
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-primary"
              onClick={() => {
                setEditing(c.id);
                setTitle(c.title);
                setDescription(c.description);
                setStart(c.starts_on);
                setEnd(c.ends_on);
                setMult(String(c.multiplier));
              }}
            >
              Modifier
            </button>
          )}
        </div>
      ))}
      {!q.isError && q.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun défi temporaire pour l’instant.</p>
      )}
    </section>
  );
}
