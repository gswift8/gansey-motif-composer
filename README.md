# Gansey Studio v0.8.1 — Interaction Fix

This patch fixes controls inside draggable motif and spacer cards.

## Fixed

- Duplicate motif and spacer buttons
- Knit spacer and Purl spacer buttons in both band types
- Section Duplicate, Move, Select, and Delete buttons
- Remove buttons inside draggable blocks
- Dragging no longer intercepts clicks on buttons, inputs, selects, or labels

## Motif library reset

The former `Reload motifs.json` button is now labeled:

`Reset to hosted motif library`

It is intentional. It reloads the default `motifs.json` hosted beside `index.html` and discards unsaved in-memory library edits or imports. The app now asks for confirmation first.

## GitHub Pages

Upload `index.html` and `motifs.json` together in the same repository folder.
