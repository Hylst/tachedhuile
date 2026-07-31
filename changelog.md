# Changelog de Tache d'Huile

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnage
[SemVer](https://semver.org/lang/fr/).

## [1.0.0] 2026-07-31

Première version intégrable à Hylst.Games, partie d'un export brut audité puis corrigé.

### Ajouté
- Bloc SEO complet dans `index.html` (description, keywords, og, twitter, robots, canonical,
  theme-color) et `lang="fr"`
- `favicon.png` 32×32, `og-image.png` 1024×576 (capture réelle du niveau 14) et sa variante
  `og-image.webp`, `icon.webp` 128×128 pour la carte du menu
- Titre et baseline du jeu sur l'écran d'accueil : le jeu n'affichait son nom nulle part
- `base: '/tachedhuile/'` dans `vite.config.ts`
- La doc : `about.md`, `README.md`, `structure.md`, `features.md`, `todo.md`, `changelog.md`

### Modifié
- Renommé en **Tache d'Huile**. Le nom précédent, « Color Flood », était le nom générique du
  genre, en anglais. Titre de page, pied de page, description du niveau 24, clés
  `localStorage` (`color-flood-*` → `tdh-*`).
- `package.json` : `react-vite-tailwind` v0.0.0 devenu `tache-d-huile` v1.0.0
- Tirets longs retirés du code

### Corrigé
- **Le niveau 21 était impossible à terminer 14 fois sur 25.** Le motif de rochers « coins »
  emmurait régulièrement des cases contre le bord ; la boucle de rejet abandonnait après 200
  tentatives et renvoyait quand même le plateau piégé, avec des cases qu'aucune inondation ne
  pouvait atteindre. Les cases isolées sont désormais transformées en rochers à la génération.
  Vérifié sur 600 tirages (25 par niveau) : 14 plateaux injouables avant, **0 après**.
- Les raccourcis clavier restaient actifs sur l'écran de sélection des niveaux : appuyer sur
  1 à 6 y jouait des coups sur le plateau caché (compteur, historique et sons inclus), et
  pouvait même faire perdre une partie invisible. Vérifié après correction : le niveau démarre
  bien à 0 coup malgré des touches pressées au menu.
