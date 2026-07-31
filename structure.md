# Structure de Tache d'Huile

## Arborescence

```
tache-d-huile-game-development/
├── index.html              # template Vite + bloc SEO (lang=fr)
├── package.json            # tache-d-huile v1.0.0
├── vite.config.ts          # base '/tachedhuile/', react + tailwind + singlefile
├── tsconfig.json
├── .gitignore                # deps, secrets, fichiers d'agents IA
├── about.md / README.md / structure.md / features.md / todo.md / changelog.md
├── og-image.png / favicon.png
├── public/
│   ├── favicon.png
│   ├── og-image.png / og-image.webp
│   └── icon.webp             # carte du menu, 128x128
└── src/
    ├── main.tsx
    ├── App.tsx                # ecrans, etat de partie, plateau, palette, HUD
    ├── index.css              # Tailwind + keyframes
    ├── utils/cn.ts
    ├── game/
    │   ├── flood.ts           # LOGIQUE PURE (voir ci-dessous)
    │   ├── levels.ts          # les 24 niveaux : taille, couleurs, limite, motif, densite
    │   └── audio.ts           # synthese Web Audio
    └── components/
        ├── LevelSelect.tsx     # selection des niveaux par chapitre
        ├── StartOverlay.tsx    # ecran d'accueil (titre + activation du son)
        ├── Confetti.tsx / ParticleBurst.tsx / FloatingGain.tsx / AnimatedNumber.tsx
```

## `game/flood.ts` : tout le coeur du jeu, en fonctions pures

Aucune dependance a React : c'est ce qui a permis de tester la generation hors navigateur
pendant l'audit et d'y trouver le bug du niveau 21.

| Export | Role |
|--------|------|
| `COLORS` | les 6 couleurs (hex + halo) |
| `SIZE_OPTIONS` | les 3 tailles du Mode Libre |
| `generateBoard(size)` | plateau aleatoire pour le Mode Libre |
| `generateLevelBoard(level)` | plateau d'un niveau : couleurs + rochers selon le motif |
| `floodFill(board, size, color)` | applique un coup |
| `isFlooded(board)` | vrai si tout est de la meme couleur (les rochers sont ignores) |
| `getRegion(board, size)` | indices du territoire connecte au coin |
| `getDistanceMap(board, size)` | BFS depuis le coin (non utilise par l'UI) |
| `previewGain(board, size, color)` | cases qui seraient gagnees, pour l'apercu au survol |
| `ownedFraction(board, size)` | part du plateau jouable deja controlee |
| `bestNextColor(board, size)` | couleur du meilleur gain immediat (l'indice) |
| `computeStars` / `computeScore` | notation de fin de niveau |

### La generation, et son piege

`generateLevelBoard` tire un plateau au hasard, y place des rochers selon le motif du niveau,
puis **rejette et recommence** si le plateau est deja inondé, s'il a moins de 2 couleurs, ou
s'il isole des cases (`isBoardFullyReachable`). Au bout de 200 tentatives, il abandonne et
rend le dernier tirage tel quel.

C'est exactement la que se trouvait le bug corrige pendant l'audit : le motif `corners` du
niveau 21 mure un coin de facon quasi systematique, les 200 tentatives echouaient toutes, et
la fonction rendait un plateau avec des cases inatteignables, donc impossible a terminer
(56 % des tirages). D'ou **`sealUnreachable`**, applique en sortie : il transforme en rochers
les cases jouables qu'on ne peut pas atteindre depuis le coin. Comme `isFlooded` et
`ownedFraction` ignorent deja les rochers, le niveau redevient gagnable et les pourcentages
restent justes.

**Ne pas retirer ce garde-fou** : la boucle de rejet seule ne suffit pas, elle ne fait que
retenter un tirage dont le motif est structurellement piegeur.

## Points d'attention pour un audit futur

- **`bestNextColor` boucle sur les 6 `COLORS`** sans regarder le `colorCount` du niveau. En
  pratique c'est sans consequence (une couleur absente du plateau ne fait rien gagner et perd
  donc toujours face a une couleur presente), mais c'est fragile.
- **Les raccourcis clavier** sont montes en permanence : le garde `boardVisible` est ce qui
  empeche de jouer des coups sur le plateau cache depuis l'ecran de selection.
- **Le motif `maze`** remplit les rochers en balayant de haut en bas et s'arrete au quota :
  la moitie basse du plateau reste degagee. Visible sur une capture du niveau 16.

## Build

`vite-plugin-singlefile` inline le JS et le CSS dans `index.html` (~321 Ko). Le `dist/`
contient en plus `favicon.png`, `og-image.png/webp` et `icon.webp` copies depuis `public/`.
`base: '/tachedhuile/'` fait resoudre ces assets sous `https://games.hylst.fr/tachedhuile/`.
