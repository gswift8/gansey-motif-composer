# Gansey Studio v0.8.4 — Block Control Fix

The block controls in v0.8.3 were searching for a parent element named `.block-card`,
but the actual rendered motif/spacer element is `.panel-block`. Because that lookup
failed, Duplicate, Mirror, Move Left, Move Right, and Remove could not identify the
selected block.

## Fixed

- Duplicate
- Mirror
- Move left
- Move right
- Remove
- Explicit `type="button"` added to block toolbar buttons
- Each rendered block now stores its section ID and current block index

## GitHub update

Replace the existing `index.html` with the v0.8.4 file. `motifs.json` is unchanged.
