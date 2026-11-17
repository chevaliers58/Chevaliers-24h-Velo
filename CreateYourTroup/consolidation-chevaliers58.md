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

- Les types publics Supabase ont été générés sur l'instance locale (run 44089192925), puis formatés et testés avec les dépendances corrigées (run 44089657414). Lint, build et audit réussis. Les diagnostics TypeScript stricts passent de 172 à 108 ; ils restent distincts du lint. Le fichier généré est intégré sans retouche manuelle des types de tables.

- Les corrections strictes suivantes traitent les tableaux et dates potentiellement absents, les champs optionnels des classements, les comptes à rebours et les composants GPX sans changer les règles métier. Le client factice inutilisé est retiré, avec un contrôle d'absence de références au build. Un contrôle tsc strict est ajouté ; il devra devenir bloquant lorsque ses diagnostics seront à zéro. Attention : le comportement historique de secours des GPX très courts peut laisser l'intégralité du tracé accessible par URL ; à revoir avec l'accord de la troupe. L'audit npm ne couvre pas les scripts externes chargés par CDN (notamment jsPDF), qui restent à examiner.

- Le run 44091089407 du commit d6ba3f4 confirme zéro diagnostic TypeScript, zéro erreur lint (11 avertissements), zéro vulnérabilité npm détectée, cinq fonctions Edge vérifiées, tests de signatures et notifications réussis, build et smoke test /velo réussis. Le dernier client fictif serveur est supprimé : pas de simulation silencieuse lorsque les identifiants manquent. Le contrôle TypeScript est désormais bloquant. Les tests utilisateurs dans un navigateur avec une instance locale réelle restent à faire avant l'installation distante.

## Cinquième étape — essais en navigateur et PDF

- Branche de test navigateur test/chevaliers58-browser-validation, workflow 44092352034 : instance locale Supabase complète, données de test uniquement, demandes externes bloquées dans Chromium. Seule la copie de build temporaire accepte HTTP sur 127.0.0.1 ; la configuration de production reste strictement HTTPS. Scénarios inscription, connexion, contrôle accès admin, soumission manuelle et photo, validation, classement et CSV. Résultats à confirmer.
- jsPDF 2.5.2 et AutoTable 3.8.4 précédemment chargés depuis CDN sont remplacés par les dépendances npm épinglées jsPDF 4.2.1 et AutoTable 5.0.9, chargées à la demande. Aucun changement volontaire de mise en page ou de contenu PDF. Les anciennes versions comportent des avis de sécurité (https://github.com/parallax/jsPDF/security/advisories/GHSA-wfv2-pwc8-crg5). Essai 44092647708 : audit npm sans vulnérabilité détectée, lint, TypeScript, compilation et génération d'un PDF synthétique avec tableau réussis. Les empreintes des fichiers candidats sont vérifiées. L'export PDF depuis l'interface reste à tester.

- Premier parcours navigateur complet réussi (44092352034) : compte créé par le formulaire et profil enregistrés, connexion, accès admin interdit au scout, lien manuel approuvé, photo en attente stockée et accessible, validation admin avec conservation de la photo, classement à 20 km, téléchargement CSV. La confirmation d'email est simulée par le compte de test local si nécessaire ; aucun email réel ni service externe. L'essai additionnel a été bloqué par un conflit de port Docker sur le runner, pas par une erreur fonctionnelle. Ports et identifiants d'instance isolés dans la branche de test.
- Le fichier Google de vérification de propriété hérité du dépôt source n'a pas sa place dans le projet indépendant ; retrait du fichier public, sans impact sur les fonctionnalités du défi.
- L'agenda public publié par la 19e (https://19-58.net/news/22/) mentionne le week-end des 20–21 mars 2027 pour les 24h vélo ; ce n'est pas une confirmation de la date exacte du défi de la 58e. Ne pas modifier la date de début ou de fin sans validation de l'utilisateur.

- Essai d'hébergement statique local Cloudflare Pages (44093721188) : routes et ressources sous /velo, huit scénarios navigateur et contenu CSV vérifiés. Le test PDF suivant a échoué lors de la réouverture du dialogue (DOM détaché), avant le téléchargement ; scénario corrigé dans la branche de test, résultat encore à confirmer. Le paquet statique est intégré avec un contrôle CI, sans déploiement ni modification du site existant.

- Validation finale du test navigateur 44094675118 réussie : neuf scénarios avec le build Pages local (inscription, accès admin, sorties manuelles, photo, approbation, classement, CSV avec données et téléchargement du PDF), routes et ressources statiques /velo. Les fichiers d'export sont contrôlés, la preuve reste disponible après validation, et les ports des instances locales sont isolés. Le workflow et le script testés sont intégrés dans la PR de consolidation. Dernier build 44094882705 et contrôle SQL 44094882551 réussis également. Restent les autres écrans, le test de ménage avec des dates vieillies, l'email réel et les intégrations externes.
