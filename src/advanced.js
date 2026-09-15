import {
  PencilBrush,
  Circle,
  Rect,
  Gradient,
  Shadow,
  Point,
  ActiveSelection,
  FabricImage,
  filters,
} from "fabric";
import { useStudio, notify } from "./store";
import { changed, sync, transaction } from "./editor";
const current = () => useStudio.getState().canvas;
const selected = () => current()?.getActiveObject();

export function setTool(tool) {
  const c = current();
  if (!c) return;
  if (!["select", "brush", "hand", "eyedropper"].includes(tool)) return;
  c.isDrawingMode = tool === "brush";
  c.selection = tool === "select";
  c.defaultCursor =
    tool === "hand" ? "grab" : tool === "eyedropper" ? "crosshair" : "default";
  c.skipTargetFind = tool === "hand" || tool === "eyedropper";
  if (tool === "brush") {
    c.discardActiveObject();
    c.freeDrawingBrush = new PencilBrush(c);
    configureBrush();
  }
  useStudio.setState({ tool });
  sync();
}
export function configureBrush(patch = {}) {
  useStudio.setState(patch);
  const s = useStudio.getState(),
    c = s.canvas;
  if (c?.freeDrawingBrush) {
    c.freeDrawingBrush.width = s.brushSize;
    c.freeDrawingBrush.color =
      s.brushColor +
      Math.round(s.brushOpacity * 2.55)
        .toString(16)
        .padStart(2, "0");
    c.freeDrawingBrush.limitedToCanvasSize = true;
  }
}
export function attachEvents(c, container) {
  let pan = null,
    space = false,
    previousTool = "select";
  const off = [];
  off.push(
    c.on("path:created", ({ path }) => {
      path.name = "Brush stroke";
      changed("Brush stroke");
    }),
  );
  off.push(
    c.on("object:moving", ({ target }) => {
      const s = useStudio.getState();
      if (s.snap) {
        target.set({
          left: Math.round(target.left / s.gridSize) * s.gridSize,
          top: Math.round(target.top / s.gridSize) * s.gridSize,
        });
        target.setCoords();
      }
    }),
  );
  off.push(
    c.on("mouse:down", ({ e }) => {
      const s = useStudio.getState();
      if (s.tool === "hand" || space) {
        pan = {
          x: e.clientX,
          y: e.clientY,
          left: container.scrollLeft,
          top: container.scrollTop,
        };
        c.setCursor("grabbing");
      } else if (s.tool === "eyedropper") {
        try {
          const p = c.getViewportPoint(e),
            ratio = c.getRetinaScaling();
          const pixel = c
            .getContext()
            .getImageData(
              Math.floor(p.x * ratio),
              Math.floor(p.y * ratio),
              1,
              1,
            ).data;
          const color =
            "#" +
            [...pixel]
              .slice(0, 3)
              .map((v) => v.toString(16).padStart(2, "0"))
              .join("");
          const object = selected();
          if (object && !object.locked) {
            object.set("fill", color);
            changed("Sample color");
          }
          configureBrush({ brushColor: color });
          setTool("select");
          notify("Color sampled: " + color);
        } catch {
          notify("Could not sample this pixel.");
        }
      }
    }),
  );
  off.push(
    c.on("mouse:move", ({ e }) => {
      if (pan) {
        container.scrollLeft = pan.left - (e.clientX - pan.x);
        container.scrollTop = pan.top - (e.clientY - pan.y);
      }
    }),
  );
  off.push(
    c.on("mouse:up", () => {
      pan = null;
      if (useStudio.getState().tool === "hand") c.setCursor("grab");
    }),
  );
  const wheel = (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const s = useStudio.getState();
    useStudio.setState({
      fit: false,
      zoom: Math.min(3, Math.max(0.1, s.zoom * Math.exp(-e.deltaY * 0.002))),
    });
    window.dispatchEvent(new Event("studio-fit"));
  };
  container.addEventListener("wheel", wheel, { passive: false });
  const onDown = (e) => {
    if (
      e.code !== "Space" ||
      space ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) ||
      e.target.isContentEditable ||
      selected()?.isEditing ||
      document.querySelector("dialog[open]")
    )
      return;
    e.preventDefault();
    space = true;
    previousTool = useStudio.getState().tool;
    setTool("hand");
  };
  const onUp = (e) => {
    if (e.code === "Space" && space) {
      space = false;
      pan = null;
      setTool(previousTool);
    }
  };
  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  return () => {
    off.forEach((f) => f());
    container.removeEventListener("wheel", wheel);
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
  };
}
export function selectAll() {
  const c = current();
  if (!c) return;
  setTool("select");
  c.discardActiveObject();
  const objects = c.getObjects().filter((o) => o.visible && !o.locked);
  if (objects.length === 1) c.setActiveObject(objects[0]);
  else if (objects.length)
    c.setActiveObject(new ActiveSelection(objects, { canvas: c }));
  sync();
}
export function nudge(dx, dy) {
  const o = selected();
  if (!o || o.locked) return;
  o.set({ left: o.left + dx, top: o.top + dy });
  o.setCoords();
  changed("Nudge selection");
}
export function align(mode) {
  const c = current(),
    s = useStudio.getState();
  if (!c) return;
  const objects = c.getActiveObjects().filter((o) => !o.locked);
  if (!objects.length) return;
  transaction("Align " + mode, () => {
    c.discardActiveObject();
    const bounds = objects.map((o) => o.getBoundingRect());
    const area =
      objects.length === 1
        ? { left: 0, top: 0, width: s.width, height: s.height }
        : {
            left: Math.min(...bounds.map((b) => b.left)),
            top: Math.min(...bounds.map((b) => b.top)),
            width:
              Math.max(...bounds.map((b) => b.left + b.width)) -
              Math.min(...bounds.map((b) => b.left)),
            height:
              Math.max(...bounds.map((b) => b.top + b.height)) -
              Math.min(...bounds.map((b) => b.top)),
          };
    objects.forEach((o) => {
      const b = o.getBoundingRect();
      let dx = 0,
        dy = 0;
      if (mode === "left") dx = area.left - b.left;
      if (mode === "center")
        dx = area.left + area.width / 2 - b.left - b.width / 2;
      if (mode === "right") dx = area.left + area.width - b.left - b.width;
      if (mode === "top") dy = area.top - b.top;
      if (mode === "middle")
        dy = area.top + area.height / 2 - b.top - b.height / 2;
      if (mode === "bottom") dy = area.top + area.height - b.top - b.height;
      o.set({ left: o.left + dx, top: o.top + dy });
      o.setCoords();
    });
    if (objects.length === 1) c.setActiveObject(objects[0]);
    else c.setActiveObject(new ActiveSelection(objects, { canvas: c }));
  });
}
export function distribute(axis) {
  const c = current();
  if (!c) return;
  const objects = c.getActiveObjects();
  if (objects.length < 3) {
    notify("Select at least three layers to distribute.");
    return;
  }
  transaction("Distribute " + axis, () => {
    c.discardActiveObject();
    const key = axis === "horizontal" ? "left" : "top",
      size = axis === "horizontal" ? "width" : "height";
    objects.sort((a, b) => a.getBoundingRect()[key] - b.getBoundingRect()[key]);
    const first = objects[0].getBoundingRect(),
      last = objects.at(-1).getBoundingRect();
    const span = last[key] + last[size] - first[key],
      total = objects.reduce((n, o) => n + o.getBoundingRect()[size], 0),
      gap = (span - total) / (objects.length - 1);
    let at = first[key];
    objects.forEach((o) => {
      const b = o.getBoundingRect();
      o.set(key, o[key] + at - b[key]);
      o.setCoords();
      at += b[size] + gap;
    });
    c.setActiveObject(new ActiveSelection(objects, { canvas: c }));
  });
}
export function flip(axis) {
  const o = selected();
  if (!o || o.locked) return;
  o.set(
    axis === "horizontal" ? "flipX" : "flipY",
    axis === "horizontal" ? !o.flipX : !o.flipY,
  );
  changed("Flip " + axis);
}
export function renameLayer(id, name) {
  const o = current()
    ?.getObjects()
    .find((o) => o.id === id);
  if (o) {
    o.name = String(name).trim().slice(0, 70) || "Layer";
    changed("Rename layer");
  }
}
export function applyGradient(first, second, direction = "horizontal") {
  const o = selected();
  if (!o || o.locked) return;
  o.set(
    "fill",
    new Gradient({
      type: "linear",
      gradientUnits: "percentage",
      coords: {
        x1: 0,
        y1: 0,
        x2: direction === "vertical" ? 0 : 1,
        y2: direction === "horizontal" ? 0 : 1,
      },
      colorStops: [
        { offset: 0, color: first },
        { offset: 1, color: second },
      ],
    }),
  );
  changed("Gradient fill");
}
export function applyShadow(
  enabled,
  color = "#000000",
  blur = 24,
  offsetX = 8,
  offsetY = 12,
) {
  const o = selected();
  if (!o || o.locked) return;
  o.set(
    "shadow",
    enabled ? new Shadow({ color, blur, offsetX, offsetY }) : null,
  );
  changed("Layer shadow");
}
export function mask(kind) {
  const o = selected();
  if (!o || o.locked) return;
  if (kind === "none") o.clipPath = undefined;
  else if (kind === "circle")
    o.clipPath = new Circle({
      radius: Math.min(o.width, o.height) / 2,
      originX: "center",
      originY: "center",
    });
  else
    o.clipPath = new Rect({
      width: o.width,
      height: o.height,
      rx: Math.min(o.width, o.height) * 0.12,
      ry: Math.min(o.width, o.height) * 0.12,
      originX: "center",
      originY: "center",
    });
  o.dirty = true;
  changed("Clipping mask");
}
export const adjustmentDefaults = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  grayscale: false,
  sepia: false,
  invert: false,
};
export function adjustImage(patch) {
  const o = selected();
  if (!(o instanceof FabricImage) || o.locked) return;
  const a = { ...adjustmentDefaults, ...o.adjustments, ...patch };
  o.adjustments = a;
  o.filters = [];
  if (a.brightness)
    o.filters.push(new filters.Brightness({ brightness: a.brightness / 100 }));
  if (a.contrast)
    o.filters.push(new filters.Contrast({ contrast: a.contrast / 100 }));
  if (a.saturation)
    o.filters.push(new filters.Saturation({ saturation: a.saturation / 100 }));
  if (a.blur) o.filters.push(new filters.Blur({ blur: a.blur / 100 }));
  if (a.grayscale) o.filters.push(new filters.Grayscale());
  if (a.sepia) o.filters.push(new filters.Sepia());
  if (a.invert) o.filters.push(new filters.Invert());
  o.applyFilters();
  o.dirty = true;
  changed("Image adjustments");
}
export function cropImage({ left = 0, top = 0, right = 0, bottom = 0 }) {
  const o = selected();
  if (!(o instanceof FabricImage) || o.locked) return;
  const values = [left, top, right, bottom].map(Number);
  if (
    values.some((n) => !Number.isFinite(n) || n < 0) ||
    left + right >= 95 ||
    top + bottom >= 95
  ) {
    notify("Keep at least 5% of the image on each axis.");
    return;
  }
  const el = o.getOriginalSize(),
    center = o.getCenterPoint();
  o.set({
    cropX: (el.width * left) / 100,
    cropY: (el.height * top) / 100,
    width: el.width * (1 - (left + right) / 100),
    height: el.height * (1 - (top + bottom) / 100),
  });
  o.setPositionByOrigin(center, "center", "center");
  o.setCoords();
  changed("Crop image");
}
export function rasterize() {
  const o = selected(),
    c = current();
  if (!o || o.locked) return;
  const bound = o.getBoundingRect(),
    el = o.toCanvasElement({ multiplier: 1, enableRetinaScaling: false });
  const replacement = new FabricImage(el, {
    left: bound.left,
    top: bound.top,
    originX: "left",
    originY: "top",
    name: (o.name || "Layer") + " (raster)",
    id: crypto.randomUUID(),
  });
  transaction("Rasterize layer", () => {
    const index = c.getObjects().indexOf(o);
    c.discardActiveObject();
    c.remove(o);
    c.insertAt(index, replacement);
    c.setActiveObject(replacement);
  });
}
export function setBackground(color) {
  const c = current();
  if (!c) return;
  c.backgroundColor = color;
  changed("Canvas background");
}
