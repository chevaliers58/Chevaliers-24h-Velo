# Widget « Défi kilomètres » pour le site de l'unité

Fichier : `public/widget/troupe-km.js`, publié avec le site à
`https://19-58.net/velo/widget/troupe-km.js`.

## Code à coller sur le site de l'unité

Remplace les valeurs entre chevrons par le domaine de l'application et la clé publishable du projet Supabase de ta troupe. La clé `sb_publishable_...` est conçue pour être publique ; ne jamais utiliser une clé `sb_secret_...` ou `service_role`.

```html
<div data-troupe-km data-sections="total,patrouilles,scouts" data-period="semaine"></div>
<script
  src="https://19-58.net/velo/widget/troupe-km.js"
  data-supabase-url="https://qxlsdauqoivqhoojlrwk.supabase.co"
  data-supabase-key="sb_publishable_..."
  data-site-url="https://19-58.net/velo"
  data-troupe-name="Chevaliers 58"
  defer
></script>
```

Le script refuse de charger des données si l'URL Supabase, la clé publishable ou l'URL du site ne sont pas configurées.

## Options

| Attribut | Valeurs | Défaut |
|---|---|---|
| `data-sections` | `total`, `patrouilles`, `scouts` (séparés par des virgules) | `total,patrouilles` |
| `data-period` | `semaine`, `mois`, `tout` | `semaine` |
| `data-limit` | nombre de lignes par classement (1 à 20) | `5` |
| `data-theme` | `clair`, `sombre` | `clair` |
| `data-titre` | texte libre | `Défi kilomètres de la troupe` |
| `data-troupe-name` | nom affiché sous le total | `la troupe` |

## Taille automatique

Le widget prend toute la largeur de l'endroit où il est placé et adapte sa mise en page à cette largeur (et pas seulement à l'écran) :

- moins de 420 px (téléphone, colonne étroite) : version compacte, une colonne ;
- 420 à 640 px : une colonne confortable ;
- 640 px et plus (ordinateur) : classements côte à côte ;
- 900 px et plus : total à gauche, classements à droite.

La mise en page change en direct si la fenêtre est redimensionnée. Pour limiter la largeur, il suffit de placer le bloc dans un conteneur plus étroit.

Plusieurs blocs peuvent être placés sur la même page ; le script n'est chargé qu'une fois.

## Données et vie privée

Le widget lit uniquement les vues publiques (`profiles_public`, `activities_public`, `patrols`)
avec la clé publishable, comme un visiteur sans compte : km validés, patrouilles, totem ou
« Prénom I. ». Le classement « scouts » exclut le staff. Pas de cookie ; les données sont gardées
5 minutes dans le navigateur (`sessionStorage`). Style isolé (Shadow DOM) : le site hôte ne le casse pas.
