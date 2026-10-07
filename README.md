# ChampaShop

Vitrine en ligne de la boutique fictive **ChampaShop**, construite avec Nuxt 4, Vue 3 (`<script setup>`), TypeScript strict, Pinia et Vitest. Les données viennent de l'API [DummyJSON](https://dummyjson.com).

- **Site en ligne** : https://champashop.vercel.app (branche `main`, mise à jour à chaque release)
- **Version actuelle** : v0.1.0 (semaine 1)

## Sommaire

1. [Installation](#installation)
2. [Scripts](#scripts)
3. [Fonctionnalités](#fonctionnalités)
4. [Architecture](#architecture)
5. [Choix techniques](#choix-techniques)
6. [Conventions Git](#conventions-git)
7. [Répartition des rôles](#répartition-des-rôles)
8. [Usage de l'IA](#usage-de-lia)

## Installation

Prérequis : **Node.js ≥ 22.22** (Node 24 LTS recommandé) et npm.

```bash
git clone https://github.com/RahmanTurkmen/ChampaShop.git
cd ChampaShop
npm install
npm run dev        # http://localhost:3000
```

Variables d'environnement facultatives (fichier `.env`, jamais commité) :

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `NUXT_PUBLIC_API_BASE` | `https://dummyjson.com` | URL de l'API |
| `NUXT_PUBLIC_SITE_URL` | `http://localhost:3000` | URL publique (sitemap, Open Graph) |
| `NUXT_PUBLIC_AUTH_EXPIRES_IN_MINS` | `30` | Durée du token. Mettre `1` pour tester le refresh |

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualise le build |
| `npm run lint` | ESLint (`no-explicit-any` en erreur) |
| `npm run lint:fix` | Corrige automatiquement ce qui peut l'être |
| `npm run format` | Formate le code avec Prettier |
| `npm run typecheck` | Vérification TypeScript stricte (`nuxt typecheck`) |
| `npm run test` | Tests unitaires Vitest |
| `npm run test:coverage` | Tests + couverture (échec si < 90 % sur `utils/promotions.ts`) |

La CI GitHub Actions (`.github/workflows/ci.yml`) lance `install → lint → typecheck → test:coverage → build` sur chaque Pull Request.

## Fonctionnalités

| # | Fonctionnalité | Route / fichier |
| --- | --- | --- |
| F1 | Catalogue paginé (12/page), recherche avec debounce 300 ms, filtres catégorie/prix, tri | `/produits` |
| F2 | Fiche produit : galerie, stock, garantie, livraison, SEO, vraie 404 | `/produits/[id]` |
| F3 | Panier Pinia persisté en cookie, contrôle du stock | `/panier` |
| F4 | Moteur de promotions (fonction pure, 8 scénarios testés) | `app/utils/promotions.ts` |
| F5 | Authentification DummyJSON, page protégée, refresh « single-flight » | `/connexion`, `/compte` |

## Architecture

```
app/
├── assets/css/main.css      # Design tokens, mode sombre, styles communs
├── components/              # Composants d'affichage (props/emits typés)
├── composables/             # useProductsApi (accès API), useDebouncedCallback
├── layouts/default.vue      # En-tête, navigation, lien d'évitement
├── middleware/auth.ts       # Protège /compte
├── pages/                   # Routage par fichiers
├── plugins/auth.ts          # Charge l'utilisateur pendant le rendu serveur
├── stores/                  # Pinia : cart, auth
├── types/dummyjson.ts       # Types des réponses DummyJSON
└── utils/                   # Logique métier pure (testée) : promotions, catalogue, panier…
server/routes/sitemap.xml.ts # Sitemap dynamique
tests/unit/                  # Tests Vitest
```

**Principes SOLID appliqués**

- **S** (responsabilité unique) : les calculs sont dans `utils/` (fonctions pures), l'accès réseau dans `useProductsApi`, l'état dans les stores, l'affichage dans les composants.
- **O** (ouvert/fermé) : chaque règle de promotion est une fonction séparée (`computeBeautyDiscount`, `evaluatePromoCode`, `computeShipping`). On ajoute une règle sans réécrire les autres.
- **L** (substitution) : les composants reçoivent des types minimaux (`ProductSummary`, `CartProduct`), donc on peut leur passer n'importe quel objet qui respecte ce contrat, y compris un `Product` complet.
- **I** (ségrégation des interfaces) : `ProductSummary` et `CartProduct` ne contiennent que les champs utiles, au lieu du `Product` complet.
- **D** (inversion des dépendances) : pages et stores dépendent de l'interface `ProductsApi`, pas de `$fetch` ni de l'URL de l'API.

## Choix techniques

### L'URL est la source de vérité (F1)

Tout l'état du catalogue (`page`, `q`, `category`, `sortBy`, `order`, `minPrice`, `maxPrice`) est lu depuis `route.query` par `parseCatalogQuery` et réécrit par `toRouteQuery`. Rechargement, bouton retour et lien partagé donnent donc la même vue, rendue côté serveur. Le formulaire de filtres est un vrai `<form method="get">` : il fonctionne même sans JavaScript. Une page hors limites (`?page=999` alors qu'il n'y a que 3 pages, cas d'un lien obsolète) est redirigée vers la dernière page valide (`clampPage`).

### Une réponse ancienne n'écrase jamais une réponse récente

La clé `useAsyncData` dépend des filtres (`catalog:{"q":"pho"}`, `catalog:{"q":"phone"}`…). Une réponse lente d'une ancienne recherche est rangée sous **son** ancienne clé et ne peut pas remplacer l'affichage courant. De plus, le `signal` fourni par Nuxt annule la requête HTTP devenue inutile. La saisie est « debouncée » de 300 ms (`useDebouncedCallback`).

### Stratégie du filtre prix min/max

DummyJSON ne sait pas filtrer par prix, ni combiner recherche **et** catégorie. Deux cas :

1. **Sans filtre prix** (cas le plus fréquent) : on délègue tout à l'API (`limit=12`, `skip`, `sortBy`, `order`, `select`). Un seul appel qui ne transfère que 12 produits.
2. **Avec filtre prix** (ou recherche + catégorie) : **un seul** appel avec `limit=0` (tous les produits correspondants) et `select=title,price,rating,…` (7 champs au lieu d'une trentaine), puis filtre, tri et pagination dans `utils/catalog.ts`, pendant le rendu serveur.

Justification :

- **Appels** : toujours un seul appel par affichage. Paginer côté API puis filtrer donnerait des pages incomplètes (3 produits au lieu de 12) et un total faux.
- **Performance** : le catalogue compte environ 200 produits. Avec `select`, la réponse complète pèse quelques dizaines de Ko, et le filtrage de 200 éléments est instantané. Si le catalogue devenait très gros, il faudrait un filtre côté serveur (API ou route Nitro avec cache).
- **Pagination** : elle est calculée après le filtre, donc le nombre de pages et le total sont exacts.

### Panier en cookie (F3)

Le cookie `champashop_cart` ne contient que `[{ id, qty }]`, soit environ 20 octets par produit, et au maximum 50 lignes : très en dessous de la limite de 4 Ko. Titre, prix, catégorie et stock sont rechargés depuis l'API (`select`). Le contenu du cookie est traité comme `unknown` et validé (`parseCartCookie`).

### Promotions (F4)

`computeCart(lines, promoCode)` est une fonction pure : tous les montants sont en centimes entiers, avec un arrondi commercial calculé en entiers. **En production, ce calcul devrait être refait côté serveur**, car un calcul côté client peut être contourné.

### Authentification (F5)

- `accessToken` et `refreshToken` sont stockés en cookies. Le plugin `auth` appelle `GET /auth/me` pendant le rendu serveur, ce qui évite le « flash » de l'état déconnecté.
- **Refresh single-flight** : `createSingleFlight` fait partager une même promesse à tous les appels simultanés. Si 3 requêtes reçoivent une 401, un seul `POST /auth/refresh` part, puis les 3 sont rejouées. La fonction est créée dans le store, donc une instance par requête côté serveur (pas de mélange entre visiteurs). La logique « 401 → refresh → rejeu » est extraite dans `utils/authFetch.ts` (`authFetchWithRetry`) pour être testée sans Nuxt.
- **Tester** : lancer `NUXT_PUBLIC_AUTH_EXPIRES_IN_MINS=1 npm run dev`, se connecter, attendre 1 minute, puis cliquer sur « Tester 3 requêtes simultanées » dans `/compte` (bouton affiché uniquement en mode développement). Le résultat affiche « 1 appel à /auth/refresh ».
- Le paramètre `?redirect=` n'accepte que des chemins internes (`safeRedirectPath`) pour éviter les redirections ouvertes.

### Référencement

`useSeoMeta` sur chaque page (titre, description, Open Graph avec image sur la fiche produit), `lang="fr"`, sitemap dynamique (`/sitemap.xml`), `robots.txt`, pages privées en `noindex`, vraies 404.

### Accessibilité

Lien d'évitement, focus visible, libellés sur tous les champs, `aria-live` pour les résultats et messages, cibles de 44 px minimum, respect de `prefers-reduced-motion`, mode sombre automatique.

## Conventions Git

Nous suivons **GitFlow** :

| Branche | Créée depuis | Mergée dans | Règle |
| --- | --- | --- | --- |
| `main` | — | — | Production, protégée. Merge uniquement depuis `release/*` ou `hotfix/*` |
| `develop` | `main` | — | Intégration, protégée. Merge par PR approuvée |
| `feature/<n°>-<desc>` | `develop` | `develop` | Une issue = une branche = une PR |
| `release/vX.Y.Z` | `develop` | `main` + `develop` | Gel des fonctionnalités, tag annoté sur `main` |
| `hotfix/<desc>` | `main` | `main` + `develop` | Correction urgente, incrémente le patch |

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/fr/) : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- **Pull Requests** : template rempli, `Closes #<n°>`, CI verte, au moins une review argumentée d'un coéquipier, merge en « Create a merge commit » (`--no-ff`), branche supprimée après merge.

## Répartition des rôles

| Membre | Domaine | Issues (semaine 1) |
| --- | --- | --- |
| Rahman | Socle technique et sécurité : installation, qualité et CI, déploiement, authentification (F5) | Modules, CI/qualité, F5 |
| Théo | Parcours produit : catalogue (F1), fiche produit et référencement (F2), documentation | F1, F2, README |
| Adam | Achat : moteur de promotions (F4), panier (F3), release v0.1.0 | F4, F3, release |

Chaque PR est relue par un autre membre de l'équipe.

## Usage de l'IA

Chaque membre tient son journal dans `docs/ai-usage/<prenom>.md`.
