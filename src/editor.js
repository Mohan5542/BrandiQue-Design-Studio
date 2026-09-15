import {
  Canvas,
  Rect,
  Circle,
  Triangle,
  Textbox,
  FabricImage,
  FabricObject,
  Group,
  ActiveSelection,
  loadSVGFromString,
  util,
} from "fabric";
import WebFont from "webfontloader";
import { useStudio, notify } from "./store";
export const accent = "#FBFF00";
export const selectionStyle = {
  borderColor: accent,
  cornerColor: accent,
  cornerStrokeColor: "#1e1f1f",
  cornerSize: 9,
  transparentCorners: false,
  padding: 3,
};
Object.assign(FabricObject.ownDefaults, selectionStyle);
FabricObject.customProperties = ["id", "name", "locked", "adjustments"];
let history = [],
  cursor = -1,
  busy = false;
const canvas = () => useStudio.getState().canvas;
export const snapshot = () => {
  const s = useStudio.getState();
  return {
    format: "brandique",
    version: 1,
    title: s.title,
    width: s.width,
    height: s.height,
    canvas: s.canvas.toObject(),
  };
};
function metadata(o) {
  o.id ||= crypto.randomUUID();
  o.name ||= o.text?.slice(0, 28) || o.type || "Layer";
  o.set(selectionStyle);
  if (o.getObjects) o.getObjects().forEach(metadata);
  return o;
}
export function sync() {
  const c = canvas();
  if (!c) return;
  const selected = c.getActiveObject();
  selected?.set(selectionStyle);
  useStudio.setState({
    layers: c
      .getObjects()
      .map((o) => ({
        id: metadata(o).id,
        name: o.name,
        type: o.type,
        visible: o.visible,
        locked: !!o.locked,
      }))
      .reverse(),
    selected: selected
      ? {
          id: selected.id,
          type: selected.type,
          left: Math.round(selected.left),
          top: Math.round(selected.top),
          width: Math.round(selected.getScaledWidth()),
          height: Math.round(selected.getScaledHeight()),
          angle: Math.round(selected.angle),
          fill: typeof selected.fill === "string" ? selected.fill : "#ffffff",
          opacity: Math.round(selected.opacity * 100),
          fontFamily: selected.fontFamily,
          fontSize: selected.fontSize,
          text: selected.text,
          fontWeight: selected.fontWeight,
          fontStyle: selected.fontStyle,
          underline: selected.underline,
          textAlign: selected.textAlign,
          charSpacing: selected.charSpacing,
          lineHeight: selected.lineHeight,
          stroke: selected.stroke,
          strokeWidth: selected.strokeWidth,
          blendMode: selected.globalCompositeOperation,
          shadow: selected.shadow ? { ...selected.shadow } : null,
          adjustments: selected.adjustments || {},
          isImage: selected instanceof FabricImage,
          hasMask: !!selected.clipPath,
          hasGradient: typeof selected.fill === "object",
          flipX: selected.flipX,
          flipY: selected.flipY,
        }
      : null,
    selectionCount: c.getActiveObjects().length,
    canUndo: cursor > 0,
    canRedo: cursor < history.length - 1,
    history: history.map((h, i) => ({
      index: i,
      label: h.label,
      current: i === cursor,
    })),
    historyIndex: cursor,
  });
  c.requestRenderAll();
}
export function changed(label = "Edit design") {
  if (busy || !canvas()) return;
  const json = JSON.stringify(snapshot());
  if (history[cursor]?.json !== json) {
    history = history.slice(0, cursor + 1);
    history.push({
      json,
      label: typeof label === "string" ? label : "Edit design",
    });
    if (history.length > 50) history.shift();
    while (
      history.length > 2 &&
      history.reduce((size, h) => size + h.json.length, 0) > 32_000_000
    )
      history.shift();
    cursor = history.length - 1;
    useStudio.setState({
      revision: useStudio.getState().revision + 1,
      saveStatus: "Unsaved changes",
      dirty: true,
    });
  }
  sync();
}
export function transaction(label, operation) {
  if (busy) return;
  busy = true;
  try {
    operation();
  } finally {
    busy = false;
  }
  changed(label);
}
export async function jumpTo(index) {
  if (busy || index < 0 || index >= history.length || index === cursor) return;
  const oldHistory = history;
  await loadDocument(JSON.parse(history[index].json), false);
  history = oldHistory;
  cursor = index;
  useStudio.setState({ dirty: true, saveStatus: "Unsaved changes" });
  sync();
}
const text = (value, left, top, size, opts = {}) =>
  new Textbox(value, {
    left,
    top,
    width: 900,
    fontSize: size,
    fontFamily: "Inter",
    fill: "#171817",
    originX: "left",
    originY: "top",
    ...opts,
  });
