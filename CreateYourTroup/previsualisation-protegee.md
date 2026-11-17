# Prévisualisation protégée — Chevaliers 58

Branche dédiée : preview/chevaliers58-vercel. Cette préparation n'ouvre pas un site en ligne. Le Supabase cible a été initialisé le 17 novembre 2026 ; voir initialisation-supabase-2026-11-17.md. La production et le domaine de l'unité sont inchangés.

## Hébergement

Vercel est proposé parce que son authentification de déploiement permet de limiter l'accès à une prévisualisation. Attendre la connexion au compte du responsable avant toute création/déploiement. Ne pas connecter/importer automatiquement main (version historique non consolidée) ; créer un projet de prévisualisation séparé, sans déploiement de production, puis sélectionner explicitement cette branche et la cible Preview. Activer Deployment Protection / Vercel Authentication **avant tout déploiement**, pour toutes les URL si disponible ; au minimum les URL de preview, jamais utiliser un domaine de production non protégé. Vérifier la protection via une fenêtre privée non connectée, sans partager de jeton de contournement. Si le contrôle d'accès ne peut être confirmé, ne pas déployer contre le Supabase réel. Voir https://vercel.com/docs/deployment-protection.

Configuration préparée : Node 22 (à sélectionner dans le projet), npm ci, build statique .output/pages, liens profonds explicites sous /velo, en-têtes de sécurité et noindex. Le script refuse une cible non Preview et toute clé factice/privée ; il ne prouve pas à lui seul que la protection hébergeur est activée. VITE_SUPABASE_PUBLISHABLE_KEY (clé publique moderne du projet) à renseigner uniquement dans l'environnement Preview, via console sécurisée ; aucune clé réelle inscrite dans Git. Les autres variables sont renseignées par le script. VITE_SITE_URL utilise VERCEL_URL par défaut ; préférer une URL preview stable et autorisée si disponible. Aucun token administrateur, service_role, secret VAPID ou Resend dans le frontend.

## Après obtention d'une URL protégée

- Régler les URL Auth (URL effective avec /velo, redirection exacte /velo/nouveau-mot-de-passe) et SITE_URL côté fonctions Edge. Ne pas utiliser de wildcard couvrant tous les sites vercel.app. Le connecteur Supabase actuel ne fournit pas les opérations de configuration Auth/secrets ; ces changements pourront nécessiter la console du responsable.
- Vérifier /velo/, accès direct /velo/auth, ressources, manifeste, SW, /velo/scout/... et redirections hors mode app. Vérifier depuis un navigateur non connecté que la protection hébergeur fonctionne.
- Utiliser uniquement des comptes et preuves fictifs désignés. Le contrôle hébergeur ne ferme pas à lui seul l'API Supabase ni le bucket de preuves public ; ne pas publier de données de mineurs avant décision sur adhésion, accès et GPX/photos. Aucun compte réel ni clé privée n'est à transmettre dans le chat.
- Configurer les services optionnels ultérieurement ; maintenir les trois cron en pause. Ne pas déployer Strava automatique.
- Premier admin : créer/confirmer le compte dans le contexte prévu, puis bootstrap selon le guide et accord. Tester les autorisations, saisies, export, carte, notifications si activées et appareils réels. Avant toute ouverture publique traiter les alertes de sécurité et les règles de confidentialité.

État : configuration et procédure prêtes, aucune URL en ligne ni protection vérifiée ; déploiement bloqué par l'absence de connexion à un hébergeur. Ne pas utiliser les artefacts de CI contenant la clé factice pour une démonstration reliée à la base. Ne pas exécuter db push (historique distant différent, journal d'initialisation).
