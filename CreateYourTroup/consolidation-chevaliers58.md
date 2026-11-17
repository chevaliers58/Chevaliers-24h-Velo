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
