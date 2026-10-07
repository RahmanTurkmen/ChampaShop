# Changelog

Toutes les évolutions notables de ChampaShop. Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions en [SemVer](https://semver.org/lang/fr/).

## [0.1.0] - Semaine 1

### Ajouté

- Mise en place : Nuxt 4, TypeScript strict, Pinia, ESLint (`no-explicit-any` en erreur), Prettier, Vitest, CI GitHub Actions (lint, typecheck, tests avec couverture, build), template de PR.
- F1 Catalogue `/produits` : 12 produits par page, recherche avec debounce de 300 ms, filtres catégorie et prix min/max, tri par prix, note ou titre. Tout l'état est dans l'URL et rendu côté serveur. Squelettes de chargement, état vide, erreur avec « Réessayer ».
- F2 Fiche produit `/produits/[id]` : galerie, marque, note, stock (« Plus que X en stock », « Rupture de stock »), garantie, livraison, avis, SEO Open Graph, vraie 404.
- F3 Panier `/panier` : store Pinia persisté en cookie (moins de 4 Ko), contrôle du stock, code promo, détail des remises.
- F4 Moteur de promotions `computeCart` : remise beauté, code TROYES10, plafond de 25 %, livraison. 8 scénarios testés, couverture ≥ 90 % imposée en CI.
- F5 Authentification DummyJSON : `/connexion`, `/compte` protégée par middleware, utilisateur chargé côté serveur, rafraîchissement du token en single-flight, déconnexion.
- Référencement : `useSeoMeta`, sitemap dynamique, robots.txt.
