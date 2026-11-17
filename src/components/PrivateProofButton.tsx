import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { storagePathFromUrl } from "@/lib/proofStorage";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";

const db = supabase as unknown as SupabaseClient;

/** No public or signed file link is generated. The Storage API checks the current JWT. */
export function PrivateProofButton({
  path,
  label = "Télécharger la preuve",
}: {
  path?: string | null;
  label?: string;
}) {
  const { isAdmin, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const objectPath = storagePathFromUrl(path);
  if (!isAdmin || !user || !objectPath) return null;

  async function download() {
    if (!objectPath || busy) return;
    setBusy(true);
    try {
      const { data, error } = await db.storage.from("proofs").download(objectPath);
      if (error || !data) throw error || new Error("Fichier introuvable");
      const { data: authData } = await db.auth.getUser();
      if (authData.user?.id !== user?.id) return;
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = objectPath!.split("/").pop() || "preuve";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("Impossible de télécharger la preuve. Vérifie tes droits d’accès.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={busy} onClick={download}>
      <Download className="mr-1 h-4 w-4" />
      {busy ? "Téléchargement…" : label}
    </Button>
  );
}