const rect = (left, top, width, height, fill, opts = {}) =>
  new Rect({
    left,
    top,
    width,
    height,
    fill,
    originX: "left",
    originY: "top",
    ...opts,
  });
export function seed(kind = "noise") {
  const c = canvas();
  if (!c) return;
  busy = true;
  c.clear();
  useStudio.setState({
    width: 1080,
    height: 1080,
    title:
      kind === "noise"
        ? "Make some noise"
        : kind === "type"
          ? "Less, but better"
          : "A fresh perspective",
    fit: true,
  });
  c.backgroundColor =
    kind === "type" ? "#e9e6dc" : kind === "fresh" ? "#c2d8ed" : "#e9e9df";
  if (kind === "noise") {
    c.add(
      rect(36, 36, 1008, 1008, "transparent", {
        stroke: "#191a17",
        strokeWidth: 2,
        name: "Frame",
      }),
    );
    c.add(
      text("BRANDIQUE®", 73, 71, 25, {
        fontWeight: 700,
        width: 400,
        name: "Brand signature",
      }),
      text("EXPERIMENT NO. 001", 678, 75, 18, {
        charSpacing: 100,
        width: 335,
        textAlign: "right",
        name: "Edition",
      }),
    );
    c.add(rect(75, 146, 930, 2, "#191a17", { name: "Top divider" }));
    c.add(
      text("MAKE SOME", 68, 185, 180, {
        fontFamily: "Bebas Neue",
        width: 970,
        charSpacing: -15,
        lineHeight: 0.8,
        name: "Make some",
      }),
    );
    c.add(
      rect(61, 405, 951, 250, accent, { angle: -3, name: "Neon highlight" }),
    );
    c.add(
      text("NOISE.", 83, 358, 320, {
        fontFamily: "Bebas Neue",
        width: 900,
        charSpacing: -20,
        name: "Noise headline",
      }),
    );
    const rings = [];
    for (let i = 0; i < 6; i++)
      rings.push(
        new Circle({
          left: i * 17,
          top: i * 17,
          radius: 104 - i * 13,
          stroke: "#1a1b18",
          strokeWidth: 2,
          fill: "transparent",
          originX: "left",
          originY: "top",
        }),
      );
    c.add(
      new Group(rings, {
        left: 754,
        top: 744,
        originX: "left",
        originY: "top",
        name: "Orbit / graphic",
      }),
    );
    c.add(
      text(
        "GOOD DESIGN DOESN’T\nASK FOR ATTENTION.\nIT TAKES IT.",
        77,
        744,
        32,
        { fontWeight: 600, lineHeight: 1.18, width: 650, name: "Manifesto" },
      ),
    );
    c.add(
      rect(76, 960, 927, 2, "#191a17", { name: "Bottom divider" }),
      text("BREAK THE ORDINARY.", 78, 986, 17, {
        charSpacing: 100,
        width: 600,
        name: "Footer",
      }),
      text("2026 ↗", 850, 983, 24, {
        width: 155,
        textAlign: "right",
        name: "Year",
      }),
    );
  } else if (kind === "type") {
    c.add(
      text("THE ART OF SIMPLICITY", 75, 80, 23, {
        charSpacing: 200,
        name: "Eyebrow",
      }),
      text("Less,\nbut\nbetter.", 64, 230, 175, {
        fontFamily: "DM Sans",
        fontWeight: 700,
        lineHeight: 0.94,
        width: 950,
        name: "Headline",
      }),
      rect(80, 918, 120, 8, "#df482c", { name: "Accent" }),
      text("A LITTLE SPACE. A LOT OF POSSIBILITY.", 80, 970, 19, {
        name: "Caption",
      }),
    );
  } else {
    c.add(
      text("A FRESH", 68, 90, 154, {
        fontFamily: "Bebas Neue",
        name: "Headline",
      }),
      text("PERSPECTIVE", 68, 256, 145, {
        fontFamily: "Bebas Neue",
        name: "Perspective",
      }),
      new Circle({
        left: 540,
        top: 695,
        radius: 230,
        fill: "#3567dc",
        name: "Blue circle",
      }),
      rect(75, 914, 930, 2, "#171817"),
      text("MAKE ROOM FOR SOMETHING NEW.", 76, 966, 23, { name: "Caption" }),
    );
  }
  c.getObjects().forEach(metadata);
  busy = false;
  c.discardActiveObject();
  changed("Apply template");
  window.dispatchEvent(new Event("studio-fit"));
}
export function initialize(element) {
  const c = new Canvas(element, {
    width: 1080,
    height: 1080,
    backgroundColor: "#e9e9df",
    preserveObjectStacking: true,
    selectionColor: "rgba(251,255,0,.12)",
    selectionBorderColor: accent,
  });
  useStudio.setState({ canvas: c });
  const off = [
    "object:modified",
    "object:added",
    "object:removed",
    "text:changed",
  ].map((e) =>
    c.on(e, () =>
      changed(
        {
          "object:modified": "Transform object",
          "object:added": "Add layer",
          "object:removed": "Delete layer",
          "text:changed": "Edit text",
        }[e],
      ),
    ),
  );
  ["selection:created", "selection:updated", "selection:cleared"].forEach((e) =>
    off.push(c.on(e, sync)),
  );
  let alive = true;
  const ready = (async () => {
    await new Promise((resolve) =>
      WebFont.load({
        custom: { families: ["Inter", "Bebas Neue", "DM Sans"] },
        active: resolve,
        inactive: resolve,
        timeout: 2500,
      }),
    );
    await document.fonts.ready;
    if (!alive) return;
    seed();
    useStudio.setState({
      ready: true,
      dirty: false,
      saveStatus: "Ready · save as draft",
    });
    sync();
    window.dispatchEvent(new Event("studio-fit"));
  })();
  return {
    c,
    ready,
    dispose() {
      alive = false;
      off.forEach((f) => f());
      if (canvas() === c) useStudio.setState({ canvas: null, ready: false });
      void c.dispose().catch(console.error);
    },
  };
}
export function add(kind) {
  const c = canvas();
  if (!c || busy) return;
  c.isDrawingMode = false;
  c.skipTargetFind = false;
  c.selection = true;
  c.defaultCursor = "default";
  useStudio.setState({ tool: "select" });
  const s = useStudio.getState();
  let o;
  const pos = { left: s.width / 2, top: s.height / 2 };
  if (kind === "text")
    o = new Textbox("Your next big idea", {
      ...pos,
      width: 600,
      fontFamily: "Inter",
      fontSize: 64,
      fontWeight: 700,
      fill: "#171817",
      name: "Your text",
    });
  else if (kind === "circle")
    o = new Circle({ ...pos, radius: 130, fill: accent, name: "Circle" });
  else if (kind === "triangle")
    o = new Triangle({
      ...pos,
      width: 260,
      height: 250,
      fill: accent,
      name: "Triangle",
    });
  else if (kind === "line")
    o = new Rect({
      ...pos,
      width: 440,
      height: 8,
      fill: "#171817",
      name: "Line",
    });
  else
    o = new Rect({
      ...pos,
      width: 280,
      height: 220,
      fill: accent,
      rx: kind === "rounded" ? 35 : 0,
      ry: kind === "rounded" ? 35 : 0,
      name: kind === "rounded" ? "Rounded rectangle" : "Rectangle",
    });
  metadata(o);
  c.add(o);
  c.setActiveObject(o);
  changed();
}
export function update(props) {
  const c = canvas(),
    o = c?.getActiveObject();
  if (!o || o.locked) return;
  o.set(props);
  if ("text" in props) o.name = props.text.slice(0, 28) || "Text";
  o.setCoords();
  changed("Edit properties");
}
export function selectLayer(id) {
  const c = canvas(),
    o = c?.getObjects().find((o) => o.id === id);
  if (!o) return;
  c.discardActiveObject();
  if (!o.locked && o.visible) c.setActiveObject(o);
  sync();
}
export function layerAction(id, action) {
  const c = canvas(),
    o = c?.getObjects().find((o) => o.id === id);
  if (!o) return;
  if (action === "delete") c.remove(o);
  if (action === "hide") {
    o.visible = !o.visible;
    if (!o.visible) c.discardActiveObject();
  }
  if (action === "lock") {
    o.locked = !o.locked;
    o.set({
      selectable: !o.locked,
      evented: !o.locked,
      lockMovementX: o.locked,
      lockMovementY: o.locked,
      lockScalingX: o.locked,
      lockScalingY: o.locked,
      lockRotation: o.locked,
    });
    c.discardActiveObject();
  }
  if (action === "up") c.bringObjectForward(o);
  if (action === "down") c.sendObjectBackwards(o);
  changed();
}
export function reorder(id, targetId) {
  const c = canvas(),
    objects = c.getObjects(),
    o = objects.find((o) => o.id === id),
    target = objects.find((o) => o.id === targetId);
  if (o && target) {
    c.moveObjectTo(o, objects.indexOf(target));
    changed();
  }
}
export function removeSelected() {
  const c = canvas();
  if (!c) return;
  const selected = c.getActiveObjects();
  c.discardActiveObject();
  c.remove(...selected.filter((o) => !o.locked));
  changed();
}
export async function duplicate() {
  const c = canvas(),
    o = c?.getActiveObject();
  if (!o) return;
  const copy = await o.clone();
  if (canvas() !== c) return;
  function ids(obj) {
    obj.id = crypto.randomUUID();
    obj.getObjects?.().forEach(ids);
  }
  ids(copy);
  copy.set({
    left: o.left + 28,
    top: o.top + 28,
    name: (o.name || "Selection") + " copy",
  });
  c.discardActiveObject();
  if (copy instanceof ActiveSelection) {
    copy.canvas = c;
    copy.forEachObject((obj) => c.add(obj));
    copy.setCoords();
  } else c.add(copy);
  c.setActiveObject(copy);
  changed();
}
export function groupSelection() {
  const c = canvas(),
    o = c?.getActiveObject();
  if (!o) return;
  if (o instanceof ActiveSelection) {
    const objects = c.getActiveObjects();
    c.discardActiveObject();
    busy = true;
    c.remove(...objects);
    const g = new Group(objects, { name: "Group" });
    c.add(metadata(g));
    c.setActiveObject(g);
    busy = false;
  } else if (o instanceof Group) {
    c.discardActiveObject();
    busy = true;
    const children = o.removeAll();
    c.remove(o);
    c.add(...children);
    busy = false;
  }
  changed();
}
export function resize(width, height) {
  if (!canvas()) return;
  useStudio.setState({ width, height, fit: true });
  window.dispatchEvent(new Event("studio-fit"));
  changed();
}
export function validateDocument(doc) {
  if (
    !doc ||
    doc.format !== "brandique" ||
    doc.version !== 1 ||
    !Number.isFinite(doc.width) ||
    !Number.isFinite(doc.height) ||
    doc.width < 100 ||
    doc.height < 100 ||
    doc.width > 8192 ||
    doc.height > 8192 ||
    !Array.isArray(doc.canvas?.objects) ||
    doc.canvas.objects.length > 500
  )
    throw Error("This is not a supported BrandiQue draft.");
  let count = 0;
  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (++count > 12000) throw Error("Draft is too complex.");
    for (const [key, v] of Object.entries(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key))
        throw Error("Invalid draft.");
      if (
        key === "src" &&
        (typeof v !== "string" ||
          !/^data:image\/(png|jpeg|webp);base64,/.test(v))
      )
        throw Error("Draft images must be embedded PNG, JPEG, or WebP files.");
      if (typeof v === "number" && !Number.isFinite(v))
        throw Error("Invalid numeric value.");
      visit(v);
    }
  }
  visit(doc.canvas);
  return doc;
}
export async function loadDocument(doc, record = true) {
  validateDocument(doc);
  const c = canvas();
  if (!c) return;
  busy = true;
  try {
    await c.loadFromJSON(doc.canvas);
    if (canvas() !== c) return;
    c.getObjects().forEach(metadata);
    useStudio.setState({
      title: String(doc.title || "Untitled design").slice(0, 100),
      width: doc.width,
      height: doc.height,
      fit: true,
    });
    c.discardActiveObject();
  } finally {
    busy = false;
  }
  if (record) changed();
  else {
    history = [{ json: JSON.stringify(snapshot()), label: "Open document" }];
    cursor = 0;
    sync();
    useStudio.setState({ saveStatus: "Draft opened", dirty: false });
  }
  window.dispatchEvent(new Event("studio-fit"));
}
export async function travel(direction) {
  await jumpTo(cursor + direction);
}
function download(blob, extension) {
  const a = document.createElement("a"),
    url = URL.createObjectURL(blob);
  a.href = url;
  a.download =
    (useStudio.getState().title || "brandique").replace(/[^a-z0-9-_ ]/gi, "") +
    "." +
    extension;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
export function exportFile(format, scale = 1) {
  const c = canvas();
  if (!c) return;
  try {
    if (format === "json") {
      download(
        new Blob([JSON.stringify(snapshot())], { type: "application/json" }),
        "brandique.json",
      );
      useStudio.setState({ dirty: false, saveStatus: "Draft downloaded" });
      notify("Editable draft downloaded");
      return;
    }
    const s = useStudio.getState();
    if (s.width * s.height * scale * scale > 40_000_000)
      throw Error("Choose a smaller export size.");
    if (format === "svg") {
      const old = c.svgViewportTransformation,
        oldWidth = c.width,
        oldHeight = c.height;
      c.svgViewportTransformation = false;
      c.setDimensions({ width: s.width, height: s.height });
      try {
        const svg = c.toSVG({
          width: String(s.width),
          height: String(s.height),
          viewBox: { x: 0, y: 0, width: s.width, height: s.height },
        });
        download(new Blob([svg], { type: "image/svg+xml" }), "svg");
      } finally {
        c.svgViewportTransformation = old;
        c.setDimensions({ width: oldWidth, height: oldHeight });
        c.requestRenderAll();
      }
      notify("SVG downloaded. Install matching fonts when opening elsewhere.");
      return;
    }
    const viewport = [...c.viewportTransform],
      w = c.width,
      h = c.height;
    let output;
    try {
      c.setDimensions({ width: s.width, height: s.height });
      c.setViewportTransform([1, 0, 0, 1, 0, 0]);
      output = c.toCanvasElement(scale);
    } finally {
      c.setDimensions({ width: w, height: h });
      c.setViewportTransform(viewport);
      c.requestRenderAll();
    }
    output.toBlob(
      (blob) => {
        if (blob) {
          download(blob, format === "jpeg" ? "jpg" : format);
          notify(format.toUpperCase() + " downloaded");
        } else notify("Export failed. Try a smaller size.");
      },
      "image/" + format,
      0.94,
    );
  } catch (e) {
    notify(e.message || "Unable to export this design.");
  }
}
export async function importFiles(files, point) {
  const c = canvas();
  for (const file of files) {
    try {
      if (file.size > 20 * 1024 * 1024)
        throw Error("Please choose a file under 20 MB.");
      if (file.name.endsWith(".json")) {
        await loadDocument(JSON.parse(await file.text()));
        notify("Draft opened");
        continue;
      }
      let object;
      if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) {
        const source = await file.text();
        const dom = new DOMParser().parseFromString(source, "image/svg+xml");
        if (
          dom.querySelector("parsererror") ||
          dom.documentElement.localName !== "svg"
        )
          throw Error("Invalid SVG file.");
        for (const node of dom.querySelectorAll("*")) {
          if (
            [
              "script",
              "foreignObject",
              "image",
              "use",
              "style",
              "iframe",
              "audio",
              "video",
            ].includes(node.localName)
          )
            throw Error("SVG must contain self-contained vector shapes.");
          for (const attr of node.attributes) {
            if (
              /^on/i.test(attr.name) ||
              /href/i.test(attr.name) ||
              /url\(|@import/i.test(attr.value)
            )
              throw Error("SVG contains unsupported external content.");
          }
        }
        const result = await loadSVGFromString(source);
        object = util.groupSVGElements(
          result.objects.filter(Boolean),
          result.options,
        );
      } else {
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
          throw Error("Use PNG, JPG, WebP, SVG, or a BrandiQue JSON draft.");
        const bmp = await createImageBitmap(file);
        if (bmp.width * bmp.height > 50_000_000) {
          bmp.close();
          throw Error("Image is too large. Resize it before importing.");
        }
        const el = document.createElement("canvas"),
          ratio = Math.min(1, 4096 / Math.max(bmp.width, bmp.height));
        el.width = bmp.width * ratio;
        el.height = bmp.height * ratio;
        el.getContext("2d").drawImage(bmp, 0, 0, el.width, el.height);
        bmp.close();
        object = await FabricImage.fromURL(el.toDataURL("image/png"));
      }
      if (canvas() !== c) {
        object.dispose();
        return;
      }
      const s = useStudio.getState();
      object.scale(
        Math.min(
          (s.width * 0.65) / object.width,
          (s.height * 0.65) / object.height,
          1,
        ),
      );
      object.set({
        left: point?.x ?? s.width / 2,
        top: point?.y ?? s.height / 2,
        name: file.name.slice(0, 45),
      });
      c.add(metadata(object));
      c.setActiveObject(object);
      changed();
      notify("Asset added to your canvas");
    } catch (e) {
      notify(e.message || "This file could not be imported.");
    }
  }
}
export function newDocument() {
  const c = canvas();
  busy = true;
  c.clear();
  c.backgroundColor = "#ffffff";
  busy = false;
  useStudio.setState({ title: "Untitled design" });
  changed("New document");
  notify("Your new canvas is ready");
}
