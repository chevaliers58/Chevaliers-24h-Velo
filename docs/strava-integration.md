# Intégration Strava

## Ce que prépare cette branche

- Le profil peut lancer une autorisation Strava OAuth avec le scope minimal `activity:read`.
- Les jetons d’accès et de renouvellement restent dans `strava_connections`, table sans accès navigateur.
- Le webhook vérifie le jeton de souscription, accuse réception rapidement, puis traite les événements en arrière-plan.
- Les activités prises en charge sont importées une seule fois grâce à l’identifiant Strava unique. Les activités supprimées ou rendues privées sont retirées de la copie du site.
- Le bouton public de l’accueil doit être configuré avec le lien du club de votre troupe.

## Configuration Chevaliers 58

Créer une nouvelle application API Strava pour Chevaliers 58 ; ne pas réutiliser les identifiants ni les jetons de l'ancienne troupe. Définir dans les secrets Supabase :

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI` = `https://qxlsdauqoivqhoojlrwk.supabase.co/functions/v1/strava-oauth`
- `STRAVA_WEBHOOK_VERIFY_TOKEN` = une valeur aléatoire longue
- `STRAVA_WEBHOOK_SUBSCRIPTION_ID` = l’identifiant obtenu à la création de la souscription
- `SITE_URL` = `https://19-58.net/velo`

Dans le tableau de bord Strava, déclarer comme callback OAuth l'URL `https://qxlsdauqoivqhoojlrwk.supabase.co/functions/v1/strava-oauth`. Enregistrer ensuite le webhook sur `https://qxlsdauqoivqhoojlrwk.supabase.co/functions/v1/strava-webhook` avec le même jeton de vérification, puis renseigner l'identifiant de souscription obtenu dans `STRAVA_WEBHOOK_SUBSCRIPTION_ID`. Déployer les fonctions `strava-oauth` et `strava-webhook` après configuration des secrets.

## Limites liées à Strava

Le lien vers le club promeut la communauté, mais ne donne pas au site accès aux activités des membres. Chaque scout doit associer son propre compte et autoriser l’accès. L’import automatique démarre à la réception des prochains événements ; cette première version ne récupère pas l’historique. Les activités accessibles par `activity:read` sont celles visibles par l’athlète et ses abonnés, selon les réglages de confidentialité Strava.

Une souscription Strava requiert une application API et une callback joignable. Tant que Strava n’a pas accordé l’accès demandé, le flux ne peut pas être activé. Ne jamais ajouter le secret client ou des jetons dans le dépôt.
