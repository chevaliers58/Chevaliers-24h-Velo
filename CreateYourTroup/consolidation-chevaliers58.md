# Consolidation Chevaliers 58 — 17 novembre 2026

Cette branche part du dernier commit de la PR #1 (dc18029). La PR #2 (641b89a) constitue la deuxième source de corrections ; aucune des branches d'origine n'est écrasée. Aucun déploiement ni migration distante n'est autorisé à ce stade.

## Décisions de fidélité
- Site de référence : https://alezan42-cycling.pages.dev ; URL cible : https://19-58.net/velo ; club : https://www.strava.com/clubs/Chevaliers58.
- Conserver les migrations de la PR #1 et les auditer ; ne pas repartir du guide historique incomplet.
- Conserver les buckets en lecture publique par URL comme dans l'original, avec les politiques d'écriture existantes. Ce mode comporte un risque de divulgation si des URL de photos ou GPX circulent.
- Conserver la photo de preuve 30 jours après validation, le GPX, les km et le ménage automatique. Ne pas reprendre approveActivity de la PR #2, qui efface immédiatement la photo.
- Conserver le routage /velo, le widget, le PWA, les textes et les fonctionnalités ; toute adaptation visuelle est différée.
- Aucun compte ni donnée source transféré. Premier admin : compte créé et vérifié avant attribution de rôle, sans privilège automatique par adresse.

## Première étape
- Utiliser la validation stricte de la clé publique issue de la PR #2, sans client factice.
- Diagnostic en lecture seule avec les variables publiques, adapté aux vues publiques.
- Conserver le workflow de la PR #1 (SQL, Deno, build, smoke test /velo, scripts navigateur), ajouter le lint consultatif et le déclenchement sur cette branche.

## Restant
- Réconcilier les changements liés entre eux : AuthContext, database.ts et tous les appels locaux, formulaires, écrans, services et Vite ; conserver la protection contre la révocation de son propre rôle admin.
- Vérifier l'attribution des patrouilles et du Staff (les métadonnées d'inscription sont modifiables par l'utilisateur).
- Examiner les fonctions Edge et les migrations dans l'ordre, y compris les privilèges des fonctions appelées par RLS ; contrôler les seeds, les cron et les règles de conservation. Aucun test SQL réel effectué à ce stade.
- Corriger les erreurs de lint et de types, tester les scénarios en environnement isolé, valider l'hébergement /velo.
- Demander l'accord avant d'appliquer le schéma nouveau projet, et avant fusion dans main.

Ce document est un suivi de travail, pas une validation de la migration.

## Deuxième étape — corrections et installation à blanc

- Lint sur le commit cbf97af : 0 erreur, 11 avertissements ; compilation et smoke test /velo réussis. Lint désormais bloquant pour les erreurs.
- Inventaire structurel des 57 migrations : les migrations de l'ancien vote doivent ignorer les tables absentes (fonctionnalité supprimée ensuite). Les migrations sont encore à tester réellement.
- Attribution d'admin par email : rechercher auth.users avec adresse vérifiée plutôt que profiles.email, modifiable par l'utilisateur. Protection de la révocation de son propre rôle dans la base, pas seulement dans l'interface.
- Nouveau workflow de test isolé avec une instance PostgreSQL 17 locale, sans jeton distant, et réécriture des trois URL cron dans la copie de test. Le smoke test couvre les tables/RLS, Storage, Auth et droits admin. Aucun accès au projet Supabase distant.
- Le choix de patrouille Staff à l'inscription est hérité du site original. Ce choix ne doit jamais conférer un rôle admin. Il reste à vérifier les autres droits accordés par les fonctionnalités Staff et à documenter les implications.
- npm audit signale 10 vulnérabilités (8 modérées, 2 élevées), à qualifier séparément.

## Troisième étape — base vierge et sécurité Strava

- Les 57 migrations et le test de permissions ont réussi sur Supabase local dans le run 44072278400 (commit 3cc8c02), sans contacter le projet distant.
- La provenance automatique Strava est désormais réservée aux écritures serveur. Les liens soumis manuellement gardent leur comportement historique.
- Les événements Strava entrants doivent être authentifiés par leur signature HMAC et horodatage (fenêtre 5 minutes). Le secret serveur STRAVA_WEBHOOK_SIGNING_SECRET sera requis avant activation du webhook, à obtenir via la configuration Strava ; aucune valeur n'est stockée dans GitHub. Les règles de validation OAuth, l'identifiant de souscription et les tests réels restent à vérifier lors de l'activation.
- Les workflows collectent les résultats npm audit (dont production) et les contrôles TypeScript des cinq fonctions Edge. Aucune modification de dépendance automatique ou forcée.
- Les tests opérationnels des connexions à Strava, de l'envoi d'emails et des notifications nécessitent encore une configuration réelle. La base distante n'est pas modifiée.

- Contrôles SQL étendus (provenance Strava) réussis dans le run 44073753135 ; test de signature réussi dans le run 44073971253. L'audit npm distingue deux vulnérabilités de production (Seroval et Zod) des huit alertes liées aux dépendances de développement. Les mises à jour majeures doivent être validées séparément.
- Protection des serveurs push : seuls les domaines HTTPS des services de notification usuels (Google, Mozilla, Apple, Microsoft) sont autorisés, à l'enregistrement comme à l'envoi. Les services atypiques éventuels sont à examiner séparément. Le contrôle des fonctions Edge est étendu à leurs dépendances Deno isolées.

- Validation des sorties : le déclencheur historique qui écrasait le choix de statut de l'administrateur est remplacé par la règle consolidée ; le serveur conserve l'exigence de preuve et vérifie que les liens sont dans les domaines Strava déjà acceptés par le formulaire. Les soumissions manuelles par photo ne réutilisent plus un lien restant dans l'autre onglet. Tests supplémentaires : photo scout en attente, photo admin validée, rejet du lien hors Strava et de l'absence de preuve.

## Quatrième étape — dépendances et diagnostics TypeScript

- Essai isolé dans la branche test/chevaliers58-dependency-upgrades (run 44088656503) : Vite 8.3.8, Zod 4.6.7, Seroval 1.8.1, TypeScript ESLint 8.73.0 et minimatch 11.0.9. Mise à jour ciblée, sans npm audit fix --force. Aucun audit npm restant (production et développement), lint, build et smoke test /velo réussis.
- Comparaison des diagnostics TypeScript dans le run 44089192925 : 172 erreurs strictes avant et après, aucun nouveau diagnostic. Les anciennes définitions de tables et plusieurs hypothèses sur les valeurs optionnelles doivent être corrigées. Le build Vite ne constitue pas une vérification TypeScript complète.
- Les deux fichiers JSON intégrés sont exactement ceux produits dans l'essai, dont les empreintes Git ont été vérifiées. Le schéma TypeScript Supabase sera régénéré à partir d'une base locale reconstruite par les 57 migrations.
- L'API Strava a des conditions d'utilisation mises à jour le 1er juin 2026 (https://www.strava.com/legal/api et https://www.strava.com/legal/api_policy), notamment concernant le partage des données d'activités et les compétitions. Le code d'intégration reste en place, mais ne pas activer les imports automatiques alimentant des classements publics avant confirmation de la compatibilité de cet usage avec Strava. Les saisies manuelles et le lien vers le club restent distincts.
