# Gansey Studio v0.8.2 — Spacer Button Fix

## Fixed

- Knit Spacer and Purl Spacer now use one stable event listener on the Section Composer.
- Buttons are explicitly `type="button"` so they cannot trigger unintended form submission.
- Each button carries the exact section ID it belongs to.
- A short confirmation message appears after a spacer is added.
- Existing v0.8.1 and older saved projects remain loadable.

## GitHub update

Replace the existing `index.html` with the v0.8.2 file. `motifs.json` is unchanged, but uploading both files together is fine.
