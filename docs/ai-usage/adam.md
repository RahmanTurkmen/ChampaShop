# Usage de l'IA : Adam

Format : date · outil · ce que j'ai demandé · ce que j'ai gardé / modifié / rejeté, et pourquoi.

> ✏️ À relire et compléter avec mes propres mots avant chaque rendu. Ce qui compte : ce que j'ai vérifié, compris et corrigé.

| Date | Outil | Ce que j'ai demandé | Ce que j'ai gardé / modifié / rejeté, et pourquoi |
| --- | --- | --- | --- |
| 24/09 | Claude | Vérifier que les étapes 1 à 5 de la mise en place (dépôt, init Nuxt, modules, scripts) étaient faites | Constat de l'IA : modules et scripts sur une branche non mergée, `vitest.config.ts` manquant, `typescript.strict` non activé. _À compléter : ce que j'ai vérifié moi-même._ |
| 24/09 | Claude | Écrire la CI GitHub Actions et le template de PR | _À compléter : ce que j'ai vérifié (étapes de la CI, version de Node)._ |
| 24/09 | Claude | Écrire le moteur de promotions et ses tests | _À compléter : j'ai recalculé les 8 scénarios à la main, par ex. le n° 2 (plafond 25 % de 59,97 € = 14,99 €, donc code réduit à 8,99 €)._ |
| 24/09 | Claude | Catalogue, fiche produit, panier, authentification | _À compléter : ce que j'ai relu, compris, modifié ou rejeté._ |
| 16/10 | Claude Code | Semaine 2, issue #19 (sélection du comparateur) : lire les consignes, vérifier les issues créées par Rahman, puis coder `utils/compare.ts` + tests, le store `compare` (cookie), `CompareToggle` et `CompareBar` | Gardé : fonctions pures + tests, store sur le modèle de celui du panier (cookie lu en `unknown` puis validé). Corrigé pendant la session : le premier jet de `CompareBar` lisait le résultat de `useAsyncData` dans son propre handler (erreur au premier appel), remplacé par un cache `useState`. Choix d'accessibilité proposés par l'IA, que je garde : la zone `aria-live` est toujours dans le DOM (sinon l'annonce n'est pas fiable), le bouton n'est jamais désactivé quand c'est plein (sinon le message « Comparateur plein » ne peut pas être déclenché), le titre du produit est ajouté en texte masqué au bouton (12 « Comparer » identiques sur le catalogue). Vérifié : SSR avec un cookie forgé (`curl`), cookie corrompu sans erreur, 404 intact. _À compléter : ce que j'ai testé moi-même au clavier et au lecteur d'écran._ |
