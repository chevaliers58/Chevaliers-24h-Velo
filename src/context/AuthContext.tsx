import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  onboarded: boolean;
  member_approved?: boolean;
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
  member_approved?: boolean;
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

  // Ignore stale asynchronous responses after a change of identity.
  const activeUserId = useRef<string | null>(null);
  const requestVersion = useRef(0);

  const loadUserData = useCallback(async (currentUser: User) => {
    if (activeUserId.current !== currentUser.id) return;
    const version = ++requestVersion.current;
    const isCurrent = () =>
      version === requestVersion.current && activeUserId.current === currentUser.id;

    setIsAdmin(false);
    try {
      // 1. Fetch profile with patrol details
      const { data: prof, error: profError } = (await supabase
        .from("profiles")
        .select("*, patrols(name, category)")
        .eq("id", currentUser.id)
        .maybeSingle()) as { data: DbProfile | null; error: unknown };

      if (!isCurrent()) return;
      if (profError) throw profError;
      if (prof) {
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
          onboarded: !!prof.onboarded,
          member_approved: prof.member_approved === true,
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

        let profileLoaded = false;
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

          if (!isCurrent()) return;
          if (!createErr && createdProf) {
            const patrolData = (createdProf as DbProfile).patrols;
            const isChef = isStaffPatrol(patrolData);
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
              member_approved: (createdProf as DbProfile).member_approved === true,
              created_at: createdProf.created_at,
            });
            profileLoaded = true;
          }
        } catch (e) {
          console.warn("[AuthContext] Auto-création profil Supabase :", e);
        }

        if (!isCurrent()) return;
        if (!profileLoaded) {
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
      }

      if (!isCurrent()) return;
      // Les droits administrateur proviennent exclusivement de la table user_roles.
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!isCurrent()) return;
      if (roleError) {
        console.error("[AuthContext] Impossible de vérifier le rôle administrateur :", roleError);
      }
      setIsAdmin(!roleError && !!roleData);
    } catch (err) {
      if (isCurrent()) {
        setProfile(null);
        setIsAdmin(false);
        console.error("[AuthContext] Error loading user data:", err);
      }
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserData(user);
    }
  }, [user, loadUserData]);

  useEffect(() => {
    let mounted = true;

    // INITIAL_SESSION also supplies the initial session. Avoid a second
    // independently resolving getSession request.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      const nextUser = nextSession?.user ?? null;
      const nextId = nextUser?.id ?? null;
      if (activeUserId.current !== nextId || !nextUser) {
        ++requestVersion.current;
        activeUserId.current = nextId;
        setProfile(null);
        setIsAdmin(false);
        setLoading(!!nextUser);
      }
      setSession(nextSession);
      setUser(nextUser);

      if (nextUser) {
        // Never make Supabase requests inside the auth callback itself.
        const scheduledVersion = requestVersion.current;
        window.setTimeout(() => {
          if (
            mounted &&
            activeUserId.current === nextId &&
            requestVersion.current === scheduledVersion
          ) {
            void loadUserData(nextUser);
          }
        }, 0);
      }
    });

    return () => {
      mounted = false;
      ++requestVersion.current;
      activeUserId.current = null;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signOut = useCallback(async () => {
    // SIGNED_OUT invalidates pending work in the subscription.
    const { error } = await supabase.auth.signOut();
    if (error) console.error("[AuthContext] Déconnexion Supabase :", error);
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
