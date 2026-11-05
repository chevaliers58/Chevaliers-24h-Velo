# Audit de migration Supabase — Chevaliers 58

Ce document suit la préparation technique de l'application indépendante **24h vélo Chevaliers 58**. Il ne contient aucune donnée ni aucun identifiant privé.

## État du projet Supabase

- Projet actif : `qxlsdauqoivqhoojlrwk`
- URL : `https://qxlsdauqoivqhoojlrwk.supabase.co`
- Tables applicatives publiques : aucune
- Migrations : aucune
- Edge Functions : aucune
- Aucune migration de données de l'application source n'est souhaitée.

## Corrections déjà réalisées sur la branche de travail

- Le client Supabase ne contient plus d'URL ni de clé du projet source.
- La configuration exige `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Le client accepte une clé publishable ou une ancienne clé JWT anon, et refuse les clés secrètes/service_role dans le navigateur.
- Supabase Auth est la seule source de session dans le contexte d'authentification et la route protégée.
- Le rôle admin provient de `user_roles`, sans privilège automatique lié à une adresse e-mail héritée.
- Les écrans principaux d'administration, de profil, d'historique et d'enregistrement ne font plus de lectures/écritures de secours dans la base locale.
- Les utilitaires d'affichage des sports et emblèmes de patrouille ont été séparés de l'ancien module de base locale.
- L'ancienne implémentation `StandaloneDatabase` et ses données locales ont été retirées ; `database.ts` ne conserve que des types de compatibilité.
- Le serveur Vite ne crée plus de fichier `data/db.json`, d'endpoint `/api/db`, ni de route de diagnostic avec les identifiants de l'ancien projet.

## Inventaire des tables et vues appelées par le code

Le code actuel dépasse largement le guide SQL historique. Les noms repérés lors de l'audit sont :

- `profiles`, `patrols`, `activities`, `user_roles`
- `countdowns`, `timeline`, `proposed_routes`
- `group_rides`, `group_ride_members`
- `planned_rides`, `planned_ride_responses`, `member_links`
- `weekly_badges`, `distance_awards`
- `scout_challenges`, `scout_challenge_participants`
- `activity_corrections`, `timeline_distance_milestone_overrides`
- `app_notifications`, `app_notification_settings`
- `cleanup_runs`, `expedition_waypoints`, `site_settings`, `solidarity_goals`
- `strava_connections`, `strava_oauth_states`, `app_push_subscriptions`, `app_installations`
- Vues : `profiles_public`, `activities_public`

La liste doit encore être comparée à tous les composants et aux requêtes dynamiques avant de rédiger la migration initiale.

## Fonctions SQL appelées par le frontend

- `has_role`
- `set_admin_by_email`
- `admin_set_password`
- `staff_birthday_dates`
- `upcoming_birthdays`
- `leaderboard`
- `mark_corrections_seen`
- `scout_challenge_leaderboard`
- `create_scout_challenge`
- `admin_update_scout_challenge`
- `admin_delete_scout_challenge`
- `review_scout_challenge_entry`

Ces fonctions devront être définies avec des droits `SECURITY DEFINER` uniquement lorsqu'ils sont nécessaires, un `search_path` fixé, et des contrôles explicites de rôle.

## Fonctions Edge requises par le code

- `strava-oauth`
- `app-notifications`
- `menage`

Aucune Edge Function n'existe actuellement dans le nouveau projet. Ces fonctions sont des fonctionnalités distinctes à implémenter ou désactiver proprement avant un déploiement complet.

## Points de sécurité à traiter dans la migration

- Les membres ne doivent pas pouvoir valider/refuser leurs propres activités ni attribuer des rôles.
- Les administrateurs doivent être vérifiés par `user_roles` côté base, pas uniquement dans l'interface.
- Les vues publiques ne doivent exposer que les champs nécessaires et ne doivent pas divulguer e-mail, téléphone ou liens privés.
- Les preuves et GPX doivent être accessibles selon une politique Storage documentée ; les fichiers GPX exposent des données de localisation et demandent une attention particulière.
- Les écritures de patrouilles, comptes à rebours, badges, défis, corrections et réglages doivent être réservées au staff autorisé.
- Les opérations d'administration de comptes et de mots de passe ne doivent jamais être faites depuis le navigateur avec une clé privilégiée.

## Validation restante

- Terminer l'inventaire des requêtes, triggers, vues, politiques RLS et fonctions.
- Écrire une migration SQL complète et relisible.
- Ajouter les données de départ nécessaires (dont la patrouille Staff) sans données de l'autre troupe.
- Initialiser le nouveau projet après validation de la migration.
- Régénérer les types TypeScript depuis le nouveau projet.
- Lancer build, lint et tests fonctionnels avec les variables d'environnement du projet Chevaliers 58.
- Vérifier les Edge Functions et les paramètres Auth/Storage avant déploiement.

**Aucune migration SQL n'a été exécutée sur Supabase à ce stade.**
