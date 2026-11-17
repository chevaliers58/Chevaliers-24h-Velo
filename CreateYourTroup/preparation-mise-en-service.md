# Préparation de la mise en service — Chevaliers 58

Cette procédure ne lance aucune action sur les services hébergés. Elle distingue les vérifications déjà effectuées localement et les décisions à valider avant la première ouverture.

## Base indépendante

- Projet cible : `qxlsdauqoivqhoojlrwk` ; vérifier l'identifiant et l'absence de données avant toute opération distante.
- Utiliser exclusivement les 57 fichiers de `supabase/migrations/` dans l'ordre. Ne pas exécuter l'ancien `supabase/supabase_setup.sql` ni le script de fixture.
- Ne pas reprendre les comptes, données, clés ou intégrations de la troupe source.
- Vérifier les droits, l'URL publique, les buckets `proofs` et `backgrounds`, la programmation du ménage, et les fonctions Edge du projet cible.
- Une fois la migration explicitement approuvée et terminée, vérifier la liste des migrations et les tables, puis effectuer les diagnostics distants en lecture seule.
- Ne jamais transmettre une clé privilégiée dans Git, les paramètres Vite, un navigateur ou une conversation.

## Identité et accès

- Nom : Chevaliers 58 ; application : défi des 24h vélo.
- Premier compte admin : créé dans l'application avec l'adresse prévue, puis confirmé par Auth ; attribuer le rôle au UUID réel. Aucune adresse ne donne les droits automatiquement.
- Patrouilles : uniquement la patrouille Staff amorcée. Les autres sont à renseigner par l'administrateur avant les inscriptions.
- Dates : les constantes héritées ne constituent pas une décision pour les Chevaliers 58. L'agenda de la 19e mentionne le week-end du 20 au 21 mars 2027 ; confirmer les dates de début du défi et l'échéance exacte de la 58e.
- Les preuves conservent la lecture publique par URL et la durée historique. Présenter à la troupe le risque de confidentialité (photos et trajets de mineurs) avant ouverture ; ne pas modifier les règles de partage sans décision.

## Hébergement

- Le projet vise `https://19-58.net/velo`. Cette URL partage un domaine avec un site existant : la migration ou le remplacement du site d'unité n'est pas prévu.
- Prévisualisation autonome en premier, avec une URL de test et le même préfixe `/velo` ; vérifier la navigation directe, les ressources, la PWA et les redirections Auth.
- L'hébergement statique Pages doit être testé avec les ressources correctement placées sous `/velo/`. Si le serveur Node actuel est nécessaire, choisir un hébergement compatible ou un adaptateur Cloudflare vérifié. Aucun lien DNS, Worker ou routage de production n'est créé ici.
- Avant de connecter le domaine, identifier le gestionnaire du site existant. Un domaine seul ne peut pas être assigné à une application indépendante pour un chemin sans routage approprié ; demander une preuve d'accès et un accord explicite avant toute modification.
- Les URL Auth de redirection et le secret serveur SITE_URL doivent correspondre à l'URL effective. Ne pas utiliser de redirection générique vers des domaines non contrôlés.

## Services optionnels

- Le lien manuel Strava et le club ne nécessitent pas de webhook.
- Ne pas activer l'import automatique Strava avant la vérification de l'autorisation de partage des données dans le classement et la configuration de la nouvelle application API. Les secrets sont fournis dans le tableau de bord du projet, pas dans le code.
- Notifications : les clés VAPID propres au nouveau projet et Resend sont à configurer si les services sont utilisés. L'inscription et l'envoi réels, le mail de vérification et les réinitialisations de mot de passe doivent être essayés sur l'environnement cible avant ouverture.
- Tester le ménage d'abord en aperçu, puis sur des données de test désignées ; ne pas supprimer de données réelles lors de la préparation.

## Point de contrôle

La PR de consolidation reste brouillon. La compilation et les tests SQL sont nécessaires mais ne prouvent pas la disponibilité du site réel. Valider les tests navigateur, les fichiers exportés, les scénarios de rétention, le routage et les identifiants du projet avant une installation finale. Aucune fusion ni migration distante ne doit être effectuée sans accord explicite.
