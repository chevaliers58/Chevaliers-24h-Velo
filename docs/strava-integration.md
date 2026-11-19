# Strava : mode manuel uniquement

Décision du responsable des Chevaliers 58 (17 novembre 2026) : l'import automatique Strava n'est pas nécessaire. Le site conserve la saisie des kilomètres et le lien de preuve Strava saisis par le scout, le lien de profil en option et le lien public du club. Les photos et GPX restent disponibles selon les règles historiques.

## Mise en service

- Ne pas créer d'application API Strava, configurer de secrets STRAVA_*, ni enregistrer de webhook.
- Les deux handlers historiques `strava-oauth` et `strava-webhook` répondent désormais HTTP 410 sans accès aux services ou à la base. Ne pas les déployer. Aucun bouton d'association OAuth dans le profil.
- Les 57 migrations existantes sont conservées pour garder l'installation reproductible. Les structures OAuth privées et les champs de provenance sont inactifs côté application ; aucune donnée ni jeton ne doit y être ajouté. Le contrôle RLS historique continue d'interdire aux clients de falsifier une provenance serveur.
- Le test navigateur vérifie les liens saisis manuellement et l'absence d'association automatique. Les anciens handlers sont consultables dans l'historique Git antérieur à cette décision.

Ne pas réactiver cette intégration sans demande explicite et nouvel examen des conditions API et de la confidentialité. Cette décision ne vaut pas approbation des règles de visibilité des autres données.
