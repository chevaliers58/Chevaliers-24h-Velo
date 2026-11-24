# Initialisation Supabase — 17 novembre 2026

Autorisation explicite du responsable reçue dans la conversation. Projet cible uniquement : qxlsdauqoivqhoojlrwk, eu-central-1, PostgreSQL 17, ACTIVE_HEALTHY. Code validé : 81e5110f2bbef526569f4c4cebcff6f95177d669. Aucun déploiement du site ni fusion main.

## Exécution et contrôles
- Projet vierge avant opération : 0 table publique, migration, fonction, utilisateur, bucket. Trois fonctions Edge déployées depuis les fichiers du SHA testé, version 1 ACTIVE : menage, pending-activity-alert, app-notifications. verify_jwt=false hérité du config testé (authentification interne par clé cron ou JWT vérifié selon fonction). Aucun endpoint Strava déployé.
- 57 migrations appliquées séquentiellement ; historique relu : 57/57 noms dans l'ordre. Le connecteur attribue ses propres versions temporelles et les noms contiennent le timestamp original (tirets UUID remplacés par underscores). **Ne pas lancer supabase db push avec l'historique Git tel quel** : il faut d'abord réconcilier les versions sans réexécuter le schéma. Tableau ci-dessous.
- Trois migrations de planification ont reçu une instruction finale cron.alter_job(jobid, active := false) dans la même exécution, pour mettre en pause menage-nuit, pending-activity-email-alert et app-notifications-push. Contrôle distant : les trois jobs existent, ciblent exclusivement le projet et sont inactifs. Réactivation seulement après validation et configuration des services. SITE_URL, VAPID, Resend et SMTP non configurés par cette intervention.
- 28 tables publiques, toutes RLS activée ; 2 buckets (proofs 15 MiB, backgrounds 8 MiB), publics par URL selon règles héritées. 0 utilisateurs Auth, profils, activités, objets Storage, compteurs, événements timeline et connexions Strava. 1 patrouille Staff, 10 étapes d'expédition, 2 objectifs solidarité, 32 seuils trophées et réglages initiaux.
- Permissions vérifiées en lecture seule : anon/authenticated ne lisent pas strava_connections, anon ne lit pas member_links, anon ne peut pas invoquer admin_set_password ni set_admin_by_email. Vues publiques vérifiées : pas de mail/téléphone/date anniversaire, ni GPX/photo/lien Strava d'activité. profiles_public contient strava_url avec masquage anonyme prévu par la migration testée.
- Security Advisor : 2 ERROR security_definer_view (profiles_public et activities_public, projections privilégiées intentionnelles des règles historiques ; ne pas les déclarer corrigées), 2 WARN RPC SECURITY DEFINER accessibles à anon (leaderboard et scout_challenge_leaderboard), 14 WARN RPC accessibles à authenticated (contrôles internes à revoir avant ouverture), 4 INFO RLS sans policy (app_installations, app_push_subscriptions, strava_connections, strava_oauth_states : accès navigateur fermé). Remédiations : https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view et https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable. Ne pas modifier les règles de partage à l'aveugle. Pas d'audit exhaustif, ni appel Edge réel ou test d'envoi effectué.
- Prochaine étape : préparer une prévisualisation non publique, définir dates/inscriptions/confidentialité mineurs avec responsable, configurer URL Auth et SITE_URL, tester fonctions avec données fictives et SMTP/push si désirés. Aucun compte réel créé, aucune publication ni modification DNS.

## Historique exact du connecteur

| Version distante | Nom de migration (timestamp Git inclus) |
|---|---|
| 20261117151655 | 20261001131044_0d953735_1817_46e2_8bb2_3c21b8934ec0 |
| 20261117151657 | 20261001131057_5d045adc_6e41_4881_bfaa_b0ebd22fd160 |
| 20261117151700 | 20261002120000_add_staff_patrol |
| 20261117151703 | 20261003120000_complete_base_schema |
| 20261117151705 | 20261007185900_vue_profils_publics |
| 20261117151708 | 20261007190000_securite_acces |
| 20261117151710 | 20261007200000_categorie_staff_valeur |
| 20261117151712 | 20261007200100_categorie_staff_patrouilles |
| 20261117151731 | 20261007210000_denivele_et_classement_valide |
| 20261117151735 | 20261007220000_scout_sportif |
| 20261117151739 | 20261007230000_staff_troupe |
| 20261117151743 | 20261008140000_donnees_publiques_limitees |
| 20261117151747 | 20261008140100_activites_reservees_membres |
| 20261117151749 | 20261008140200_reinitialisation_mot_de_passe_admin |
| 20261117151811 | 20261008170000_peloton_sorties_groupe |
| 20261117151814 | 20261009120000_scout_sportif_du_mois |
| 20261117151816 | 20261009140000_anniversaires |
| 20261117151822 | 20261009160000_theme_fetes |
| 20261117151825 | 20261009190000_themes_calendrier_fonds |
| 20261117151827 | 20261009200000_themes_hiver_carnaval_sports |
| 20261117151829 | 20261009210000_menage_automatique |
| 20261117151832 | 20261009210100_menage_planification |
| 20261117151848 | 20261011160000_sport_marche |
| 20261117151851 | 20261011180000_date_debut_defi |
| 20261117151854 | 20261011190000_corrections_sorties |
| 20261117151858 | 20261011230000_pending_activity_email_alert |
| 20261117151901 | 20261012100000_signup_birthday_metadata |
| 20261117151904 | 20261012120000_allow_changing_alezan_vote |
| 20261117151906 | 20261012130000_show_alezan_name_vote_members |
| 20261117151909 | 20261012140000_solidarity_goals |
| 20261117151924 | 20261012150000_nettoyer_sorties_validees |
| 20261117151927 | 20261012160000_strava_api_foundation |
| 20261117151930 | 20261012174846_scout_challenges |
| 20261117151933 | 20261012174954_scout_challenges_permissions |
| 20261117151935 | 20261012175025_scout_challenges_indexes_rls |
| 20261117151939 | 20261012175105_scout_challenges_rpc_acl |
| 20261117151941 | 20261012182424_scout_challenges_competition_rules |
| 20261117151945 | 20261012220000_masquer_noms_profils_publics |
| 20261117152003 | 20261012233000_admin_distance_awards |
| 20261117152016 | 20261012233100_afficher_nom_si_pas_de_totem |
| 20261117152019 | 20261013210000_expedition_grandes_distances |
| 20261117152024 | 20261014100000_disable_app_notifications |
| 20261117152026 | 20261014130000_remove_legacy_scout_challenge_trigger |
| 20261117152030 | 20261015120000_theme_calendar_and_staff_anniversaries |
| 20261117152032 | 20261015130000_staff_profile_anniversaries |
| 20261117152035 | 20261015210000_checkup_securite |
| 20261117152052 | 20261017200000_sorties_prevues |
| 20261117152056 | 20261020150000_remove_alezan_name_vote |
| 20261117152101 | 20261020190000_app_push_notifications |
| 20261117152104 | 20261020193000_admin_managed_app_notifications |
| 20261117152108 | 20261020200000_multi_tier_app_notifications |
| 20261117152111 | 20261020203000_notification_retention_and_approval_cleanup |
| 20261117152114 | 20261020210000_challenge_received_notifications |
| 20261117152118 | 20261022120000_activity_duplicate_strava_review |
| 20261117152139 | 20261022130000_timeline_distance_milestone_overrides |
| 20261117152143 | 20261025140000_lien_groupe_whatsapp |
| 20261117152146 | 20261026100000_create_public_proofs_bucket |
