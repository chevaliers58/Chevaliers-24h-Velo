# Mise en ligne Cloudflare Pages — 18 novembre 2026

## Version de référence
- Base: e5a0875919388e3d35b6ab15d0d025520963b299 ; toutes les CI de cette base sont vertes.
- Branche de production dédiée: release/cloudflare. Ne pas déployer main ni la branche de développement automatiquement; transférer uniquement les révisions validées.
- Vercel staging existant reste protégé et disponible. Ne pas supprimer Vercel ni modifier 19-58.net. Aucun achat.
- En-tête X-Robots-Tag noindex/nofollow/noarchive et robots.txt racine + /velo/ pour réduire l'indexation. Ce n'est pas un mécanisme d'accès privé; RLS et approbation restent indispensables.
- Supabase existant qxlsdauqoivqhoojlrwk ; ne pas recréer la base ni les comptes. Saison starts_on=2026-11-18, ends_on=2027-03-21, enabled=false jusqu'à validation réelle.

## Cloudflare Dashboard (action propriétaire)
Workers & Pages > Create application > Pages > Connect to Git / Import an existing Git repository.
Autoriser uniquement chevaliers58/Chevaliers-24h-Velo.
Projet créé chevaliers-24h-velo (domaine confirmé dans le tableau de bord); production branch release/cloudflare; framework None; build command npm run build:pages; build output directory .output/pages; racine dépôt. Node 22.
Variables de build production (aucun secret administratif):
- NODE_VERSION=22
- VITE_BASE_PATH=/velo/
- VITE_SUPABASE_PROJECT_ID=qxlsdauqoivqhoojlrwk
- VITE_SUPABASE_URL=https://qxlsdauqoivqhoojlrwk.supabase.co
- VITE_SUPABASE_PUBLISHABLE_KEY=clé sb_publishable_ du Dashboard Settings API Keys (PAS service_role ni secret)
- VITE_SITE_URL=https://chevaliers-24h-velo.pages.dev/velo
- VITE_TROOP_NAME=Chevaliers 58
- VITE_TROOP_STRAVA_CLUB_URL=https://www.strava.com/clubs/Chevaliers58
Désactiver les déploiements preview des autres branches. Un déploiement Pages production peut être public immédiatement: configurer SMTP/URLs avant Save and Deploy, ne pas diffuser URL avant contrôle; si nécessaire protéger via Access. Pas de jeton Cloudflare dans le chat ou dépôt. Compte Cloudflare déjà créé par responsable, pas de connecteur de gestion Cloudflare disponible dans cette session.

## Brevo (propriétaire)
Vérifier expéditeur adresse troupe, créer clé SMTP dédiée dans SMTP & API, copier l'identifiant SMTP exact, activer emails transactionnels si nécessaire. L'adresse Gmail peut être réécrite par Brevo; pas d'achat de domaine nécessaire pour essayer. Désactiver suivi des liens Auth.
Supabase Authentication > SMTP Settings: custom SMTP, sender troupe, Chevaliers 58, smtp-relay.brevo.com, port 587, identifiant SMTP affiché par Brevo, clé SMTP comme mot de passe. Jamais de clé partagée. Confirmer que les envois transactionnels fonctionnent.
Authentication > URL Configuration: Site URL https://chevaliers-24h-velo.pages.dev/velo/ et allow-list exacte de cette URL et https://chevaliers-24h-velo.pages.dev/velo/nouveau-mot-de-passe. Conserver confirmation e-mail, validation staff distincte. Pas de wildcard. Protection mots compromis si disponible selon plan.
Faire une inscription réelle contrôlée, vérifier réception et lien, attente, validation par admin, puis récupération de mot de passe et essai smartphone. Vérifier accès public /velo/, auth/admin, manifest, SW, icônes, JS/CSS, URL racine ; vérifier X-Robots-Tag. Ne pas ouvrir saison avant contrôle; activer ensuite sans modifier date de début. Ne pas activer notifications/cron à l'aveugle.

## Premier déploiement production
Le 18/11, le responsable signale un build réussi mais le domaine principal affiche « Nothing is here yet ». Les anciens déploiements étaient listés Preview. Après modification de Branch control sur release/cloudflare, un nouveau push sur cette branche doit déclencher un nouveau déploiement Production (ne pas se limiter au retry d'une ancienne preview). Ce commit corrige uniquement la documentation et déclenche cette tentative ; aucune modification du code applicatif ni de la base. Vérifier Production/Success et l'URL réelle dans Cloudflare avant de tester les e-mails et d'activer la saison. SMTP Brevo enregistré par le responsable, livraison non confirmée.
