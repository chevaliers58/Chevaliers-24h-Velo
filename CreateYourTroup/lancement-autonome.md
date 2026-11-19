# Plan de mise en service indépendante — Chevaliers 58

## Point de départ

- Projet Vercel existant `chevaliers58-velo-preview`, adresse de projet réservée `chevaliers58-velo-preview.vercel.app`. Toutes les prévisualisations restent protégées par Vercel Authentication (all). Le site 19-58.net est indépendant et intact.
- Supabase cible `qxlsdauqoivqhoojlrwk` ; aucune copie des comptes d'origine. Le site conserve /velo/ même sur un domaine dédié, pour ne pas changer la portée PWA, les routes et les liens déjà testés. La racine redirige vers /velo/.
- Le domaine de production ne doit pas être confondu avec les URL de déploiement éphémères. Une adresse Vercel gratuite existe ; offre Hobby conditionnée à un usage personnel non commercial et aux quotas. Vérifier le plan, les conditions et le coût éventuel Supabase/SMTP avant ouverture. Aucun achat automatique. Un domaine personnalisé pourra être connecté ensuite sans déplacer Supabase ; l'installation PWA et la session sont propres à l'origine et pourront nécessiter une réinstallation/reconnexion.

## Préparation réutilisable

1. Déterminer l'origine HTTPS stable et vérifier son rattachement à notre projet Vercel. Sans accès 19-58.net, retenir l'adresse Vercel existante à défaut d'une autre adresse confirmée, sans publier pour l'instant. Le nom chevaliers58-velo.vercel.app n'est pas réservé à ce jour. Ne pas présumer qu'il est disponible.
2. Après validation sécurité et CI du commit exact, préparer un build production **distinct** de la preview (Node 22, npm ci, VITE_BASE_PATH=/velo/, VITE_SITE_URL=https://<adresse-stable>/velo, VITE_TROOP_NAME=Chevaliers 58, URL Supabase cible, clé sb_publishable_ uniquement, club Strava manuel). Ne jamais utiliser la clé service_role dans le client ni retirer les gardes de build preview. Copier la configuration de routes et en-têtes Vercel testée ; voir vercel.json du commit 2b012632. Garder noindex pour le site des mineurs. Déployer d'abord sans ouvrir au public ni affecter le domaine ; validation avant promotion. Maintenir un rollback vers la version antérieure protégée, si compatible avec la base.
3. Dans Supabase > Authentication > URL Configuration, régler Site URL = https://<adresse-stable>/velo/ ; ajouter les deux chemins exacts https://<adresse-stable>/velo/ et https://<adresse-stable>/velo/nouveau-mot-de-passe. Pour tester les liens d'une preview, ajouter temporairement les mêmes deux chemins à son origine exacte ; retirer les previews périmées. Ne pas autoriser un wildcard couvrant tous les sites Vercel. Vérifier aussi SITE_URL des Edge Functions si nécessaire. Paramétrer confirmation de comptes, expéditeur SMTP autorisé, limites d'envoi et protection contre abus. Test réel avec adresse de test autorisée, jamais un compte inventé. Le mail intégré Supabase n'est pas un service SMTP de production.
4. Avant ouverture : vérifier précisément compte admin initial (email confirmé par responsable ; exécuter bootstrap_admin.sql uniquement après accord explicite), roster de test, points, accès preuves et confidentialité staff par API, date officielle, tests sur smartphone, politique de données mineurs. Installer le verrou de saison après autorisation. Activer la saison uniquement au lancement (fin 21/03/2027), et laisser les notifications facultatives désactivées tant qu'elles ne sont pas configurées. Vérifier et réactiver le nettoyage selon procédure validée. Ne pas introduire la seconde troupe sans isolation de ses droits.
5. Seulement après accord : affecter domaine officiel au build production validé et ouvrir son accès sans connexion Vercel, conserver les previews protégées si possible. Contrôler accès anonyme, login, signup et réinitialisation mail, rôles, activité/validation et PWA sur domaine stable. Pas de fusion main ou déploiement officiel sans accord distinct.

## Références
- https://vercel.com/docs/domains/working-with-domains
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/deployments/environments
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/deployment/going-into-prod
