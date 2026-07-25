# Gansey Studio v0.10.0 — Live Preview Phase

This release begins the next development phase: a faster, more stable editing loop.

## Live preview

The full chart preview now updates while you type into:

- Horizontal repeats
- Vertical repeats
- Row offset
- Stitch offset
- Gap before and after
- Spacer width
- Section heights and row counts
- Target panel width

Dropdown changes still apply immediately. The full composer card refreshes when an
edit is committed, while the assembled chart updates continuously during editing.

## Stitch offset corrected

Stitch offset now behaves like a horizontal counterpart to row offset:

- Positive values shift the motif pattern to the right.
- Negative values shift it to the left.
- The motif wraps cyclically instead of being cropped.
- Gap before and gap after remain fixed.
- The total motif-block width does not change.

For example, a stitch offset of `1` moves the final stitch of each motif row to the
front, shifting the visible pattern one stitch to the right.

## Drag reordering removed

Existing motif and spacer cards are no longer draggable. Reorder them with:

- Move Left
- Move Right

Dragging a motif from the motif library into a band remains available.

## GitHub update

Replace:

- `index.html`
- `js/composer.js`
- `js/renderer.js`
- `js/io.js`

Uploading the entire v0.10.0 folder is also safe. Keep the `css/` and `js/` folders intact.

Browser saves from v0.9.4 and earlier remain loadable.
