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

## Sixième étape — rétention

- Le ménage ignore les URL externes et les références de fichier ne correspondant pas au propriétaire, protège les fichiers toujours référencés ailleurs (y compris les GPX), conserve une référence après un échec de suppression ou un report dû au plafond de traitement, refuse les corps JSON invalides, et arrête les suppressions Storage en cas d'échec de l'inventaire. Les durées 30/60/7 jours restent identiques. Les timestamps de conservation ne sont plus manipulables par les clients. Les écritures simultanées au ménage restent à vérifier ; l'inventaire Storage n'est pas une transaction atomique avec la base.
- Vérification fonctionnelle isolée à préparer : aperçu, refus d'accès, vieillissement contrôlé des sorties et fichiers, suppression et réexécution. Aucun appel distant.

- Test de rétention 44096972619 réussi : vrai handler Deno, base Auth/PostgreSQL/PostgREST et Storage locaux ; données synthétiques uniquement. Six groupes de scénarios réussis : autorisations et requêtes invalides, aperçu sans écriture, échéance 30 jours (km/sport/date/GPX conservés), protection des fichiers partagés et d'un autre propriétaire, échéances 60 et 7 jours avec conservation des éléments récents, groupes/compteurs/journal admin et relance idempotente. Le run 44096539928 a confirmé les 57 migrations et le verrouillage des timestamps, 44097117809 le lint, les types stricts, le contrôle Deno et le build après correction de format. Le scénario est ajouté aux tests de régression de la PR. Le test utilise la fonction Deno en local et ne simule pas la livraison du mail d'alerte, ni les appels planifiés dans l'hébergement distant. Les suppressions Storage et les mises à jour en base ne sont pas atomiques entre elles ; une suppression concurrente à un partage de fichier peut rester un cas limite.

## Septième étape — PWA et GPX

- Cache du service worker limité à /velo (version v2), navigation de notification limitée aux fenêtres de l'application ; pas de mise en cache des ressources du site d'unité hors de ce chemin. Test navigateur ajouté pour le manifeste, le scope, les icônes et le shell en cache. L'installation sur appareil iOS/Android physique et la livraison push restent à confirmer.
- Un seul helper GPX pour les enregistrements et les propositions de parcours. Rognage 200 m des points aux extrémités sans déplacer les points entre segments ni assimiler un saut entre segments à une distance parcourue ; rejet des fichiers XML manifestement invalides. Le test navigateur utilise une trace fictive à deux segments et vérifie le fichier stocké. Le secours historique des traces trop courtes et les autres métadonnées GPX (points de passage, extensions) restent un risque de localisation ; ne pas modifier le partage public sans décision explicite.

- Résultats du 17/11/2026 : 44099918477 build réussi (strict TypeScript, lint sans erreur, audit npm, Edge, paquet Pages), 44099931690 base neuve + sorties prévues + WhatsApp + seuil alerte réussis, 44099931845 ménage réussi. 44099931621 : les neuf parcours navigateur initiaux, envoi d'un GPX multi-segments rogné, manifeste/PWA mobile simulée/service worker/cache/icônes et accès statique réussis. Le run isolé 44100254905 valide huit groupes supplémentaires : peloton, marche, date de début, corrections, anniversaires, scout sportif du mois, thèmes fêtes et thèmes saisonniers. Les tests historiques ont été adaptés uniquement pour fournir des preuves fictives et un helper temporaire autorisé ; tous sont exécutés avec rollback dans la base de test. Leurs fichiers vérifiés sont intégrés à la CI. Supabase cible toujours sans table publique, migration ni fonction Edge au contrôle en lecture seule. Prérequis de mise en service documentés ; aucune migration, fusion, activation ni mise en ligne distante.

## Huitième étape — changement rapide de compte (17 novembre 2026)

- Point de reprise : c461828f, PR #3 brouillon. Build 44101008044, SQL 44101008207 et ménage 44101007850 réussis ; navigateur 44101008033 encore en cours lors de la consultation. Les essais précédents 44099931621 (11 contrôles navigateur) et 44100254905 (règles métier) sont documentés ci-dessus.
- AuthContext : invalidation des réponses profil/rôle asynchrones par identité et version, à la déconnexion, au changement d'identité et au démontage. INITIAL_SESSION via onAuthStateChange évite la course avec getSession ; requêtes différées hors callback Auth. RLS et base inchangées. Référence : https://supabase.com/docs/reference/javascript/auth-onauthstatechange.
- Scénario navigateur ajouté : retarder une réponse réelle de rôle admin sur Supabase jetable, changer de compte dans la même page, puis délivrer cette réponse et vérifier que l'accès admin reste refusé. Correction et scénario à valider par la CI du nouveau commit. Ne pas les compter comme validés avant résultat.
- Aucun secret ni compte réel modifié, aucune migration distante, fusion ni mise en ligne. Prochaine reprise : vérifier la CI du dernier commit, corriger tout échec, puis compléter les parcours secondaires d'interface. Dates, visuels, confidentialité et mise en service restent à valider explicitement.

- Le run navigateur précédent 44101008033 a finalement échoué : les dix contrôles jusqu'au PDF ont passé, puis l'URL de script du service worker était undefined lors d'une deuxième lecture, après un premier contrôle de son activation. Le test contrôle maintenant dans une même attente (30 s) l'état activated, le scope /velo/ et l'URL /velo/sw.js. Ce changement stabilise le test sans changer le service worker lui-même ; résultat de la nouvelle CI requis. Le run 44102386374 a été déclenché pour le premier correctif Auth, puis nouveau commit pour le contrôle PWA. Consulter les runs du dernier SHA ; ne pas assimiler l'enregistrement du correctif à un test réussi.

