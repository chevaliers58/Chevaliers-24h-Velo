# Mise en service notifications — 19 novembre 2026
- Edge app-notifications v7 active ; alias VAPID du responsable, contrôle cryptographique, CORS origine Cloudflare, liens push avec préfixe /velo/, exclusion des suspendus, alertes staff génériques.
- HTTP 200 au contrôle public-key, origine correcte ; aucune valeur secrète lue ou publiée.
- Migration live 20261119135815 collective_ride_notifications : source supabase/staged/collective_ride_notifications.sql. Test création/annulation avec membres approuvés et exclusion des non-confirmés, aucune donnée test conservée (rollback). Ne pas rejouer la migration.
- Les modifications des noms de patrouilles, catégories et barème restent sur intégration. Aucune modification de ces données.
- Corrige le test de branding CI : autorisation strictement limitée à la signature choisie dans SiteHeader.tsx, autres contrôles inchangés.
- Test smartphone : ouvrir PWA, se connecter, Plus > Notifications > Activer ; envoyer un message individuel depuis Administration > Notifications et vérifier la réception hors application et le clic. Ne pas annoncer la livraison réelle avant essai.
