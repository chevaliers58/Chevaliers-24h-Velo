# Guide GitHub et administration — Chevaliers 58, 24h vélo

> Manuel de transmission du staff — 18 novembre 2026. Chemins vérifiés dans le code du projet. Les changements de notifications et de renommage des patrouilles sont validés en CI sur 8b741ff6 mais non publiés à la date de rédaction.

## 1. Les quatre outils et leurs rôles

| Outil | Rôle | Accès |
|---|---|---|
| GitHub | Code, couleurs, structure, documentation, historique, tests | [Dépôt](https://github.com/chevaliers58/Chevaliers-24h-Velo) |
| Cloudflare Pages | Compilation et hébergement public | [Dashboard](https://dash.cloudflare.com/) |
| Supabase | Membres, patrouilles, sorties, réglages, droits, fichiers, fonctions serveur | [Table Editor](https://supabase.com/dashboard/project/qxlsdauqoivqhoojlrwk/editor) |
| Brevo | E-mails de confirmation et récupération de mot de passe | [Dashboard](https://app.brevo.com/) |

Site officiel : https://chevaliers-24h-velo.pages.dev/velo/ — [Administration](https://chevaliers-24h-velo.pages.dev/velo/admin). Les chemins du code omettent normalement le préfixe /velo/ (géré au build). L'application installable dispose de pages /app distinctes de certaines pages web. Vérifier les deux.

## 2. Modifier un fichier sans casser le site

1. Ouvrir le dépôt GitHub, onglet Code. Choisir la branche `integration/chevaliers58-consolidation` (développement) et non `release/cloudflare` (production automatique). Vérifier le dernier commit et l'écart entre branches avant chaque série de changements.
2. Ouvrir un fichier via les liens ci-dessous (relatifs à cette branche). Dans GitHub, cliquer sur le crayon (Edit this file). Enregistrer de préférence dans une nouvelle branche de travail et ouvrir une pull request vers la branche d'intégration.
3. Modifier une chose à la fois. Donner un nom clair au commit, par exemple « Modifier le titre de la Timeline ». Vérifier l'onglet Files changed, ne pas modifier les fichiers de sécurité pour changer un texte.
4. Attendre les vérifications dans Actions (build/lint/TypeScript, SQL, navigateur, nettoyage). Si une branche de travail ne déclenche pas les workflows, faire passer la modification en intégration via revue, ou déclencher les workflows compatibles manuellement sur la branche. Ne pas confondre une compilation réussie avec un test de toutes les fonctionnalités.
5. Vérifier l'apparence dans une prévisualisation protégée ou en local, avec données de test. Pour la publication : intégrer les commits validés à `release/cloudflare` sans force push, puis attendre le déploiement Production/Success. Ne pas fusionner d'anciens fichiers ou de modifications non testées. Tester le domaine officiel, le mobile, la navigation et les droits.
6. En cas de problème, restaurer le dernier déploiement réussi dans Cloudflare puis corriger le code (revert via GitHub). Un rollback du frontend ne restaure pas la base SQL : migrations à coordonner séparément.

Pour un test local, installer Node.js 22, récupérer le dépôt (GitHub Desktop ou git), exécuter `npm ci`, puis `npm run dev`. Configurer un environnement local de test Supabase séparé avant d'enregistrer des données. Ne pas utiliser les clés secrètes de production. `npm run build:pages` génère `.output/pages`. Cloudflare utilise VITE_BASE_PATH=/velo/ et les variables de production du [guide de déploiement](lancement-cloudflare.md).

## 3. Modifier l'apparence standard et les thèmes

| Quoi ? | Fichier / interface | Comment |
|---|---|---|
| Couleurs générales | [src/styles.css](../src/styles.css) | Bloc `:root` : --background, --foreground, --primary, --secondary, --accent, --card, --header, --countdown. Préserver le contraste. |
| Polices, coins arrondis | [src/styles.css](../src/styles.css) | `@theme inline` : --font-display, --font-sans ; --radius dans :root. |
| Fond d'accueil | Administration > Fêtes > Photos des thèmes manuels > Standard | Envoyer/Remplacer ; fond public. Valeur par défaut : [src/assets/hero.jpg](../src/assets/hero.jpg). |
| Noël, Halloween, fêtes | [src/lib/seasonalTheme.ts](../src/lib/seasonalTheme.ts), [src/styles.css](../src/styles.css) | SEASONAL_THEMES (nom, aperçu, couleurs d'échantillon), règles CSS [data-theme="…"]. Calendrier/activation via Fêtes ; aperçu privé avant Activer. |
| Logo / mascotte | [src/assets](../src/assets), [SiteHeader.tsx](../src/components/SiteHeader.tsx), [AlezanMascot.tsx](../src/components/AlezanMascot.tsx), [alezanQuotes.ts](../src/lib/alezanQuotes.ts) | Remplacer les fichiers SVG utilisés ou les imports ; modifier les phrases selon contexte. |
| Logo de l'application installée | [public/manifest.webmanifest](../public/manifest.webmanifest), [public/icon-192.png](../public/icon-192.png), [public/icon-512.png](../public/icon-512.png), [public/apple-touch-icon.png](../public/apple-touch-icon.png), [public/favicon.ico](../public/favicon.ico) | Conserver tailles et transparence adaptées. Vérifier l'installation et le cache. |
| Nom de la troupe, lien Strava | [src/lib/troop-config.ts](../src/lib/troop-config.ts) | En production : VITE_TROOP_NAME et VITE_TROOP_STRAVA_CLUB_URL dans Cloudflare, puis rebuild. |

Exemple de couleur : dans `src/styles.css`, remplacer uniquement la valeur de `--primary` et adapter `--primary-foreground` et `--ring` si nécessaire. Les variables de thème sont utilisées dans des classes telles que `bg-primary text-primary-foreground`. Les autres couleurs ont parfois leur propre classe ou variable ; vérifier visuellement.

Classes Tailwind usuelles : `p-4` marge intérieure, `gap-3` espacement, `rounded-xl` coins, `text-lg` taille du texte, `grid-cols-2` deux colonnes, `md:grid-cols-3` trois sur écran plus large. Ne pas retirer les contrôles d'accès ni les états de chargement.

## 4. Modifier les catégories du menu et le contenu des pages

Le navigateur et l'application installée ont des menus différents.

- [SiteHeader.tsx](../src/components/SiteHeader.tsx) : tableau `navItems` (to = chemin, label = texte, shortLabel = version courte). Modifier label pour renommer, déplacer l'objet complet pour réordonner ; conserver les conditions de visibilité.
- [AppTabBar.tsx](../src/components/app/AppTabBar.tsx) : onglets du bas (Mon espace, Classements, Timeline, Plus). Modifier label ou ordre sans casser les destinations.
- [app/plus.tsx](../src/routes/app/plus.tsx) : menu Plus, groupes La troupe, Moi et Staff. Les éléments AppListRow ont title, subtitle, to et icon.
- [__root.tsx](../src/routes/__root.tsx) : enveloppe globale (garder les providers et Outlet). [AppPageShell.tsx](../src/components/AppPageShell.tsx) et [AppUi.tsx](../src/components/app/AppUi.tsx) : structure et cartes réutilisables de l'application mobile.

| Rubrique | Fichier à ouvrir | Ce qu'il contient / réglages |
|---|---|---|
| Accueil et classements web | [routes/index.tsx](../src/routes/index.tsx) | Bandeau, titres, stats, sport, périodes, onglets de classement, peloton, tendances, carte, défis. |
| Mon espace (app) | [routes/app/index.tsx](../src/routes/app/index.tsx) | Cartes d'accueil, progression, derniers km, patrouilles de la semaine, prochain rendez-vous, raccourcis. |
| Classements (app) | [routes/app/classement.tsx](../src/routes/app/classement.tsx) | Patrouilles/Individuel, périodes Semaine/Mois/Tout, filtres d'année et sport. |
| Calcul des classements | [lib/appData.ts](../src/lib/appData.ts), [lib/categories.ts](../src/lib/categories.ts), [lib/staffCollective.ts](../src/lib/staffCollective.ts) | Sélection/agrégation client et règles des groupes. Les vues/RPC Supabase garantissent les règles côté serveur : ne pas modifier uniquement l'interface pour les points ou la confidentialité. |
| Points annuels / défis bonus | [AnnualCompetition.tsx](../src/components/AnnualCompetition.tsx), [annual_points.sql](../supabase/staged/annual_points.sql), [member_approval_collective.sql](../supabase/staged/member_approval_collective.sql) | Affichage des points, saison, affectations historiques, défis multiplicateurs. Administration > Défis & trophées. Les SQL sont des références historiques, pas à rejouer en production. |
| Timeline | [routes/timeline.tsx](../src/routes/timeline.tsx) | Souvenirs, filtres par année, tags, titre, texte, photo, Drive, paliers automatiques. |
| Sorties prévues | [routes/_authenticated/sorties-prevues.tsx](../src/routes/_authenticated/sorties-prevues.tsx), [routes/_authenticated/app/sorties-prevues.tsx](../src/routes/_authenticated/app/sorties-prevues.tsx), [PlannedRideForm.tsx](../src/components/PlannedRideForm.tsx), [lib/plannedRides.ts](../src/lib/plannedRides.ts) | Programme, formulaire, réponses, annulation. Table planned_rides. |
| Enregistrement / historique | [DailyDistanceForm.tsx](../src/components/DailyDistanceForm.tsx), [app/enregistrer.tsx](../src/routes/_authenticated/app/enregistrer.tsx), [mes-km.tsx](../src/routes/_authenticated/mes-km.tsx), [app/mes-kms.tsx](../src/routes/_authenticated/app/mes-kms.tsx) | Formulaire et listes personnelles. Les règles SQL, validation et preuves privées ne doivent pas être contournées. |
| Défis entre scouts | [ChallengesPanel.tsx](../src/components/ChallengesPanel.tsx), [app/defis.tsx](../src/routes/app/defis.tsx), [AdminChallenges.tsx](../src/components/AdminChallenges.tsx) | Défis, participants, résultats. |
| Maillots / peloton / graphiques | [app/maillots.tsx](../src/routes/app/maillots.tsx), [JerseysPanel.tsx](../src/components/JerseysPanel.tsx), [lib/jerseys.ts](../src/lib/jerseys.ts), [PelotonPanel.tsx](../src/components/PelotonPanel.tsx), [PatrolDailyContributionChart.tsx](../src/components/PatrolDailyContributionChart.tsx) | Visuels et calculs associés. |
| Expédition | [app/expedition.tsx](../src/routes/app/expedition.tsx), [ExpeditionGoal.tsx](../src/components/ExpeditionGoal.tsx), [CollectiveRouteMap.tsx](../src/components/CollectiveRouteMap.tsx), [lib/expedition.ts](../src/lib/expedition.ts) | Étapes et progression collective ; table expedition_waypoints. |
| Trophées / paliers | [app/trophees.tsx](../src/routes/_authenticated/app/trophees.tsx), [AdminDistanceAwards.tsx](../src/components/AdminDistanceAwards.tsx), [distanceTrophies.ts](../src/lib/distanceTrophies.ts), [distanceLevels.ts](../src/lib/distanceLevels.ts) | Distances, récompenses ; privilégier les réglages d'admin disponibles. |
| Solidarité | [solidarite.tsx](../src/routes/solidarite.tsx) | Objectifs, textes, gestion des objectifs ; table solidarity_goals. |
| Compte à rebours | [app/compte-a-rebours.tsx](../src/routes/app/compte-a-rebours.tsx), [CountdownBanner.tsx](../src/components/CountdownBanner.tsx) | Affichage ; Administration > Comptes à rebours pour les événements. |
| Administration | [routes/_authenticated/admin.tsx](../src/routes/_authenticated/admin.tsx) | Onglets `TabsTrigger` et `TabsContent` associés : Sorties, Scout sportif, Défis & trophées, Comptes à rebours, Notifications, Patrouilles, Membres, Fêtes, Ménage. Garder leurs value correspondantes. |
| Inscription / récupération | [auth.tsx](../src/routes/auth.tsx), [ForgotPassword.tsx](../src/components/ForgotPassword.tsx), [nouveau-mot-de-passe.tsx](../src/routes/nouveau-mot-de-passe.tsx) | Formulaires ; modèles de mails dans Supabase Auth, pas dans GitHub. |
| Notifications | [AppNotifications.tsx](../src/components/AppNotifications.tsx), [AdminAppNotifications.tsx](../src/components/AdminAppNotifications.tsx), [Edge Function](../supabase/functions/app-notifications/index.ts), [sw.js](../public/sw.js) | Cloche, historique, préférences, réception push et automatisation. Voir [guide spécifique](notifications-et-patrouilles.md). |

Exemple : pour renommer « Timeline » en « Souvenirs », modifier le label dans SiteHeader.tsx ET AppTabBar.tsx. Pour changer le grand titre de la page, chercher « La Ligne du Temps de la Troupe » dans routes/timeline.tsx. Garder to: "/timeline" et la route inchangés. Pour modifier les événements eux-mêmes, utiliser le site (section suivante).

Pour changer l'ordre des cartes d'accueil, déplacer des blocs JSX complets dans la page correspondante, pas uniquement leur titre. Pour ajouter une vraie page, voir [conventions de routes](../src/routes/README.md) : TanStack Start, routes dans src/routes, routeTree.gen.ts généré automatiquement. Ne pas créer une architecture Next.js parallèle.

## 5. Modifier les contenus sans toucher au code

| Contenu | Où modifier |
|---|---|
| Nom d'une patrouille ordinaire | Supabase > Table Editor > patrols > modifier name sur la ligne existante. Nouveau bouton Renommer préparé/testé, pas encore publié. Ne pas supprimer/recréer. |
| Couleurs et emblèmes de patrouilles | [patrolEmblem.ts](../src/lib/patrolEmblem.ts) : getPatrolColor / getPatrolEmblem. Adapter une couleur codée par nom si on renomme une patrouille ordinaire ; les préférences localStorage ne se synchronisent pas. |
| Membres et affectations | Administration > Membres ; modifier l'affectation validée et, si nécessaire, le roster daté dans Défis & trophées. |
| Souvenir Timeline | Page Timeline connectée en admin > Ajouter un souvenir ou crayon sur l'événement : date, titre, tag libre, description, URL photo et lien Drive facultatif. Les années se calculent depuis les dates. |
| Étape automatique Timeline / expédition | Les paliers viennent d'expedition_waypoints et les ajustements Timeline de timeline_distance_milestone_overrides. Utiliser les outils de modification disponibles ; vérifier avant de modifier la table. |
| Règles et dates du défi | Administration > Défis & trophées : saison/roster/défis. Pour un nouveau barème, changement SQL versionné et testé. |
| Notifications manuelles et fréquence | Administration > Notifications ; envoi à des membres sélectionnés, paramètres paliers et rappel du dimanche. Push : configuration décrite dans le guide spécifique. |

Attention : ne jamais renommer librement les groupes Staff/Externes : certaines règles s'appuient sur le nom. Ne pas publier des photos de mineurs reconnaissables ou des liens Drive ouverts à tous dans la Timeline/fonds d'écran. Le site public reste accessible même s'il est marqué noindex. Les preuves de sorties restent privées.

## 6. Sécurité et transmission

- Ne jamais enregistrer un mot de passe, une clé VAPID privée, une clé SMTP ou une clé Supabase secrète dans GitHub, les variables VITE_ ou une capture d'écran. La clé publishable du frontend est conçue pour être publique ; les RLS restent indispensables.
- Pour les changements SQL : préparer un script versionné, tester sur une base locale jetable, vérifier les accès anon/membre/admin et sauvegarder avant production. Ne pas rejouer les scripts staged déjà installés.
- Maintenir les deux administrateurs autorisés jusqu'à transfert réussi. Les droits du site, GitHub, Cloudflare, Supabase et Brevo sont indépendants ; gérer l'accès aux comptes techniques avec MFA et récupération institutionnelle.
- Documentation à lire ensuite : [notifications et patrouilles](notifications-et-patrouilles.md), [mise en ligne](lancement-cloudflare.md), [deuxième troupe (future)](multi-troupe-future.md). Historique de développement : [PR 3](https://github.com/chevaliers58/Chevaliers-24h-Velo/pull/3).
