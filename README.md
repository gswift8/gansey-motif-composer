# Gansey Studio v0.8.0 — Bidirectional Band Composer

## Major changes

- "Field section" is now called **Vertical band**.
- Vertical and Horizontal bands both accept the same draggable motif and spacer blocks.
- A Horizontal band's ordered block list forms one repeat unit.
- That complete unit is tiled across the target stitch width.
- Both band types support block duplication, reordering, mirroring, gaps, and spacers.
- A new Layout Tree shows the hierarchy of the active garment panel.
- Every edit feeds directly into the Full Chart Preview.

## Horizontal band fitting

- Center whole units
- Start at left
- Custom left offset
- Knit or purl edge filler
- Mirror every other complete unit
- Repeat the complete band vertically

## Migration

- Old Field sections become Vertical bands.
- Old single-motif Horizontal bands become Horizontal bands containing one motif block.
- v0.7 browser saves and project JSON remain loadable.

## GitHub Pages

Upload `index.html` and `motifs.json` together in the same repository folder.