## Neuvième étape — extension des tests navigateur (branche d'essai)

- Point de départ e6839ce. Build 44102578423, base neuve 44102578516 et ménage 44102578349 réussis, dernier navigateur 44102578441 encore en cours au contrôle. La branche test/chevaliers58-secondary-browser préserve les workflows actifs de la PR #3 jusqu'à leur fin.
- Le parcours de changement de compte précédent contenait une faiblesse : la connexion redirige avec window.location.href et peut détruire le document où la réponse était retardée. Le scénario utilise maintenant deux onglets d'un même contexte navigateur et vérifie la réponse admin authentique, les événements de session, le profil du nouveau scout et la non-réapparition du lien admin après libération de la réponse. Un marqueur de document vérifie l'absence de rechargement de l'onglet observé.
- Nouveaux parcours : édition de profil et persistance après navigation, proposition de sortie et inscription automatique du créateur, réponse d'un second membre, lecture des champs du téléchargement .ics, refus de la route privée à un invité, création d'un souvenir par l'admin et lecture par un visiteur. Données uniquement fictives, aucune intégration réelle. Ces scénarios sont préparés et **non encore validés** par le navigateur. Ne pas déclarer les tests réussis avant les résultats.
- Prochaine étape : vérifier le navigateur sur la PR #3, transférer les tests depuis la branche d'essai sans écraser une modification concurrente, exécuter les workflows et corriger les éventuelles régressions. Aucun changement de base ou de mise en service.

- Vérification finale e6839ce : les quatre workflows ont réussi (build 44102578423, SQL 44102578516, rétention 44102578349, navigateur 44102578441). Les logs du navigateur confirment BROWSER_SMOKE_OK, dont GPX, export PDF, service worker et ancien scénario Auth. L'ancien scénario ne prouvait pas formellement la conservation du document ; le scénario à deux onglets doit donc être validé séparément. Les nouveaux tests sont intégrés à la branche de consolidation uniquement après cette vérification. Aucune fusion dans main.

- Le build 44103702447 du SHA 8709b057 a signalé une seule erreur bloquante de format Prettier dans l'assertion du marqueur HTML du scénario Auth (ligne 406), plus 12 avertissements non bloquants. Correction du format sans changement fonctionnel. Le nouvel avertissement React sur requestVersion.current mérite d'être documenté : le compteur mutable doit précisément être invalidé au démontage, ce n'est pas une référence à un élément DOM.
- Revue additionnelle en lecture seule : les clés React Query du classement et des données app ne distinguent pas les sessions, alors que profiles_public masque différemment certains noms selon l'authentification. Le cache WhatsApp utilise une clé globale et la carte ne refuse pas explicitement userId absent. Les notifications et les corrections locales méritent une isolation de leur état entre utilisateurs. Ne pas considérer cette revue comme une correction : préparer des tests et un changement ciblé, sans modifier les règles RLS ni le partage des preuves.

## Dixième étape — isolation des données par session (branche d'essai)

- La vue profiles_public restitue un nom complet aux membres connectés lorsque le totem est absent, et seulement prénom + initiale aux visiteurs. Les caches de classement et de données PWA utilisent désormais l'identité Auth dans leur clé, attendent l'initialisation Auth et abandonnent le cache inactif. Le composant du classement est remonté lors du changement d'identité pour ne pas conserver un détail de classement ouvert ni une réponse tardive dans son état local. Les préfixes d'invalidation React Query sont conservés.
- Le lien WhatsApp a une clé de cache par utilisateur et le composant est absent sans identité ; son état d'édition est remonté lors du changement d'utilisateur. Les états des notifications et des avis de correction sont également remontés par UUID, afin qu'une réponse tardive à un ancien composant ne s'affiche pas sur le nouveau compte. Les opérations push en cours et les autres écrans privés restent à examiner séparément : ce correctif n'est pas un audit complet des sessions.
- Scénario de régression étendu dans l'onglet observé : attendre le nom complet d'un compte fictif connecté sans totem, puis vérifier « Admin T. » et l'absence du nom complet après déconnexion, avant de reconnecter le scout et de libérer une réponse admin retardée. Les permissions RLS, les vues SQL, le stockage et les règles de partage n'ont pas été modifiés. Documentation Supabase : https://supabase.com/docs/reference/javascript/auth-onauthstatechange.
- Branche test/chevaliers58-session-isolation, à intégrer seulement après résultats des tests du SHA 6b0791e5 et validation de l'absence de modifications concurrentes. Le nouveau code et le scénario ne sont pas encore validés par CI. Aucun changement distant Supabase ou déploiement.

- Relecture avant intégration : une session déjà identifiée peut charger les vues publiques même lorsque le profil ou le rôle admin est retardé ; seule la requête anonyme est bloquée pendant l'initialisation Auth. Ceci évite un blocage du scénario de réponse admin retardée et un écran vide pour les membres. Les clés restent isolées par identité.

- Résultat confirmé sur 6b0791e5 : build 44104345013, SQL 44104344964, ménage 44104345055 et navigateur 44104345014 réussis. Les logs du dernier run contiennent BROWSER_SMOKE_OK et les 15 contrôles fonctionnels, dont modification de profil, sorties prévues avec réponses/ICS, timeline, changement de compte entre deux onglets sans rechargement du document et PWA. Le correctif de séparation des données est désormais le prochain changement à tester dans la PR #3 ; ne pas présumer son résultat.

- Le contrôle 44105152417 a signalé une erreur de formatage Prettier sur la clé du détail de classement, corrigée selon le format exigé. Le navigateur 44105152107 est encore en cours au contrôle ; ne pas confondre le résultat du build et le résultat fonctionnel.
