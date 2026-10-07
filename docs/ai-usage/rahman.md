# Usage de l'IA : Rahman

Format : date · outil · ce que j'ai demandé · ce que j'ai gardé / modifié / rejeté, et pourquoi.

> ✏️ À tenir à jour chaque semaine, avec mes propres mots. Ce qui compte : ce que j'ai vérifié, compris et corrigé.

| Date | Outil | Ce que j'ai demandé | Ce que j'ai gardé / modifié / rejeté, et pourquoi |
| --- | --- | --- | --- |
| 25/09 | Claude | Diagnostiquer pourquoi `npm run lint`/`build` échouaient (CI/qualité) | Gardé le diagnostic (config ESLint manquante, puis dépendance `eslint-typegen` absente) et le fix `vite-plugin-checker` (bug connu avec un chemin contenant un espace) après avoir vérifié le build en local avant/après. |
| 24/09-07/10 | Claude | Appliquer les patches de chaque branche (CI, auth) et relire les PR de l'équipe | Vérifié moi-même chaque commit (auteur, contenu des patches) avant de pousser. Pour les reviews (catalogue, panier), j'ai fait relire le vrai code par l'IA mais j'ai choisi les remarques à garder. |
| 07/10 | Claude | Corriger les 3 remarques non-bloquantes de Théo sur ma PR authentification | Gardé les 3 correctifs (ne pas déconnecter sur une 500, message d'erreur si `fetchUser` échoue après login, tests sur `authFetch`) après avoir relu le diff et compris pourquoi chaque changement répondait à sa remarque. |
