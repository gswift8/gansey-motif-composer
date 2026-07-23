# Gansey Studio v0.9.0 — Modular Studio

This release reorganizes the working v0.8.4 application into separate files without
changing the saved-project structure or the established composer workflow.

## Repository structure

```text
gansey-studio/
├── index.html
├── motifs.json
├── README.md
├── css/
│   └── styles.css
└── js/
    ├── core.js
    ├── editor.js
    ├── renderer.js
    ├── composer.js
    ├── preview.js
    ├── io.js
    └── app.js
```

## Responsibilities

- `core.js` — shared state, section models, history, motif validation, and library loading
- `editor.js` — motif grid editor and motif-library interface
- `renderer.js` — stitch matrices, motif tiling, vertical bands, horizontal bands, and dividers
- `composer.js` — section cards, layout tree, drag/drop, block controls, spacers, and band settings
- `preview.js` — full-chart preview and smart vertical-band suggestions
- `io.js` — motif/project import and export plus browser saves
- `app.js` — application startup
- `styles.css` — all presentation styles

## GitHub Pages update

Upload the entire folder structure. Do not flatten the `css` or `js` folders.

The repository root must contain `index.html` and `motifs.json`, with the CSS and
JavaScript files in their matching subfolders.

## Migration

Browser saves from v0.8.4 and earlier remain loadable. New browser saves use the
`ganseyStudioV90` key, and project exports use the v0.9.0 filename.
