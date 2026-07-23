# Gansey Studio v0.9.4 — Simplified Reordering + Stitch Offset

## Changed

- Removed drag-and-drop reordering for motif and spacer blocks.
- Kept the reliable **Move Left** and **Move Right** buttons.
- Added **Stitch offset** beside **Row offset**.

Dragging a motif from the motif library into a band is still available; only
dragging existing blocks around to reorder them has been removed.

## Stitch offset

- `0` leaves the motif in its normal position.
- Positive numbers shift it to the right.
- Negative numbers shift it to the left.
- The block keeps the same total stitch width.
- New empty stitches use the selected unused-row texture.
- Large offsets may crop stitches at the opposite edge.

## GitHub update

Replace:

- `index.html`
- `js/composer.js`
- `js/renderer.js`
- `js/io.js`

Uploading the entire v0.9.4 folder is also safe. Keep `css/` and `js/` intact.

Browser saves from v0.9.3 and earlier remain loadable.
