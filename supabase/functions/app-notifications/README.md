# Notifications push de l’application

La fonction envoie les notifications inscrites dans `app_notifications` et reçoit les abonnements PWA. Le rappel du dimanche (activable, horaire et contenu modifiables dans Administration → Notifications) et les paliers de kilomètres (1000 km par défaut, fréquence et message modifiables au même endroit) sont configurables par le staff. Les administrateurs reçoivent une notification à chaque nouvelle inscription. Aucun e-mail n’est envoyé et aucun fournisseur push tiers payant n’est nécessaire.

## Mise en service après application des migrations et déploiement

1. Générer une paire VAPID sur un poste de confiance avec `npx web-push generate-vapid-keys`.
2. Enregistrer les clés dans les secrets du projet Supabase (Dashboard → Edge Functions → Secrets ou Supabase CLI) :

   ```sh
   supabase secrets set SITE_URL="https://<votre-domaine>" VAPID_PUBLIC_KEY="<clé publique>" VAPID_PRIVATE_KEY="<clé privée>" VAPID_SUBJECT="mailto:<contact-de-la-troupe>"
   ```

   Garder la clé privée secrète. Le sujet peut être l’URL publique du site.

3. Appliquer toutes les migrations versionnées dans l'ordre (`supabase db push`) avant de déployer les fonctions. Les migrations de notifications créent les tables, réglages et tâches planifiées ; ne pas les appliquer isolément.
4. Déployer la fonction Edge mise à jour : `supabase functions deploy app-notifications`.
5. Dans l’application installée, chaque scout peut accepter l’invitation à activer les notifications ou utiliser la cloche. Le texte précise les types d’alertes : rappel du dimanche (si activé), paliers et messages ponctuels. Sur iPhone/iPad, il faut d’abord ajouter l’app à l’écran d’accueil ; l’autorisation doit être demandée depuis l’app installée.

Le service worker affiche les notifications et ouvre leur destination lorsque l’utilisateur appuie dessus. La clé publique est fournie à l’application par la fonction ; elle n’a pas besoin d’être intégrée au build du site.
