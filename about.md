# À propos de Tache d'Huile

**Tache d'Huile** est un puzzle d'inondation développé par **Geoffroy Streit** (alias
**Hylst**).

## Le jeu

Le principe est celui du « flood it » : un territoire part du coin supérieur gauche et
s'étend en changeant de couleur, absorbant à chaque coup les cases voisines de la couleur
choisie. Il faut couvrir tout le plateau avant d'épuiser ses coups.

Ce qui distingue cette version : une campagne de 24 niveaux avec six motifs de rochers
différents (centre, coins, croix, pointillés, labyrinthe), un aperçu du gain au survol, un
système de combo, et une génération de plateaux vérifiée pour rester toujours jouable.

Le nom vient de l'expression française « faire tache d'huile », qui décrit exactement ce que
fait la mécanique du jeu.

## Le créateur

- Développeur d'applications, ancien graphiste et compositeur
- Adepte de rétrocomputing et de demoscene

## Stack technique

- React 19, TypeScript 5.9 (strict), Tailwind CSS 4
- Vite 7, vite-plugin-singlefile
- Toute la logique de jeu isolée en fonctions pures dans `game/flood.ts`
- Web Audio API pour la musique et les effets

## Contact

- Email : geoffroy.streit@ik.me
- Plateforme : [games.hylst.fr](https://games.hylst.fr/)
