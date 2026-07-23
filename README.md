# Gansey Studio v0.9.1 — Motif Option Control Fix

This patch repairs the controls that appear after adding a motif.

## Fixed

- Horizontal repeats
- Vertical behavior
- Vertical repeats
- Alignment
- Row offset
- Unused-row texture
- Gap before
- Gap after

The modular v0.9.0 build attached these handlers separately every time a block was
rendered. v0.9.1 replaces that with one stable handler on the Section Composer,
using each block's section ID and current block index.

Dropdown changes apply immediately. Number fields apply when you leave the field,
use the stepper arrows, or press Enter.

## GitHub update

Replace:

- `index.html`
- `js/composer.js`
- `js/io.js`

Uploading the entire v0.9.1 folder is also fine. Keep the `css` and `js` folders intact.
