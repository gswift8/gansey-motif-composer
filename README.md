# Gansey Studio v0.17.0 — Smart Repeat & Alignment

This release adds automated layout assistance for the active garment panel.

## Active-panel analysis

Every vertical band, horizontal band, and divider is checked against the panel's
working stitch count. Gansey Studio reports exact fits, leftover stitches, and
sections that are too wide.

## Smart actions

### Vertical bands

- Fit with balanced knit edge spacers
- Reduce available horizontal repeats when a band is too wide
- Auto-repeat a single motif as many times as possible
- Add balanced edge spacers after auto-repeat

### Horizontal bands

- Center complete repeat units
- Align repeat units to the left
- Center all horizontal bands in one action

### Panel width

Use the nearest lower or higher width compatible with the panel's repeat multiple
and selvage specification.

## Undo support

Every smart mutation is captured in the existing Undo history.

Existing v0.16 and earlier browser saves remain loadable.
