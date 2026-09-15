# BrandiQue Design Studio

An open-source, Photoshop-inspired browser design editor built with React, Vite, Fabric.js, Zustand, and Tailwind CSS. Dark chrome, neon yellow controls, and a working canvas immediately on launch.

**No sign-in. No backend. No database. No paid API.** Documents are edited locally, with device-local recovery and named snapshots in browser localStorage. Static hosting is the only server responsibility.

## Run locally

Install Node.js 22 or later, then:

```sh
npm ci
npm run dev
```

For a static production build:

```sh
npm run build
npm run preview
```

Deploy the `dist` directory to a static HTTPS host. No environment variables, accounts, or database setup are required to run this code. Fonts are bundled locally. Node is a development/build dependency, not an application backend.

## Editing tools

- Move and multiselect, zoom 10–300%, fit view, hand tool and Space-drag panning.
- Freehand vector brush plus raster paint, eraser, clone stamp (Alt-click source), dodge, and burn.
- Connected paint bucket and color erase with tolerance; rectangular pixel selections, invert, clear, and copy to a new layer.
- Classic Edit, Image, Layer, Select, Filter, and View menus.
- Canvas eyedropper, visible grid, adjustable grid size, and snapping.
- Text, rectangles, rounded rectangles, circles, triangles, and lines.
- Three editable poster templates and blank documents.
- Social presets and custom artboard dimensions.
- Import local PNG, JPG, WebP, self-contained SVG, editable draft JSON, and supported 8-bit RGB PSD raster layers.
- Image brightness, contrast, saturation, blur, grayscale, sepia, and invert.
- Non-destructive image cropping from original pixels; reset crop at any time.
- Gradient fills, strokes, drop shadows, circle/rounded masks, and blend modes.
- Font family, size, weight, italic, underline, alignment, tracking, and leading.
- Layer search, double-click rename, drag reorder, hide, lock, delete, group, duplicate.
- Flip, align to canvas or selection bounds, distribute three or more layers, and keyboard nudging.
- Session history with clickable steps and undo/redo.
- PNG, JPEG, WebP at 1x/2x/3x; SVG, editable JSON drafts, and layered raster PSD exports.
- Optional PWA app caching after the first successful online visit.

## Save your work

Choose **File → Download draft**, **Save editable draft**, or press **Ctrl/Cmd+S**. Reopen the JSON file through Uploads, File → Open, or drag-and-drop.

Small documents autosave after edits into **localStorage**, and Projects provides named snapshots on the same browser/device. Recovery is capped at 2 million serialized characters and the snapshot shelf at 1.5 million; browser quota can be lower. Oversized documents or storage errors show a download reminder and preserve the last successful recovery. Download JSON for large artwork and durable backups. Clearing browser data removes local saves; private browsing can discard them. There is no cross-device sync, IndexedDB, external database, or cloud document storage. The service worker caches application assets.

## Keyboard shortcuts

| Shortcut                  | Action                                |
| ------------------------- | ------------------------------------- |
| V                         | Move/select                           |
| B                         | Vector brush                          |
| E / S / G / M             | Eraser / clone / fill / pixel marquee |
| H / hold Space            | Hand/pan                              |
| I                         | Sample canvas color                   |
| T / R / O                 | Add text / rectangle / circle         |
| Ctrl/Cmd+A                | Select all unlocked visible layers    |
| Ctrl/Cmd+Z                | Undo                                  |
| Ctrl/Cmd+Shift+Z          | Redo                                  |
| Ctrl/Cmd+D                | Duplicate                             |
| Ctrl/Cmd+G                | Group or ungroup                      |
| Ctrl/Cmd+S                | Download draft                        |
| Arrow keys / Shift+arrows | Nudge 1 / 10 pixels                   |
| Delete / Backspace        | Delete selection                      |
| Ctrl/Cmd+wheel            | Zoom                                  |
| Esc                       | Deselect                              |

## Architecture

- `src/App.jsx`: shell, workspace lifecycle, file actions, shortcuts, dialogs.
- `src/Inspector.jsx`: properties, image adjustments, brush controls, layers, history.
- `src/editor.js`: Fabric lifecycle, draft validation, import/export, bounded history.
- `src/advanced.js`: brush, navigation, alignment, cropping, filters, masks, effects.
- `src/pixelTools.js`: image-space raster editing and pixel selections.
- `src/psd.js`: bounded raster-layer PSD import/export through ag-psd.
- `src/localFiles.js`: localStorage recovery and named snapshots.
- `src/StudioExtras.jsx`: imaging menus, pixel tools, local projects.
- `src/store.js`: Zustand runtime and UI state. Fabric instances are never serialized.
- `vite.config.js`: Vite, Tailwind, and static PWA configuration.
- `tests/editor.test.mjs`: command-level regression checks using Fabric's Node renderer.

React Strict Mode creates isolated DOM subtrees per Fabric instance and disposes asynchronous resources on teardown. Documents use a versioned envelope. History is bounded to 50 steps and approximately 32 million serialized characters, retaining at least the last two states.

## Validation

```sh
npm test
npm run build
npm run format
```

The command-level tests use Fabric's optional Node canvas dependency. If your platform cannot install its prebuilt binary, install the node-canvas prerequisites or run the tests on a supported Node/Linux environment. Production browser builds do not depend on Node canvas.

## Limits

This is an independent Photoshop-inspired raster/vector editor, not an exact Adobe Photoshop replacement. No tools are paywalled. It does not implement CMYK, RAW development, healing, content-aware/generative fill, smart objects, channels, or Photoshop plugin compatibility.

PSD interchange supports 8-bit RGB bitmap layers and common blend modes. Text, vectors, groups, and effects use raster previews or are baked on export; unsupported PSD features will not remain editable or necessarily look identical. Use BrandiQue JSON for its native editable state. PSD documents are capped at 16 megapixels and 8192 pixels per edge, with a 50-megapixel layer budget; export supports up to 60 top-level layers. Raster editing is capped at 20 megapixels per source layer.

Images are limited to 20 MB per input and a 4096-pixel working edge; decoded inputs above 50 megapixels are rejected. Exports are limited to 40 megapixels. History is session-local and image-heavy documents can exhaust browser memory. SVG imports intentionally reject external references, embedded image elements, scripts, and unsupported active content. SVG text needs matching fonts in the receiving application; choose a raster format for the exact appearance of blend modes and image effects. JPEG does not preserve transparency. Offline installation requires an initial HTTPS visit and a browser that supports service workers.

## License

MIT — see `LICENSE`. Bundled fonts use the SIL Open Font License; copies are in `licenses/`. Third-party packages keep their respective licenses.
