import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Lock, Trophy, Zap } from "lucide-react";
import { supabase as client } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { formatKm } from "@/lib/appData";
import { isOtherUnitPatrol } from "@/lib/categories";

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
        1re/2e : 2 pts/km · 3e/4e : 1 pt/km. Bonus de groupe et de défi. Staff et autres membres de
        l’unité hors points.
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
        {isAdmin
          ? "Classement privé du staff et des autres membres"
          : "Classement privé de ma patrouille"}
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

type AnnualSettings = {
  starts_on: string | null;
  ends_on: string;
  enabled: boolean;
};
type RosterMember = {
  id: string;
  full_name: string | null;
  totem: string | null;
  scout_year: number | null;
  patrol_id: string | null;
  is_admin: boolean;
};
type RosterPatrol = { id: string; name: string; category: string };
type RosterEntry = {
  user_id: string;
  patrol_id: string;
  group_kind: "scout" | "staff" | "other";
  scout_year: number | null;
  valid_from: string;
};

export function MyAnnualPoints() {
  const { user, isAdmin } = useAuth();
  const q = useQuery<{ points: number; km: number }[]>({
    queryKey: ["my-annual-points", user?.id],
    enabled: !!user && !isAdmin,
    gcTime: 0,
    retry: false,
    queryFn: async () => {
      const { data, error } = await db.rpc("annual_my_points");
      if (error) throw error;
      return data ?? [];
    },
  });
  if (!user || isAdmin) return null;
  return (
    <div className={panel}>
      <h2 className="font-display font-bold">Mes points pour la patrouille</h2>
      {q.isError ? (
        <p className="text-sm text-muted-foreground">Barème en attente d’activation.</p>
      ) : (
        <p className="text-2xl font-bold tabular-nums">
          {q.isPending ? "…" : formatPoints(q.data?.[0]?.points ?? 0)} pts
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Année confirmée par le staff, sorties validées et bonus applicables.
      </p>
    </div>
  );
}

export function AnnualSeasonAdmin() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const q = useQuery<{
    settings: AnnualSettings;
    members: RosterMember[];
    patrols: RosterPatrol[];
    entries: RosterEntry[];
  }>({
    queryKey: ["annual-season-admin", user?.id],
    enabled: !!user && isAdmin,
    gcTime: 0,
    retry: false,
    queryFn: async () => {
      const [s, m, p, r] = await Promise.all([
        db.from("annual_points_settings").select("starts_on,ends_on,enabled").single(),
        db.from("profiles").select("id,full_name,totem,scout_year,patrol_id,is_admin"),
        db.from("patrols").select("id,name,category").order("name"),
        db.from("annual_points_roster").select("*").order("valid_from", { ascending: false }),
      ]);
      for (const res of [s, m, p, r]) {
        if (res.error) throw res.error;
      }
      return {
        settings: s.data as AnnualSettings,
        members: (m.data ?? []) as RosterMember[],
        patrols: (p.data ?? []) as RosterPatrol[],
        entries: (r.data ?? []) as RosterEntry[],
      };
    },
  });
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [member, setMember] = useState("");
  const [patrol, setPatrol] = useState("");
  const [year, setYear] = useState("1");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isAdmin) return null;
  const data = q.data;
  if (!data) {
    return (
      <section className={panel}>
        <h2 className="font-display font-bold">Saison et affectations confirmées</h2>
        <p className="text-sm text-muted-foreground">
          {q.isError ? "En attente de l'installation des nouvelles fonctions." : "Chargement…"}
        </p>
      </section>
    );
  }
  const selected = data.members.find((m) => m.id === member);
  const chosenPatrol = data.patrols.find((p) => p.id === patrol);
  const seasonStart = start || data.settings.starts_on || "";
  const seasonEnd = end || data.settings.ends_on;
  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["annual-season-admin"] });
    await qc.invalidateQueries({ queryKey: ["challenge-season"] });
    await qc.invalidateQueries({ queryKey: ["annual-patrol-points"] });
    await qc.invalidateQueries({ queryKey: ["private-patrol-ranking"] });
    await qc.invalidateQueries({ queryKey: ["my-annual-points"] });
  }
  async function saveSeason() {
    if (!seasonStart || seasonStart > seasonEnd || !data || busy) return;
    if (
      !window.confirm(
        "Enregistrer ces dates et ouvrir les enregistrements ainsi que le décompte des points ?",
      )
    )
      return;
    setBusy(true);
    try {
      const { error } = await db
        .from("annual_points_settings")
        .update({ starts_on: seasonStart, ends_on: seasonEnd, enabled: true })
        .eq("singleton", true);
      if (error) throw error;
      setMessage("Saison enregistrée.");
      await refresh();
    } catch {
      setMessage("Échec : la période doit inclure toutes les sorties déjà enregistrées.");
    } finally {
      setBusy(false);
    }
  }
  async function confirmMember() {
    if (!selected || !chosenPatrol || busy || !(from || seasonStart)) return;
    if (selected.is_admin && chosenPatrol.category !== "staff") {
      setMessage("Sélectionne la patrouille Staff pour un chef.");
      return;
    }
    const other = isOtherUnitPatrol(chosenPatrol);
    const kind =
      selected.is_admin || chosenPatrol.category === "staff"
        ? "staff"
        : other || year === "other"
          ? "other"
          : "scout";
    if (!window.confirm("Confirmer l’affectation et le barème à partir de cette date ?")) return;
    setBusy(true);
    try {
      const { error } = await db.from("annual_points_roster").upsert(
        {
          user_id: selected.id,
          patrol_id: chosenPatrol.id,
          group_kind: kind,
          scout_year: kind === "scout" ? Number(year) : null,
          valid_from: from || seasonStart,
        },
        { onConflict: "user_id,valid_from" },
      );
      if (error) throw error;
      setMessage("Affectation confirmée.");
      await refresh();
    } catch {
      setMessage("Impossible de confirmer l’affectation.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={panel}>
      <h2 className="font-display text-lg font-bold">Saison et affectations confirmées</h2>
      <p className="text-sm text-muted-foreground">
        {data.settings.enabled ? "Saison active" : "Décompte non activé"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Date de début
          <input
            className={field}
            type="date"
            value={seasonStart}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="text-sm font-semibold">
          Date de fin
          <input
            className={field}
            type="date"
            value={seasonEnd}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <button
        type="button"
        disabled={busy || !seasonStart}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        onClick={saveSeason}
      >
        Enregistrer et activer la saison
      </button>
      <hr />
      <h3 className="font-semibold">Confirmer une affectation</h3>
      <p className="text-sm text-muted-foreground">
        Les choix faits à l’inscription ne donnent pas de droits staff ni de points avant
        confirmation.
      </p>
      <label className="block text-sm font-semibold">
        Membre
        <select
          className={field}
          value={member}
          onChange={(e) => {
            const id = e.target.value;
            const m = data.members.find((item) => item.id === id);
            setMember(id);
            setPatrol(m?.patrol_id ?? "");
            setYear(m?.scout_year ? String(m.scout_year) : "other");
          }}
        >
          <option value="">Choisir un membre</option>
          {data.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.totem || m.full_name || "Membre"}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Patrouille
        <select className={field} value={patrol} onChange={(e) => setPatrol(e.target.value)}>
          <option value="">Choisir une patrouille</option>
          {data.patrols.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {!selected?.is_admin && (
        <label className="block text-sm font-semibold">
          Année scoute
          <select className={field} value={year} onChange={(e) => setYear(e.target.value)}>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="other">Autre membre de l’unité (hors points)</option>
          </select>
        </label>
      )}
      <label className="block text-sm font-semibold">
        Date d’effet
        <input
          className={field}
          type="date"
          value={from || seasonStart}
          onChange={(e) => setFrom(e.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={busy || !member || !patrol || !(from || seasonStart)}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        onClick={confirmMember}
      >
        Confirmer le membre
      </button>
      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {data.entries.length} affectation(s) datée(s).
      </p>
    </section>
  );
}
