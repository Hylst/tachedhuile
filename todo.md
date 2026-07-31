# TODO de Tache d'Huile

Audit fait le 2026-07-31 sur l'export brut (`color-flood-puzzle-game (3).zip`), suivi d'une
passe QA navigateur (Playwright + Chromium) avec partie réellement jouée jusqu'à la victoire.

---

## ✅ Corrigé — bugs

- [x] **Le niveau 21 générait un plateau mathématiquement impossible 14 fois sur 25 (56 %).**
  `generateLevelBoard` tire un plateau au hasard puis le rejette s'il isole des cases
  (`isBoardFullyReachable`), avec 200 tentatives maximum. Mais le motif `corners` du niveau 21
  (grille 19×19, densité 0,20) mure les coins de façon quasi systématique : les 3 zones
  d'angle offrent ~56 cases candidates pour un plafond de 72 rochers, donc elles saturent et
  emprisonnent régulièrement une case contre le bord. Les 200 tentatives échouant toutes, la
  fonction **renvoyait quand même le dernier plateau tiré**, avec des cases qu'aucune
  inondation ne peut jamais atteindre : le joueur perdait à coup sûr, quoi qu'il fasse.
  Corrigé par un filet de sécurité `sealUnreachable` qui transforme en rochers les cases
  jouables inaccessibles depuis le coin. **Vérifié hors navigateur** (25 tirages × 24 niveaux) :
  **14 plateaux injouables avant, 0 après**. Effet de bord bienvenu, le taux d'échec du
  solveur glouton sur ce niveau est tombé de 15/25 à 2/25.
- [x] **Les raccourcis clavier restaient actifs sur l'écran de sélection des niveaux.**
  Le `useEffect` du clavier était monté en permanence, sans regarder l'écran affiché. Sur le
  menu des niveaux (où aucun plateau n'est visible), appuyer sur 1 à 6 jouait quand même des
  coups sur le plateau caché : compteur de coups incrémenté, historique empilé, effets sonores
  déclenchés sans rien à l'écran, et au bout de `limit` frappes la partie invisible passait
  même en « perdu ». Corrigé par un garde `boardVisible`. **Vérifié en navigateur** : 5 touches
  couleur pressées sur le menu, puis entrée dans le niveau 1 qui affiche bien **0/10 coups**.

## ✅ Corrigé — cohérence et intégration

- [x] Renommé en **Tache d'Huile** — le nom d'origine, « Color Flood », était le nom générique
  du genre, en anglais. L'expression française « faire tache d'huile » décrit exactement la
  mécanique du jeu. Titre de page, pied de page, description du niveau 24, clés `localStorage`
  (`color-flood-*` → `tdh-*`, pour éviter toute collision avec un autre jeu du hub partageant
  le même domaine).
- [x] **Le jeu n'affichait son nom nulle part.** Seul un titre « Mode Libre » apparaissait, et
  uniquement dans ce mode. Ajout du titre et de la baseline sur l'écran d'accueil.
- [x] `base: '/tachedhuile/'` ajouté dans `vite.config.ts`, il n'y en avait aucun.
- [x] `index.html` : `lang="en"` corrigé en `lang="fr"`, bloc SEO complet (description,
  keywords, og, twitter, robots, canonical, theme-color), `<link rel="icon">`.
- [x] `package.json` : `react-vite-tailwind` v0.0.0 devenu `tache-d-huile` v1.0.0.
- [x] Tirets longs retirés du code (règle de ton du hub).

## ✅ La passe QA navigateur

- [x] 0 erreur console, 0 exception non gérée
- [x] Écran d'accueil, sélection des niveaux, entrée en jeu
- [x] **Mécanique centrale observée réellement** : niveau 1 joué jusqu'au bout, la zone inondée
  est passée de 11 % à 25, 44, 61, 78, 89, 97 puis **100 %**, victoire en 7 coups sur 10 avec
  2 étoiles et un score de 510. Le plateau affiche bien 36 cases (6×6) et seulement 3 boutons
  de couleur, conformément au `colorCount` du niveau.
- [x] Aperçu de gain au survol (`+N`) cohérent avec le gain réellement obtenu
- [x] Viewport mobile 390×844 : aucun débordement horizontal

## Vérification de la génération de plateaux

Test direct de `generateLevelBoard` hors navigateur, 25 tirages sur chacun des 24 niveaux,
avec contrôle d'accessibilité complète et résolution par solveur glouton. Après correction :
**0 plateau injouable sur 600 tirages**.

---

## ⬜ Idées d'amélioration

### Équilibrage
- [ ] **Les niveaux labyrinthe les plus durs semblent trop serrés.** Un solveur glouton (non
  optimal, mais raisonnable) dépasse la limite de coups dans 24 à 25 cas sur 25 aux niveaux 16,
  22 et 24, avec des pires cas à 51, 69 et 69 coups pour des limites de 31, 38 et 41. Le
  glouton n'étant pas optimal, cela ne prouve pas que ces niveaux sont infaisables, mais
  l'écart est assez large pour mériter une vérification manuelle, voire un relèvement de la
  limite sur ces trois niveaux.
- [ ] Le motif `maze` place les rochers en balayant le plateau de haut en bas et s'arrête dès
  que le quota `targetObstacles` est atteint : les rochers se concentrent donc dans la moitié
  haute et le bas reste dégagé. Un tirage aléatoire parmi toutes les cases candidates
  donnerait une répartition plus homogène.

### Technique
- [ ] `bestNextColor` (l'indice) boucle sur les 6 couleurs de `COLORS` sans tenir compte du
  `colorCount` du niveau. En pratique cela reste correct, puisqu'une couleur absente du
  plateau ne fait gagner aucune case et perd donc toujours face à une couleur réellement
  présente. Mais c'est fragile et cela calcule inutilement plusieurs `floodFill` complets à
  chaque indice.
- [ ] `ownedFraction` redéveloppe le même parcours de graphe que `getRegion` au lieu de
  l'appeler : deux implémentations à maintenir en parallèle.
- [ ] Le `useEffect` du clavier n'a pas de tableau de dépendances : l'écouteur est retiré et
  réinstallé à chaque rendu.
- [ ] Aucun test automatisé embarqué sur `flood.ts`, alors que tout y est en fonctions pures
  (c'est justement ce qui a permis de détecter le bug du niveau 21 hors navigateur).
