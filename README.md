# Gansey Studio v0.16.0 — Panel Specifications

This release adds construction metadata and chart validation for every garment panel.

## Panel specifications

Front, Back, Sleeve, Gusset, and Shoulder each store:

- description
- cast-on, working, and finished stitch counts
- repeat multiple
- selvage stitches
- underarm stitches
- center alignment
- flat or in-the-round construction
- mirror and shoulder-shaping flags
- panel-specific notes

## Live validation

Gansey Studio checks whether the usable working stitches divide evenly by the
repeat multiple and whether the selected center alignment matches an odd or even
stitch count. It suggests nearby divisible counts when needed.

## Chart guides

Optional visual overlays are available for:

- center line
- quarter marks
- repeat boundaries
- underarm markers
- side seams

A numbered stitch ruler is displayed above every chart section.

## Project dashboard

The dashboard summarizes each panel's specified width, chart height, validation
status, total specified working stitches, chart rows, and chart cells.

Existing v0.15 and earlier browser saves remain loadable.
