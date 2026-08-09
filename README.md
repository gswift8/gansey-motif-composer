# Gansey Studio v0.20.1 — Editor Stabilization

This maintenance release implements the first focused fixes from the v0.20 regression test.

## Fixes and enhancements
- Collapse All and Expand All now control both the Layout Tree and Section Composer.
- Section cards can move to top, move up/down, move to bottom, duplicate, collapse, and delete.
- Horizontal bands include an explicit **Horizontal behavior** control:
  - Fill section width
  - Fixed number of complete units
  - Center, left, or custom-left-offset alignment
  - Knit/purl edge filler
  - Alternate-unit mirroring
- Cable motifs use knitting-aware mirroring: left- and right-cross cable symbols swap.
- Gauge values validate zero, negative, blank, and extreme entries and normalize calculated gauge to the nearest 0.5 stitch/row per unit.
- Gusset specifications now include traditional diamond geometry, size presets, and custom tip/maximum-width/center-row settings.
- Gusset previews, project thumbnails, and garment assembly use the same shaped matrix.
- Project overview thumbnails now use the canonical panel matrix.
- Version updated to v0.20.1.

## Files
Upload all files and folders together. `index.html` depends on `css/`, `js/`, and `motifs.json`.
