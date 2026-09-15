import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { Canvas, FabricImage, ActiveSelection } from "fabric/node";
import { createCanvas } from "canvas";

// Run the same browser command modules against Fabric's Node canvas adapter.
await fs.mkdir(".sites-runtime/tests", { recursive: true });
const editorSource = (await fs.readFile("src/editor.js", "utf8"))
  .replace("from 'fabric'", "from 'fabric/node'")
  .replace('from "fabric"', 'from "fabric/node"')
  .replace(/import WebFont from ['"]webfontloader['"];?/, "const WebFont = {};")
  .replace(/from ['"]\.\/store['"]/, 'from "../../src/store.js"');
const advancedSource = (await fs.readFile("src/advanced.js", "utf8"))
  .replace("from 'fabric'", "from 'fabric/node'")
  .replace('from "fabric"', 'from "fabric/node"')
  .replace(/from ['"]\.\/store['"]/, 'from "../../src/store.js"')
  .replace(/from ['"]\.\/editor['"]/, 'from "./editor.mjs"');
await fs.writeFile(".sites-runtime/tests/editor.mjs", editorSource);
await fs.writeFile(".sites-runtime/tests/advanced.mjs", advancedSource);
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
await c.dispose();
console.log(
  "PASS: templates, gradients, shadows, flip, alignment, masks, rename, lock, duplicate, undo/redo, filters, crop/reset, draft round-trip, brush, unsafe draft rejection.",
);
process.exit(0);
