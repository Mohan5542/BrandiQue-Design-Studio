# BrandiQue Design Studio

An open-source, Photoshop-inspired browser design editor built with React, Vite, Fabric.js, Zustand, and Tailwind CSS. Dark chrome, neon yellow controls, and a working canvas immediately on launch.

**No sign-in. No backend. No database. No paid API.** Documents live in memory until you download them. Static hosting is the only server responsibility.

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
- Freehand vector brush with size, color, and opacity controls.
- Canvas eyedropper, visible grid, adjustable grid size, and snapping.
- Text, rectangles, rounded rectangles, circles, triangles, and lines.
- Three editable poster templates and blank documents.
- Social presets and custom artboard dimensions.
- Import local PNG, JPG, WebP, self-contained SVG, and editable draft JSON.
- Image brightness, contrast, saturation, blur, grayscale, sepia, and invert.
- Non-destructive image cropping from original pixels; reset crop at any time.
- Gradient fills, strokes, drop shadows, circle/rounded masks, and blend modes.
- Font family, size, weight, italic, underline, alignment, tracking, and leading.
- Layer search, double-click rename, drag reorder, hide, lock, delete, group, duplicate.
- Flip, align to canvas or selection bounds, distribute three or more layers, and keyboard nudging.
- Session history with clickable steps and undo/redo.
- PNG, JPEG, WebP at 1x/2x/3x; SVG and editable JSON drafts.
- Optional PWA app caching after the first successful online visit.

## Save your work

Choose **File → Download draft**, **Save editable draft**, or press **Ctrl/Cmd+S**. Reopen the JSON file through Uploads, File → Open, or drag-and-drop.

There is intentionally **no autosave database, IndexedDB, localStorage, or cloud storage** in the app. A tab-close warning protects modified sessions, but downloadable drafts are the durable copy. The service worker caches application assets only; it does not store designs. Browser downloads may ask you for a file location.

## Keyboard shortcuts

| Shortcut                  | Action                             |
| ------------------------- | ---------------------------------- |
| V                         | Move/select                        |
| B                         | Brush                              |
| H / hold Space            | Hand/pan                           |
| I                         | Sample canvas color                |
| T / R / O                 | Add text / rectangle / circle      |
| Ctrl/Cmd+A                | Select all unlocked visible layers |
| Ctrl/Cmd+Z                | Undo                               |
| Ctrl/Cmd+Shift+Z          | Redo                               |
| Ctrl/Cmd+D                | Duplicate                          |
| Ctrl/Cmd+G                | Group or ungroup                   |
| Ctrl/Cmd+S                | Download draft                     |
| Arrow keys / Shift+arrows | Nudge 1 / 10 pixels                |
| Delete / Backspace        | Delete selection                   |
| Ctrl/Cmd+wheel            | Zoom                               |
| Esc                       | Deselect                           |

## Architecture

- `src/App.jsx`: shell, workspace lifecycle, file actions, shortcuts, dialogs.
- `src/Inspector.jsx`: properties, image adjustments, brush controls, layers, history.
- `src/editor.js`: Fabric lifecycle, draft validation, import/export, bounded history.
- `src/advanced.js`: brush, navigation, alignment, cropping, filters, masks, effects.
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

This is a vector/composite design editor with photo adjustments, not Adobe Photoshop or a PSD-compatible implementation. It does not implement PSD import, CMYK, RAW development, healing, or content-aware fill.

Images are limited to 20 MB per input and a 4096-pixel working edge; decoded inputs above 50 megapixels are rejected. Exports are limited to 40 megapixels. History is session-local and image-heavy documents can exhaust browser memory. SVG imports intentionally reject external references, embedded image elements, scripts, and unsupported active content. SVG text needs matching fonts in the receiving application; choose a raster format for the exact appearance of blend modes and image effects. JPEG does not preserve transparency. Offline installation requires an initial HTTPS visit and a browser that supports service workers.

## License

MIT — see `LICENSE`. Bundled fonts use the SIL Open Font License; copies are in `licenses/`. Third-party packages keep their respective licenses.
