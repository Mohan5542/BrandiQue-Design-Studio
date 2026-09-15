import { readPsd, writePsd } from "ag-psd";
import { FabricImage, util } from "fabric";
import { useStudio, notify } from "./store";
import { transaction, changed } from "./editor";
const fromBlend = {
  normal: "source-over",
  multiply: "multiply",
  screen: "screen",
  overlay: "overlay",
  darken: "darken",
  lighten: "lighten",
  difference: "difference",
  exclusion: "exclusion",
  "soft light": "soft-light",
  "hard light": "hard-light",
};
const toBlend = Object.fromEntries(
  Object.entries(fromBlend).map(([a, b]) => [b, a]),
);
export async function importPsd(file) {
  const bytes = await file.arrayBuffer(),
    head = new DataView(bytes);
  if (
    bytes.byteLength < 26 ||
    head.getUint32(0) !== 0x38425053 ||
    head.getUint16(4) !== 1
  )
    throw Error("Choose a standard PSD file. PSB is not supported.");
  const height = head.getUint32(14),
    width = head.getUint32(18);
  if (
    width < 1 ||
    height < 1 ||
    width > 8192 ||
    height > 8192 ||
    width * height > 16_000_000
  )
    throw Error("PSD exceeds the 16-megapixel import limit.");
  if (head.getUint16(22) !== 8 || head.getUint16(24) !== 3)
    throw Error("Save the PSD as 8-bit RGB before importing.");
  const structure = readPsd(bytes, {
    skipLayerImageData: true,
    skipCompositeImageData: true,
    skipThumbnail: true,
  });
  let pixels = width * height,
    count = 0;
  function inspect(layers) {
    for (const l of layers || []) {
      count++;
      pixels +=
        Math.max(0, (l.right || 0) - (l.left || 0)) *
        Math.max(0, (l.bottom || 0) - (l.top || 0));
      inspect(l.children);
    }
  }
  inspect(structure.children);
  if (count > 100 || pixels > 50_000_000)
    throw Error(
      "PSD has too many layers or decoded pixels for this browser editor.",
    );
  const psd = readPsd(bytes, { skipThumbnail: true }),
    canvas = useStudio.getState().canvas,
    objects = [];
  function walk(layers, opacity = 1, visible = true) {
    for (const l of layers || []) {
      if (l.children) {
        walk(l.children, opacity * (l.opacity ?? 1), visible && !l.hidden);
        continue;
      }
      if (l.canvas) {
        objects.push(
          new FabricImage(l.canvas, {
            left: l.left || 0,
            top: l.top || 0,
            originX: "left",
            originY: "top",
            name: l.name || "PSD layer",
            id: crypto.randomUUID(),
            opacity: opacity * (l.opacity ?? 1),
            visible: visible && !l.hidden,
            globalCompositeOperation: fromBlend[l.blendMode] || "source-over",
          }),
        );
      }
    }
  }
  walk(psd.children);
  if (!objects.length && psd.canvas)
    objects.push(
      new FabricImage(psd.canvas, {
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
        name: "PSD composite",
      }),
    );
  if (!objects.length)
    throw Error("This PSD contains no supported raster preview.");
  transaction("Import PSD raster layers", () => {
    canvas.clear();
    canvas.backgroundColor = "transparent";
    canvas.add(...objects);
    useStudio.setState({
      width,
      height,
      title: file.name.replace(/\.psd$/i, ""),
      fit: true,
      tool: "select",
    });
  });
  window.dispatchEvent(new Event("studio-fit"));
  notify(
    "PSD raster layers imported. Unsupported editable features use their pixel previews.",
  );
}
export function buildPsd() {
  const s = useStudio.getState(),
    c = s.canvas;
  if (!c) throw Error("Canvas is not ready.");
  if (s.width * s.height > 16_000_000 || c.getObjects().length > 60)
    throw Error("PSD export is limited to 16 megapixels and 60 layers.");
  const children = [];
  let total = s.width * s.height;
  if (c.backgroundColor && c.backgroundColor !== "transparent") {
    const bg = util.createCanvasElement();
    bg.width = s.width;
    bg.height = s.height;
    const ctx = bg.getContext("2d");
    ctx.fillStyle = c.backgroundColor;
    ctx.fillRect(0, 0, s.width, s.height);
    children.push({ name: "Canvas background", canvas: bg });
  }
  for (const o of c.getObjects()) {
    const bound = o.getBoundingRect();
    total += Math.ceil(bound.width) * Math.ceil(bound.height);
    if (total > 50_000_000)
      throw Error("PSD export exceeds the pixel memory limit.");
    const visible = o.visible,
      opacity = o.opacity;
    o.visible = true;
    o.opacity = 1;
    let rendered;
    try {
      rendered = o.toCanvasElement({
        enableRetinaScaling: false,
        multiplier: 1,
      });
    } finally {
      o.visible = visible;
      o.opacity = opacity;
    }
    children.push({
      name: o.name || "Layer",
      left: Math.floor(bound.left),
      top: Math.floor(bound.top),
      canvas: rendered,
      opacity,
      hidden: !visible,
      blendMode: toBlend[o.globalCompositeOperation] || "normal",
    });
  }
  const viewport = [...c.viewportTransform],
    width = c.width,
    height = c.height;
  let composite;
  try {
    c.setDimensions({ width: s.width, height: s.height });
    c.setViewportTransform([1, 0, 0, 1, 0, 0]);
    composite = c.toCanvasElement(1);
  } finally {
    c.setDimensions({ width, height });
    c.setViewportTransform(viewport);
    c.requestRenderAll();
  }
  return writePsd({
    width: s.width,
    height: s.height,
    canvas: composite,
    children,
  });
}
export function downloadPsd() {
  try {
    const buffer = buildPsd(),
      url = URL.createObjectURL(
        new Blob([buffer], { type: "image/vnd.adobe.photoshop" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = (useStudio.getState().title || "brandique") + ".psd";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    notify(
      "Layered raster PSD downloaded. Use JSON to preserve BrandiQue text and vectors.",
    );
  } catch (error) {
    notify(error.message);
  }
}
