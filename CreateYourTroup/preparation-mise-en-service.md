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
- Le premier essai local Pages confirme les routes, les ressources et huit parcours navigateur sous `/velo/` ; le paquet est préparé via `npm run build:pages` (`.output/pages`). L'export PDF depuis l'interface a également été testé avec succès (run 44094675118) ; aucun service externe n'a été contacté depuis le navigateur de test. Si le serveur Node actuel est nécessaire, choisir un hébergement compatible ou un adaptateur Cloudflare vérifié. Aucun lien DNS, Worker ou routage de production n'est créé ici.
- Avant de connecter le domaine, identifier le gestionnaire du site existant. Un domaine seul ne peut pas être assigné à une application indépendante pour un chemin sans routage approprié ; demander une preuve d'accès et un accord explicite avant toute modification.
- Les URL Auth de redirection et le secret serveur SITE_URL doivent correspondre à l'URL effective. Ne pas utiliser de redirection générique vers des domaines non contrôlés.

## Services optionnels

- Le lien manuel Strava et le club ne nécessitent pas de webhook.
- Ne pas activer l'import automatique Strava avant la vérification de l'autorisation de partage des données dans le classement et la configuration de la nouvelle application API. Les secrets sont fournis dans le tableau de bord du projet, pas dans le code.
- Notifications : les clés VAPID propres au nouveau projet et Resend sont à configurer si les services sont utilisés. L'inscription et l'envoi réels, le mail de vérification et les réinitialisations de mot de passe doivent être essayés sur l'environnement cible avant ouverture.
- Le test du ménage a réussi dans une instance locale isolée (44096972619, seuils de 30/60/7 jours et protection des références). Sur le projet distant, vérifier d'abord l'aperçu, puis uniquement des données de test désignées ; ne pas supprimer de données réelles lors de la préparation.

## Point de contrôle

La PR de consolidation reste brouillon. La compilation et les tests SQL sont nécessaires mais ne prouvent pas la disponibilité du site réel. Valider les tests navigateur, les fichiers exportés, les scénarios de rétention, le routage et les identifiants du projet avant une installation finale. Aucune fusion ni migration distante ne doit être effectuée sans accord explicite.

## Séquence de mise en service proposée (sans exécution)

Contrôle en lecture seule du 17 novembre 2026 : le projet cible est actif, en PostgreSQL 17, région eu-central-1. Les listes de tables publiques, migrations et fonctions Edge sont vides. Ce contrôle ne prouve pas l'absence de tout objet dans les autres schémas ; revérifier avant d'écrire.

1. Vérifier les résultats CI sur un commit identifié, puis obtenir l'accord explicite pour initialiser le projet cible uniquement. Aucun accès au Supabase source. Garder la PR brouillon et ne pas fusionner main à cette étape.
2. Contrôler les paramètres Auth (confirmation des adresses, SMTP, durée de session, redirections) et les fonctions Edge. Les migrations planifient trois tâches cron, qui doivent pointer vers les fonctions du projet cible ; la clé cron est générée dans le schéma privé à l'installation, jamais copiée dans Git. Ne pas laisser les tâches actives avec une configuration incomplète ; vérifier le comportement après déploiement. Les intégrations non configurées ne doivent pas envoyer d'email ou importer de sorties.
3. Appliquer les migrations existantes dans l'ordre, en confirmant les résultats et l'historique avant de poursuivre ; aucune importation de données. Vérifier les tables, RLS, vues, droits, buckets et conseillers de sécurité sur le projet cible. Arrêter en cas d'erreur plutôt que réinitialiser la base distante.
4. Préparer un build distinct pour une prévisualisation autonome avec le seul identifiant public du projet cible. Variables publiques : VITE_SUPABASE_PROJECT_ID=qxlsdauqoivqhoojlrwk, VITE_SUPABASE_URL=https://qxlsdauqoivqhoojlrwk.supabase.co, VITE_SUPABASE_PUBLISHABLE_KEY (clé publique du projet), VITE_TROOP_NAME=Chevaliers 58, VITE_BASE_PATH=/velo/, VITE_SITE_URL (URL effective avec /velo), VITE_TROOP_STRAVA_CLUB_URL=https://www.strava.com/clubs/Chevaliers58. Node 22 ; commande npm run build:pages ; sortie .output/pages. Ne pas utiliser l'artefact CI avec clé factice comme version réelle.
5. Configurer SITE_URL côté Edge et les URL autorisées Supabase Auth : origine effective et chemin /velo/ ; récupération /velo/nouveau-mot-de-passe. Distinguer l'URL de prévisualisation de l'URL finale. Aucun token secret dans VITE ni le paquet statique.
6. Demander au responsable de créer et confirmer le compte administrateur prévu. Vérifier son UUID dans Auth ; bootstrap du rôle par le script réservé au propriétaire. Aucun mot de passe transmis dans le chat. Renseigner les patrouilles et dates confirmées, puis réaliser les essais de compte, récupération, droits, preuves et fichiers avec des données de test explicites.
7. Décider avant l'ouverture de la visibilité des photos et GPX, notamment des traces courtes qui peuvent conserver les points d'origine et des métadonnées GPX. Les choix d'origine n'ont pas été changés. Expliquer que la lecture publique par URL n'est pas une authentification. L'import automatique Strava reste à activer uniquement si son usage est autorisé ; envoyer les notifications réelles uniquement avec configuration consentie.
8. Confirmer le domaine de prévisualisation, puis le raccordement de /velo auprès du gestionnaire de 19-58.net. Ne jamais rediriger la racine du site d'unité. Fusionner et publier uniquement après accord et validation de l'environnement cible. Personnaliser les couleurs après validation fonctionnelle.

### Résultats techniques de cette étape

- Build 44098927420 : 0 erreur TypeScript, 0 erreur lint (11 avertissements), 0 vulnérabilité npm détectée. Contrôle 44098947641 : installation des 57 migrations et tests d'itinéraires prévus/WhatsApp/seuil d'alerte réussis. Contrôle 44098947682 : rétention réussie sur six groupes de scénarios. Le run navigateur 44098947613 confirme les neuf parcours et le GPX multi-segments stocké ; l'étape PWA a été interrompue par une navigation dans le test, corrigée dans 375302b. Les tests supplémentaires des règles historiques sont expérimentés dans test/chevaliers58-secondary-rules. Ne pas compter la livraison de mails, le push, le webhook Strava, ni une installation physique sur smartphone comme validés.
