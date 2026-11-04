# ⚜️ Créer son propre Défi Vélo Scout (Guide d'adaptation)

Ce projet est conçu pour être facilement réutilisable par n'importe quelle troupe scoute. En quelques minutes, tu peux cloner ce dépôt, le configurer pour ta propre troupe, changer les couleurs, lier ta propre base de données et définir tes administrateurs.

**Ce dont tu as besoin :**

| Outil | Pourquoi | Lien |
|---|---|---|
| Compte GitHub | Forker / cloner le code | [github.com](https://github.com) |
| Node.js 22 | Lancer l'application en local et le serveur de production | [nodejs.org](https://nodejs.org) |
| Compte Supabase (gratuit) | Base de données, authentification, stockage | [supabase.com](https://supabase.com) |
| Hébergement Node ou Cloudflare Workers | Héberger le site (adaptateur à valider selon l'hébergeur) | [Cloudflare Workers](https://developers.cloudflare.com/workers/) |

> 📚 Documents complémentaires :
> - [`database-schema.md`](./database-schema.md) : exemples historiques uniquement, ne pas exécuter.
> - [`code.md`](./code.md) : architecture technique et organisation du code.

---

## Étape 1 : Cloner le dépôt GitHub

1. Crée une copie ([Fork](https://docs.github.com/fr/get-started/quickstart/fork-a-repo)) de ce dépôt sur ton compte GitHub, ou clone-le directement.
2. Télécharge le code sur ton ordinateur et installe les dépendances :

   ```bash
   git clone <url-de-ton-repo>
   cd <nom-du-repo>
   npm install
   ```

---

## Étape 2 : Créer sa propre base de données (Supabase)

L'application fonctionne avec un backend cloud gratuit fourni par [Supabase](https://supabase.com).

1. Crée un compte gratuit sur le [Supabase Dashboard](https://supabase.com/dashboard).
2. Crée un **nouveau projet** (choisis une région proche de chez toi, par exemple *West EU*).
3. Lie le projet avec `supabase link --project-ref <project-ref>`, puis applique les migrations versionnées après revue et tests locaux (`supabase db push`). Les migrations créent les tables, règles RLS et le bucket `proofs`.
4. Vérifie dans Supabase que les tables métier, les politiques RLS et le bucket `proofs` ont bien été créés.
5. Récupère l'**URL du projet** et la **clé publishable** dans *Project Settings > API* ([documentation](https://supabase.com/docs/guides/api/api-keys)).

> ⚠️ N'utilise **jamais** la clé `service_role` dans le code du site : elle donne tous les droits et ne doit rester que côté serveur.

---

## Étape 3 : Configurer les variables d'environnement

À la racine du projet, duplique `.env.example` en `.env` et renseigne les valeurs du projet cible :

```env
VITE_SUPABASE_URL=https://ton-projet-supabase.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=ta-cle-publishable
VITE_SUPABASE_PROJECT_ID=ton-project-ref
VITE_TROOP_NAME=Chevaliers 58
VITE_SITE_URL=https://19-58.net/velo
VITE_BASE_PATH=/velo/
VITE_TROOP_STRAVA_CLUB_URL=https://www.strava.com/clubs/Chevaliers58
```

- Le préfixe `VITE_` est obligatoire pour que [Vite](https://vite.dev/guide/env-and-mode) expose ces variables au site.
- Le fichier `.env` ne doit **pas** être commité sur GitHub (vérifie qu'il figure dans `.gitignore`).

---

## Étape 4 : Personnaliser la charte graphique (les couleurs)

La direction artistique (bruns, orange, tons bois et scouts) est centralisée dans les variables de style [Tailwind CSS](https://tailwindcss.com).

1. Ouvre le fichier de style principal (par exemple `src/index.css` ou `src/App.css`).
2. Modifie les variables de couleurs (`--primary`, `--background`, etc.) pour correspondre aux foulards et à la charte graphique de ta troupe.

Pour t'aider à choisir et nommer tes couleurs :
- [Tailwind CSS : personnaliser les couleurs](https://tailwindcss.com/docs/colors)
- [Tailwind CSS : thème et variables](https://tailwindcss.com/docs/theme)

Pense aussi à adapter les textes visibles (nom de la troupe, titre du défi, logo, favicon) dans les fichiers de `src/routes/` (notamment `index.tsx`) et dans `index.html`.

---

## Étape 5 : Configurer son compte Administrateur

1. Lance l'application en local :

   ```bash
   npm run dev
   ```

2. Crée un compte utilisateur directement depuis l'application, sur la page de connexion (`/auth`).
3. Après avoir créé ton compte sur `/velo/auth`, remplace l'adresse dans `supabase/bootstrap_admin.sql` puis exécute ce script une seule fois dans le SQL Editor du nouveau projet. Il attribue le rôle `admin` au premier compte sans privilège codé en dur.
4. Connecte-toi : tu as maintenant accès au panneau d'administration (`/velo/admin`) pour :
   - créer tes propres patrouilles (ex : Renards, Faucons, Libellules) ;
   - valider ou refuser les sorties déclarées ;
   - gérer les comptes à rebours de ta troupe.

---

## Étape 6 : Déployer le site

Le build actuel utilise Nitro avec le preset `node-server`. Pour un hébergement Node :

```bash
npm ci
npm run build
npm run start
```

Le serveur écoute sur le port fourni par l'hébergeur et sert l'application sous le préfixe `/velo/`. La configuration Cloudflare Workers n'est pas encore intégrée ; ne pas publier `.output/public` comme un site Pages statique sans avoir validé le routage SSR et les ressources.

Consulte la section « Mise en ligne » du [README principal](../README.md) avant de choisir l'hébergeur. Renseigne toutes les variables de build de `.env.example` dans sa configuration.

Dans Supabase → Authentication → URL Configuration, définir *Site URL* sur `https://19-58.net/velo` et autoriser `https://19-58.net/velo/**`.

---

## ✅ Checklist finale

- [ ] Dépôt forké et dépendances installées
- [ ] Projet Supabase créé et toutes les migrations versionnées appliquées
- [ ] Bucket `proofs` créé par les migrations
- [ ] Fichier `.env` renseigné (et absent de GitHub)
- [ ] Identité Chevaliers 58 et couleurs bleu/orange vérifiées
- [ ] Compte admin créé et rôle attribué via `supabase/bootstrap_admin.sql`
- [ ] Patrouilles et compte à rebours créés depuis `/admin`
- [ ] Site déployé avec les variables d'environnement
- [ ] URL `https://19-58.net/velo/**` ajoutée dans la configuration d'authentification Supabase

---

## 🆘 Dépannage rapide

| Problème | Piste |
|---|---|
| Page blanche ou erreur de connexion à la base | Vérifie `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`, puis relance `npm run dev` |
| Les images de preuves ou les GPX ne s'affichent pas | Vérifie que le bucket `proofs` existe et est en **Public bucket** |
| Impossible de créer une activité ou un profil | Vérifie que toutes les migrations de `supabase/migrations/` ont été appliquées |
| Pas d'accès à `/admin` | Vérifie que ton compte a bien le rôle `admin` |
| Le site déployé ne se connecte pas | Vérifie les variables d'environnement sur Vercel/Netlify et l'URL du site dans Supabase |
