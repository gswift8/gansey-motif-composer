# Gansey Studio v0.8.3 — Duplicate Button Fix

## Fixed

- Duplicate, Mirror, Move Left, and Move Right now use one stable delegated click handler.
- Each draggable block carries its section ID and current block index.
- Duplicate no longer depends on event handlers created during the last render.
- Remove also uses the block's current rendered identity.
- Spacer buttons from v0.8.2 remain fixed.

## GitHub update

Replace the existing `index.html` with the v0.8.3 file. `motifs.json` is unchanged.
