import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isStaffPatrol, TROOP_STAFF_PATROL_NAME } from "@/lib/categories";

export interface ScoutProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  totem: string | null;
  quali: string | null;
  scout_year: number | null;
  phone: string | null;
  strava_url: string | null;
  patrol_id: string | null;
  patrol_name?: string | null;
  patrol_category?: string | null;
  is_chef?: boolean;
  is_admin?: boolean;
  onboarded: boolean;
  created_at?: string | null | undefined;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ScoutProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

interface DbProfile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  totem?: string | null;
  quali?: string | null;
  scout_year?: number | null;
  phone?: string | null;
  strava_url?: string | null;
  patrol_id?: string | null;
  onboarded?: boolean;
  is_admin?: boolean;
  created_at?: string;
  patrols?: {
    name?: string | null;
    category?: string | null;
  } | null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ScoutProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to load profile & admin status from Supabase
  const loadUserData = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch profile with patrol details
      const { data: prof, error: profError } = (await supabase
        .from("profiles")
        .select("*, patrols(name, category)")
        .eq("id", currentUser.id)
        .maybeSingle()) as { data: DbProfile | null; error: unknown };

      if (!profError && prof) {
        const patrolData = prof.patrols;
        const isChef = isStaffPatrol(patrolData);

        setProfile({
          id: prof.id,
          email: prof.email ?? currentUser.email ?? null,
          full_name: prof.full_name ?? currentUser.email?.split("@")[0] ?? "Scout",
          totem: prof.totem ?? null,
          quali: prof.quali ?? null,
          scout_year: prof.scout_year ?? null,
          phone: prof.phone ?? null,
          strava_url: prof.strava_url ?? null,
          patrol_id: prof.patrol_id ?? null,
          patrol_name: patrolData?.name ?? (isChef ? TROOP_STAFF_PATROL_NAME : null),
          patrol_category: patrolData?.category ?? (isChef ? "staff" : null),
          is_chef: isChef,
          // Droits admin : uniquement ceux enregistrés en base (user_roles -> is_admin).
          // Être dans une patrouille staff ne rend pas admin.
          is_admin: !!prof.is_admin,
          onboarded: !!prof.onboarded,
          created_at: prof.created_at,
        });
      } else {
        // Le profil n'existe pas encore dans Supabase: tenter de le créer maintenant avec la session active
        const meta = currentUser.user_metadata || {};
        const metaName =
          (meta["full_name"] as string) ||
          (meta["name"] as string) ||
          currentUser.email?.split("@")[0] ||
          "Scout";
        const metaTotem = (meta["totem"] as string) || null;
        const metaQuali = (meta["quali"] as string) || null;
        const metaYear = meta["scout_year"] ? Number(meta["scout_year"]) : null;
        const metaPatrol = (meta["patrol_id"] as string) || null;
        const metaPhone = (meta["phone"] as string) || null;
        const isChef = isStaffPatrol(metaPatrol ? { name: metaPatrol } : null);

        try {
          const { data: createdProf, error: createErr } = await supabase
            .from("profiles")
            .upsert(
              {
                id: currentUser.id,
                email: currentUser.email ?? null,
                full_name: metaName,
                totem: metaTotem,
                quali: metaQuali,
                scout_year: metaYear,
                patrol_id: metaPatrol && metaPatrol.includes("-") ? metaPatrol : null,
                phone: metaPhone,
                onboarded: true,
              },
              { onConflict: "id" },
            )
            .select("*, patrols(name, category)")
            .maybeSingle();

          if (!createErr && createdProf) {
            const patrolData = (createdProf as DbProfile).patrols;
            setProfile({
              id: createdProf.id,
              email: createdProf.email ?? currentUser.email ?? null,
              full_name: createdProf.full_name ?? metaName,
              totem: createdProf.totem ?? metaTotem,
              quali: createdProf.quali ?? metaQuali,
              scout_year: createdProf.scout_year ?? metaYear,
              phone: createdProf.phone ?? metaPhone,
              strava_url: createdProf.strava_url ?? null,
              patrol_id: createdProf.patrol_id ?? null,
              patrol_name: patrolData?.name ?? (isChef ? TROOP_STAFF_PATROL_NAME : null),
              patrol_category: patrolData?.category ?? (isChef ? "staff" : null),
              is_chef: isChef,
              onboarded: true,
              created_at: createdProf.created_at,
            });
            return;
          }
        } catch (e) {
          console.warn("[AuthContext] Auto-création profil Supabase :", e);
        }

        setProfile({
          id: currentUser.id,
          email: currentUser.email ?? null,
          full_name: metaName,
          totem: metaTotem,
          quali: metaQuali,
          scout_year: metaYear,
          phone: metaPhone,
          strava_url: null,
          patrol_id: metaPatrol && metaPatrol.includes("-") ? metaPatrol : null,
          is_chef: false,
          onboarded: false,
        });
      }

      // Les droits administrateur proviennent exclusivement de la table user_roles.
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        console.error("[AuthContext] Impossible de vérifier le rôle administrateur :", roleError);
      }
      setIsAdmin(!!roleData);
    } catch (err) {
      console.error("[AuthContext] Error loading user data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserData(user);
    }
  }, [user, loadUserData]);

  useEffect(() => {
    let mounted = true;

    // Supabase Auth est l'unique source de session.
    const syncSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const s = data.session;
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
        await loadUserData(s?.user ?? null);
      } catch (error) {
        console.error("[AuthContext] Impossible de récupérer la session Supabase :", error);
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    syncSession();

    // Subscribe to Supabase auth updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, newSession: unknown) => {
      if (!mounted) return;
      const s = (newSession ?? null) as Session | null;
      const u = (s?.user ?? null) as User | null;
      if (u) {
        setSession(s);
        setUser(u);
        await loadUserData(u);
      } else {
        syncSession();
      }
    });


    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isAdmin,
      loading,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, isAdmin, loading, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
