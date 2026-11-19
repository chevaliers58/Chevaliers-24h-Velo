# Signature du header et nettoyage Alezan — 19 novembre 2026

Demande du responsable : remplacer « Troupe scoute » par « by Aquila NO042 Alezan » sous le nom du site.
Fichier : src/components/SiteHeader.tsx. Logo Chevaliers 58 inchangé.

Suppression de 15 images historiques non référencées dans les composants, routes et bibliothèques consultés, styles et scripts de compilation. Taille cumulée des fichiers retirés : 2787579 octets (environ 2,8 Mo). Historique Git conservé, donc pas de diminution garantie du stockage Git total ni du bundle déjà compilé.
- Perso/Alezan_Classique.png
- Perso/Alezan_Fete_National.png
- Perso/Alezan_Halloween.png
- Perso/Alezan_Noel.png
- Perso/Alezan_St_Valentin.png
- alezan_perso.jpeg
- src/assets/Perso/Alezan_Anniversaire.png
- src/assets/Perso/Alezan_Classique.png
- src/assets/Perso/Alezan_Ete.png
- src/assets/Perso/Alezan_Fete_National.png
- src/assets/Perso/Alezan_Halloween.png
- src/assets/Perso/Alezan_Noel.png
- src/assets/Perso/Alezan_St_Valentin.png
- src/assets/logo-alezan-clair.png
- src/assets/logo-alezan.png

Conserver : chevaliers58-logo.svg, chevaliers58-mascotte.svg, AlezanMascot.tsx, alezanQuotes.ts (fonctionnalités actives), icônes PWA et anciennes migrations SQL (historique de schéma).
Aucune migration ni modification Supabase. Correctif isolé sur release/cloudflare ; intégrer également dans la branche de développement sans publier le candidat notifications/patrouilles. Cloudflare doit recompiler automatiquement ; vérifier le statut et le rendu sur production.
