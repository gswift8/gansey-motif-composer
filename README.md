# Gansey Studio v0.14.0 — Garment Assembly Phase

This release adds a new garment-level planning view.

## Garment assembly

Section 6 shows the Front, Back, Sleeves, Gussets, and Shoulders together.

Two views are available:

- Garment map — places the panels in a sweater-like schematic
- Exploded panels — displays every panel in a regular comparison grid

Each assembly preview:

- is generated from the current chart data
- shows stitch width and row height
- can be clicked to open that panel in Section 3
- updates whenever the project changes

## Assembly controls

- Preview size slider
- Show or hide empty panels
- Saved view preferences in exported JSON and browser saves

## Project metrics

The assembly section also reports:

- current target stitch width
- number of panels with chart data
- total designed rows
- total chart cells

The assembly is a planning schematic. It does not yet calculate garment shaping,
armhole curves, sleeve caps, or finished measurements.

## GitHub update

Extract the ZIP and upload everything inside the release folder to the repository
root using **Add file → Upload files**. Allow GitHub to replace matching files and
keep the `css/` and `js/` folders intact.
