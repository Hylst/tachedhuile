# Fonctionnalités de Tache d'Huile

## Gameplay

- ✅ Mécanique « flood it » : le territoire du coin s'étend en changeant de couleur
- ✅ 24 niveaux en 4 chapitres, débloqués progressivement
- ✅ Grilles de 6×6 à 20×20, de 3 à 6 couleurs
- ✅ 6 motifs de rochers : aucun, centre, coins, croix, pointillés, labyrinthe
- ✅ **Plateaux toujours jouables** : les cases isolées sont murées à la génération
  (vérifié sur 600 tirages, 0 plateau injouable)
- ✅ Mode Libre en trois tailles, sans obstacle
- ✅ Aperçu du gain au survol d'une couleur (cases surlignées + badge `+N`)
- ✅ Indice, annulation, recommencer
- ✅ Système de combo sur les gains successifs de 4 cases ou plus

## Score et progression

- ✅ Étoiles (1 à 3) selon le ratio coups / limite
- ✅ Score basé sur la taille du plateau et les coups économisés
- ✅ Progression, étoiles et meilleurs scores sauvegardés en `localStorage`
- ✅ Meilleur nombre de coups par taille en Mode Libre
- ✅ Réinitialisation de la progression Aventure
- ⬜ Les niveaux 16, 22 et 24 (labyrinthes denses) semblent trop serrés (voir todo.md)

## Interface

- ✅ Écran d'accueil avec titre et baseline
- ✅ Sélecteur de niveaux par chapitre, avec étoiles et scores obtenus
- ✅ HUD : coups, coups restants, pourcentage inondé, record
- ✅ Deux barres de progression (coups consommés, plateau inondé)
- ✅ Effets : particules, gains flottants, confettis de victoire, flash sur gros gain,
  secousse du plateau à la défaite, propagation en vague depuis le coin
- ✅ Mode plein écran
- ✅ Coupure indépendante musique / effets sonores
- ✅ Aucun débordement horizontal en 390×844
- ✅ Raccourcis clavier inactifs sur l'écran de sélection (plus de coups fantômes)

## Audio

- ✅ Tout est synthétisé en Web Audio, aucun fichier son
- ✅ Musique d'ambiance, sons de survol, de sélection, de combo, victoire, défaite, annulation
- ✅ Écran d'accueil demandant l'activation du son (contrainte navigateur)

## Technique

- ✅ Build en un seul fichier (~321 Ko), fonctionne hors ligne
- ✅ TypeScript strict
- ✅ Logique de jeu entièrement pure dans `game/flood.ts`, testable hors navigateur
- ✅ Bloc SEO complet, favicon, og-image (capture réelle du jeu)
- ⬜ `bestNextColor` ignore le `colorCount` du niveau (sans conséquence en pratique)
- ⬜ Pas de tests automatisés embarqués
