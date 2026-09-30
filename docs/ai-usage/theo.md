# Usage de l'IA : Théo

Format : date · outil · ce que j'ai demandé · ce que j'ai gardé / modifié / rejeté, et pourquoi.

> ✏️ À tenir à jour chaque semaine, avec mes propres mots. Ce qui compte : ce que j'ai vérifié, compris et corrigé.

| Date | Outil | Ce que j'ai demandé | Ce que j'ai gardé / modifié / rejeté, et pourquoi |
| --- | --- | --- | --- |
| 25/09 | Claude Code | Vérifier tous les patches de l'équipe (A → G) avant de les partager : les appliquer sur une branche de test depuis `develop` et lancer lint, typecheck, tests avec couverture et build après chaque dossier. | Gardé : les 7 dossiers passent tous les contrôles (couverture finale ≈ 99 %). Modifié : l'IA a signalé que mes instructions supprimaient mon stash au lieu de le restaurer ; j'ai corrigé pour faire un `git stash pop` sur `main`. Branche de test supprimée, rien poussé. |
| 30/09 | Claude Code | Synchroniser mon dépôt local avec `develop` (PR #1, #10, #11) et vérifier le statut du déploiement Vercel après le merge de B. | Gardé : `develop` local à jour, déploiement Vercel et CI confirmés verts via `gh`. |
| 30/09 | Claude Code | Créer la branche `feature/5-catalogue`, y appliquer les patches `C-catalogue` et lancer les contrôles, puis lancer le site en local. | Gardé : les 4 commits (types DummyJSON, logique pure du catalogue + tests, layout, page `/produits` avec recherche, filtres et pagination dans l'URL). Modifié : auteur des commits remis à mon nom. Vérifié : lint, typecheck, 40 tests et build OK, page `/produits` testée en local. Les liens vers `/produits/[id]` donnent une 404, normal : la fiche produit arrive avec la branche D. |
