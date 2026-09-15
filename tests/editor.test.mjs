import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { Canvas, FabricImage, ActiveSelection } from "fabric/node";
import { createCanvas } from "canvas";

// Run the same browser command modules against Fabric's Node canvas adapter.
await fs.mkdir(".sites-runtime/tests", { recursive: true });
for (const module of [
  "editor",
  "advanced",
  "localFiles",
  "pixelTools",
  "psd",
]) {
  const source = (await fs.readFile("src/" + module + ".js", "utf8"))
    .replace(/from ['"]fabric['"]/, 'from "fabric/node"')
    .replace(
      /import WebFont from ['"]webfontloader['"];?/,
      "const WebFont = {};",
    )
    .replace(/from ['"]\.\/store['"]/, 'from "../../src/store.js"')
    .replace(
      /from ['"]\.\/(editor|advanced|localFiles|pixelTools)['"]/g,
      (_, name) => 'from "./' + name + '.mjs"',
    );
  await fs.writeFile(".sites-runtime/tests/" + module + ".mjs", source);
}
const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => memory.get(k) || null,
  setItem: (k, v) => memory.set(k, v),
  removeItem: (k) => memory.delete(k),
};
globalThis.window = new EventTarget();
const { useStudio } = await import("../src/store.js");
const e = await import("../.sites-runtime/tests/editor.mjs");
const a = await import("../.sites-runtime/tests/advanced.mjs");
const c = new Canvas(null, { width: 1080, height: 1080 });
useStudio.setState({ canvas: c, ready: true });

e.seed();
assert.equal(c.getObjects().length, 12);
const template = e.snapshot();
e.add("rectangle");
const rectangle = c.getActiveObject();
a.applyGradient("#fbff00", "#ef5268");
assert.equal(rectangle.fill.type, "linear");
a.applyShadow(true);
assert.equal(rectangle.shadow.blur, 24);
a.flip("horizontal");
assert.equal(rectangle.flipX, true);
a.align("center");
assert.ok(
  Math.abs(
    rectangle.getBoundingRect().left +
      rectangle.getBoundingRect().width / 2 -
      540,
  ) < 0.001,
);
a.mask("circle");
assert.equal(rectangle.clipPath.radius, 110);
a.renameLayer(rectangle.id, "Test layer");
assert.equal(rectangle.name, "Test layer");
e.layerAction(rectangle.id, "lock");
assert.equal(rectangle.selectable, false);
e.layerAction(rectangle.id, "lock");
e.selectLayer(rectangle.id);
await e.duplicate();
assert.equal(c.getObjects().length, 14);
await e.travel(-1);
assert.equal(c.getObjects().length, 13);
await e.travel(1);
assert.equal(c.getObjects().length, 14);

const pixels = createCanvas(200, 100);
const ctx = pixels.getContext("2d");
ctx.fillStyle = "#806040";
ctx.fillRect(0, 0, 200, 100);
const photo = new FabricImage(pixels, {
  left: 400,
  top: 400,
  name: "Test photo",
});
c.add(photo);
c.setActiveObject(photo);
e.changed("Import photo");
a.adjustImage({ brightness: 30, contrast: 10, saturation: -20, sepia: true });
assert.equal(photo.filters.length, 4);
a.cropImage({ left: 10, right: 20, top: 10, bottom: 10 });
assert.equal(photo.width, 140);
assert.equal(photo.height, 80);
assert.equal(photo.cropX, 20);
a.cropImage({});
assert.equal(photo.width, 200);
a.mask("rounded");
const roundTrip = e.snapshot();
await e.loadDocument(roundTrip);
const restored = c.getObjects().find((o) => o.name === "Test photo");
assert.equal(restored.adjustments.brightness, 30);
assert.equal(restored.filters.length, 4);
assert.ok(restored.clipPath);
a.setTool("brush");
a.configureBrush({ brushSize: 25, brushColor: "#123456", brushOpacity: 50 });
assert.equal(c.freeDrawingBrush.width, 25);
assert.ok(c.freeDrawingBrush.color.startsWith("#123456"));
a.setTool("select");
assert.equal(c.isDrawingMode, false);
assert.throws(() => e.validateDocument({ ...template, width: 999999 }));
assert.throws(() =>
  e.validateDocument({
    ...template,
    canvas: {
      objects: [{ type: "Image", src: "https://example.com/image.png" }],
    },
  }),
);
// Pixel tools: real source alpha edits, selection bounds, and undo.
const p = await import("../.sites-runtime/tests/pixelTools.mjs");
const local = await import("../.sites-runtime/tests/localFiles.mjs");
const source = createCanvas(128, 128);
source.getContext("2d").fillStyle = "#ff0000";
source.getContext("2d").fillRect(0, 0, 128, 128);
const raster = new FabricImage(source, {
  left: 0,
  top: 0,
  originX: "left",
  originY: "top",
  name: "Pixel test",
  id: crypto.randomUUID(),
});
c.clear();
c.add(raster);
c.setActiveObject(raster);
e.changed("Pixel fixture");
c.getScenePoint = (event) => ({ x: event.clientX, y: event.clientY });
const detach = p.attachPixelEvents(c);
a.configureBrush({ brushSize: 20, brushOpacity: 100 });
p.activatePixelTool("eraser");
c.fire("mouse:down", { e: { clientX: 64, clientY: 64 } });
c.fire("mouse:up", {});
assert.equal(
  raster.getElement().getContext("2d").getImageData(64, 64, 1, 1).data[3],
  0,
);
assert.equal(
  raster.getElement().getContext("2d").getImageData(2, 2, 1, 1).data[3],
  255,
);
const fillPixels = new Uint8ClampedArray([
  255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 255, 255,
]);
assert.equal(p.floodFill(fillPixels, 3, 1, 0, 0, [0, 255, 0, 255], 0), 2);
assert.equal(fillPixels[9], 0);
local.writeAutosave(e.snapshot());
assert.equal(local.readAutosave().canvas.objects.length, 1);
assert.throws(() => local.writeAutosave({ payload: "x".repeat(2_000_001) }));
const saved = local.readAutosave();
assert.ok(saved.canvas);
assert.throws(() =>
  local.writeAutosave(e.snapshot(), {
    setItem() {
      throw Error("Quota exceeded");
    },
  }),
);
assert.deepEqual(local.readAutosave(), saved);
detach();
// Basic layered PSD export/import round-trip using the real parser.
const ag = await import("ag-psd");
ag.initializeCanvas((w, h) => createCanvas(w, h));
const psd = await import("../.sites-runtime/tests/psd.mjs");
useStudio.setState({ width: 128, height: 128 });
c.setDimensions({ width: 128, height: 128 });
const buffer = psd.buildPsd();
const parsed = ag.readPsd(buffer);
assert.equal(parsed.width, 128);
assert.ok(parsed.children.length >= 1);
await psd.importPsd({ name: "roundtrip.psd", arrayBuffer: async () => buffer });
assert.equal(useStudio.getState().width, 128);
assert.ok(c.getObjects().length >= 1);
console.log(
  "PASS: pixel erasing, fill boundaries, autosave restore/quota protection, and layered raster PSD round-trip.",
);
await c.dispose();
console.log(
  "PASS: templates, gradients, shadows, flip, alignment, masks, rename, lock, duplicate, undo/redo, filters, crop/reset, draft round-trip, brush, unsafe draft rejection.",
);
process.exit(0);
