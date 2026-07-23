# Gansey Studio v0.9.2 — Move Button Repair

This patch fixes Move Left and Move Right in motif and spacer cards.

## Cause

When a number field or dropdown still had focus, pressing a toolbar button could
first trigger that field's `change` event. The composer then rebuilt the card before
the button's `click` event reached the delegated handler, so the move action was lost.

## Fixed

- Move Left
- Move Right
- Mirror
- Duplicate
- Reliable toolbar actions even immediately after editing a motif option
- Clear status messages when a block is already first or last

Toolbar pointer actions now run on `pointerdown`, before a focused editor control can
re-render the card. Keyboard activation remains supported through `click`.

## GitHub update

Replace:

- `index.html`
- `js/composer.js`
- `js/io.js`

Uploading the whole v0.9.2 folder is also safe. Keep `css/` and `js/` intact.
