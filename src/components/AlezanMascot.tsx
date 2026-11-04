import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { getAlezanQuote, type AlezanContext } from "@/lib/alezanQuotes";
import { useSeasonalTheme } from "@/context/SeasonalThemeContext";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";


interface Birthday {
  user_id: string;
  display_name: string;
  days_until: number;
}

const PAGE_CONTEXT: Record<string, AlezanContext> = {
  "/": "home",
  "/mes-km": "ride",
  "/timeline": "timeline",
  "/solidarite": "solidarity",
  "/profil": "profile",
  "/carte": "map",
  "/admin": "admin",
  "/auth": "welcome",
};

interface AlezanMascotProps {
  context?: AlezanContext;
}

/** Alezouille accueille les scouts avec un message lié à la page. */
export function AlezanMascot({ context }: AlezanMascotProps) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { theme: currentTheme } = useSeasonalTheme();
  const pageContext = context ?? PAGE_CONTEXT[pathname] ?? "general";
  // Téléphone : Alezouille est une pastille ; on touche pour lire son message
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !rootRef.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  const quote = useMemo(() => getAlezanQuote(pageContext), [pageContext]);
  const { data: birthdays = [] } = useQuery<Birthday[]>({
    queryKey: ["birthdays", user?.id],
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("upcoming_birthdays", { _days: 7 });
      if (error) return [];
      return (data as Birthday[] | null) ?? [];
    },
  });
  const birthdayCelebrants = birthdays.filter((birthday) => birthday.days_until === 0);
  const birthdayMode = birthdayCelebrants.length > 0 || currentTheme === "anniversaire";
  const birthdayGreeting =
    birthdayCelebrants.length > 0
      ? birthdayCelebrants.some((birthday) => birthday.user_id === user?.id)
        ? "Joyeux anniversaire à toi et à la troupe ! 🎉"
        : `Aujourd’hui, on fête ${birthdayCelebrants.map((birthday) => birthday.display_name).join(", ")} ! 🎉`
      : birthdayMode
        ? "Joyeux anniversaire au staff de la troupe ! 🎉"
        : quote;

  const mascotSymbol =
    birthdayMode ? "🎉" :
    currentTheme === "ete" ? "☀️" :
    currentTheme === "halloween" ? "🎃" :
    currentTheme === "noel" ? "🎄" :
    currentTheme === "valentin" ? "❤️" : "⚜️";

  return (
    <aside
      ref={rootRef}
      aria-label="Le message de la mascotte"
      className="mobile-mascot pointer-events-none fixed bottom-4 right-3 z-40 flex max-w-[calc(100vw-1.5rem)] items-end gap-2 sm:bottom-6 sm:right-6 sm:gap-3"
    >
      <div
        id="troop-mascot-message"
        data-open={open ? "true" : undefined}
        className={`mobile-mascot-bubble relative mb-6 ${birthdayMode ? "max-w-[min(8rem,calc(100vw-12rem))] sm:max-w-[min(13rem,calc(100vw-13rem))]" : "max-w-[min(13rem,calc(100vw-9rem))]"} rounded-2xl border border-border/80 bg-card/95 px-3 py-2.5 shadow-lg shadow-black/10 backdrop-blur-sm after:absolute after:-right-1.5 after:bottom-4 after:h-3 after:w-3 after:rotate-45 after:border-r after:border-t after:border-border/80 after:bg-card`}
      >
        <p className="mb-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-primary">
          {birthdayMode ? "Mode anniversaire" : "La mascotte te glisse un message"}
        </p>
        <p
          role="status"
          className="text-[11px] font-medium leading-snug text-foreground sm:text-xs"
        >
          {birthdayGreeting}
        </p>
      </div>
      <button
        type="button"
        className="mobile-mascot-toggle relative shrink-0 cursor-default rounded-full border-0 bg-transparent p-0"
        aria-label={open ? "Fermer le message de la mascotte" : "Lire le message de la mascotte"}
        aria-expanded={open}
        aria-controls="troop-mascot-message"
        onClick={() => {
          setOpen((value) => !value);
          setSeen(true);
        }}
      >
        {!seen && <span className="mobile-mascot-dot" aria-hidden="true" />}
        <span
          role="img"
          aria-label="Emblème de la troupe"
          className="mobile-mascot-mark grid shrink-0 place-items-center rounded-full text-6xl leading-none sm:text-7xl"
        >
          {mascotSymbol}
        </span>
      </button>
    </aside>
  );
}
