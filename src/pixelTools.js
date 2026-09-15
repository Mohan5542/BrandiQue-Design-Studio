import { FabricImage, util } from "fabric";
import { useStudio, notify } from "./store";
import { changed, transaction, sync } from "./editor";
import { setTool } from "./advanced";
export const pixelModes = [
  "paint",
  "eraser",
  "clone",
  "fill",
  "magic-erase",
  "marquee",
  "dodge",
  "burn",
];
let targetId = null,
  selection = null,
  inverted = false,
  cloneSource = null,
  stroke = null;
const c = () => useStudio.getState().canvas;
const target = () =>
  c()
    ?.getObjects()
    .find((o) => o.id === targetId);
function freshCanvas(w, h) {
  const el = util.createCanvasElement();
  el.width = w;
  el.height = h;
  return el;
}
export function activatePixelTool(mode) {
  if (!pixelModes.includes(mode) || !c()) return;
  const o = c().getActiveObject() || target();
  if (!(o instanceof FabricImage) || o.locked) {
    notify("Select an unlocked image or create a paint layer first.");
    return;
  }
  if (targetId !== o.id) {
    selection = null;
    inverted = false;
    cloneSource = null;
  }
  targetId = o.id;
  setTool("select");
  c().isDrawingMode = false;
  c().selection = false;
  c().skipTargetFind = true;
  c().defaultCursor = "crosshair";
  useStudio.setState({
    tool: mode,
    tab: "pixels",
    pixelTarget: o.name || "Image layer",
  });
  sync();
}
export function newPaintLayer() {
  const s = useStudio.getState();
  if (!s.canvas) return;
  const el = freshCanvas(s.width, s.height),
    o = new FabricImage(el, {
      left: 0,
      top: 0,
      originX: "left",
      originY: "top",
      name: "Paint layer",
      id: crypto.randomUUID(),
    });
  transaction("New paint layer", () => {
    s.canvas.add(o);
    s.canvas.setActiveObject(o);
  });
  activatePixelTool("paint");
}
function selectionState() {
  useStudio.setState({
    pixelSelection: selection ? { ...selection, inverted } : null,
  });
  c()?.requestRenderAll();
}
export function deselectPixels() {
  selection = null;
  inverted = false;
  selectionState();
}
export function invertPixels() {
  if (!selection) {
    notify("Draw a rectangular selection first.");
    return;
  }
  inverted = !inverted;
  selectionState();
}
function inSelection(x, y) {
  if (!selection) return true;
  const inside =
    x >= selection.x &&
    x < selection.x + selection.w &&
    y >= selection.y &&
    y < selection.y + selection.h;
  return inverted ? !inside : inside;
}
function workCanvas(o) {
  const el = o.getElement(),
    work = freshCanvas(
      el.width || el.naturalWidth,
      el.height || el.naturalHeight,
    );
  work.getContext("2d").drawImage(el, 0, 0);
  return work;
}
function commitPixels(o, work, label) {
  o.filters = [];
  o.adjustments = {};
  o.setElement(work, { width: o.width, height: o.height });
  o.dirty = true;
  o.setCoords();
  c().setActiveObject(o);
  changed(label);
}
function clipSelection(ctx, w, h) {
  if (!selection) return;
  ctx.beginPath();
  if (inverted) ctx.rect(0, 0, w, h);
  ctx.rect(selection.x, selection.y, selection.w, selection.h);
  ctx.clip(inverted ? "evenodd" : "nonzero");
}
export function clearPixels() {
  const o = target();
  if (!o) return;
  const work = workCanvas(o),
    ctx = work.getContext("2d");
  ctx.save();
  clipSelection(ctx, work.width, work.height);
  ctx.clearRect(0, 0, work.width, work.height);
  ctx.restore();
  commitPixels(o, work, "Clear selected pixels");
}
export function copyPixels() {
  const o = target();
  if (!o) return;
  const work = workCanvas(o),
    copy = freshCanvas(work.width, work.height),
    ctx = copy.getContext("2d");
  ctx.save();
  clipSelection(ctx, copy.width, copy.height);
  ctx.drawImage(work, 0, 0);
  ctx.restore();
  const layer = new FabricImage(copy, {
    ...o.toObject(),
    id: crypto.randomUUID(),
    name: (o.name || "Image") + " selection",
    left: o.left + 20,
    top: o.top + 20,
    filters: [],
    clipPath: undefined,
    shadow: undefined,
  });
  transaction("Copy pixels to layer", () => {
    c().add(layer);
    c().setActiveObject(layer);
  });
  setTool("select");
}
export function floodFill(
  data,
  width,
  height,
  x,
  y,
  color,
  tolerance = 30,
  allowed = () => true,
) {
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= width || y >= height) return 0;
  const start = (y * width + x) * 4,
    base = [...data.slice(start, start + 4)],
    visited = new Uint8Array(width * height),
    stack = new Int32Array(width * height);
  let top = 0;
  const enqueue = (p) => {
    if (!visited[p]) {
      visited[p] = 1;
      stack[top++] = p;
    }
  };
  enqueue(y * width + x);
  let count = 0;
  while (top) {
    const p = stack[--top];
    const px = p % width,
      py = Math.floor(p / width),
      i = p * 4;
    if (!allowed(px, py)) continue;
    if (Math.max(...base.map((v, k) => Math.abs(data[i + k] - v))) > tolerance)
      continue;
    for (let k = 0; k < 4; k++) data[i + k] = color[k];
    count++;
    if (px > 0 && !visited[p - 1]) enqueue(p - 1);
    if (px < width - 1 && !visited[p + 1]) enqueue(p + 1);
    if (py > 0 && !visited[p - width]) enqueue(p - width);
    if (py < height - 1 && !visited[p + width]) enqueue(p + width);
  }
  return count;
}
function localPoint(o, e) {
  const scene = c().getScenePoint(e),
    p = util.transformPoint(
      scene,
      util.invertTransform(o.calcTransformMatrix()),
    );
  return {
    x: p.x + o.width / 2 + (o.cropX || 0),
    y: p.y + o.height / 2 + (o.cropY || 0),
  };
}
function stamp(p) {
  const s = useStudio.getState(),
    ctx = stroke.work.getContext("2d"),
    r = s.brushSize / 2;
  ctx.save();
  clipSelection(ctx, stroke.work.width, stroke.work.height);
  ctx.globalAlpha = s.brushOpacity / 100;
  if (s.tool === "clone") {
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      stroke.original,
      p.x + stroke.offset.x - r,
      p.y + stroke.offset.y - r,
      r * 2,
      r * 2,
      p.x - r,
      p.y - r,
      r * 2,
      r * 2,
    );
  } else {
    ctx.globalCompositeOperation =
      s.tool === "eraser"
        ? "destination-out"
        : s.tool === "dodge"
          ? "screen"
          : s.tool === "burn"
            ? "multiply"
            : "source-over";
    if (s.tool === "dodge" || s.tool === "burn") ctx.globalAlpha *= 0.1;
    ctx.fillStyle =
      s.tool === "dodge"
        ? "#ffffff"
        : s.tool === "burn"
          ? "#000000"
          : s.brushColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
export function attachPixelEvents(canvas) {
  const off = [];
  off.push(
    canvas.on("mouse:down", ({ e }) => {
      const s = useStudio.getState();
      if (!pixelModes.includes(s.tool)) return;
      const o = target();
      if (!o || o.locked) return;
      const p = localPoint(o, e);
      if (s.tool === "marquee") {
        stroke = { start: p, last: p, selecting: true };
        return;
      }
      if (s.tool === "clone" && e.altKey) {
        cloneSource = p;
        notify("Clone source set. Paint to copy pixels.");
        return;
      }
      const work = workCanvas(o);
      if (work.width * work.height > 20_000_000) {
        notify("Resize or crop this layer before pixel editing.");
        return;
      }
      if (s.tool === "fill" || s.tool === "magic-erase") {
        const ctx = work.getContext("2d"),
          pixels = ctx.getImageData(0, 0, work.width, work.height);
        const rgb = s.brushColor.match(/\w\w/g).map((v) => parseInt(v, 16));
        floodFill(
          pixels.data,
          work.width,
          work.height,
          p.x,
          p.y,
          s.tool === "magic-erase"
            ? [0, 0, 0, 0]
            : [...rgb, Math.round(s.brushOpacity * 2.55)],
          s.fillTolerance,
          inSelection,
        );
        ctx.putImageData(pixels, 0, 0);
        commitPixels(o, work, s.tool === "fill" ? "Flood fill" : "Magic erase");
        return;
      }
      if (s.tool === "clone" && !cloneSource) {
        notify("Alt-click the image to choose a clone source.");
        return;
      }
      const original = freshCanvas(work.width, work.height);
      original.getContext("2d").drawImage(work, 0, 0);
      stroke = {
        work,
        original,
        last: p,
        offset: cloneSource
          ? { x: cloneSource.x - p.x, y: cloneSource.y - p.y }
          : null,
      };
      stamp(p);
      o.filters = [];
      o.adjustments = {};
      o.setElement(work, { width: o.width, height: o.height });
      o.dirty = true;
      canvas.requestRenderAll();
    }),
  );
  off.push(
    canvas.on("mouse:move", ({ e }) => {
      if (!stroke) return;
      const o = target();
      if (!o) return;
      const p = localPoint(o, e);
      if (stroke.selecting) {
        const size = o.getOriginalSize();
        const x = Math.max(0, Math.min(stroke.start.x, p.x)),
          y = Math.max(0, Math.min(stroke.start.y, p.y));
        selection = {
          x,
          y,
          w: Math.max(
            0,
            Math.min(size.width, Math.max(stroke.start.x, p.x)) - x,
          ),
          h: Math.max(
            0,
            Math.min(size.height, Math.max(stroke.start.y, p.y)) - y,
          ),
        };
        inverted = false;
        selectionState();
        return;
      }
      const dx = p.x - stroke.last.x,
        dy = p.y - stroke.last.y,
        distance = Math.hypot(dx, dy),
        steps = Math.max(
          1,
          Math.ceil(distance / Math.max(1, useStudio.getState().brushSize / 4)),
        );
      for (let i = 1; i <= steps; i++)
        stamp({
          x: stroke.last.x + (dx * i) / steps,
          y: stroke.last.y + (dy * i) / steps,
        });
      stroke.last = p;
      o.dirty = true;
      canvas.requestRenderAll();
    }),
  );
  const finish = () => {
    if (!stroke) return;
    const o = target();
    if (o && !stroke.selecting)
      commitPixels(o, stroke.work, "Pixel " + useStudio.getState().tool);
    else if (o) {
      canvas.setActiveObject(o);
      sync();
    }
    stroke = null;
  };
  off.push(canvas.on("mouse:up", finish));
  window.addEventListener("pointerup", finish);
  off.push(
    canvas.on("after:render", () => {
      const o = target();
      if (!selection || !o || !canvas.getObjects().includes(o)) return;
      const ctx = canvas.getSelectionContext(),
        m = util.multiplyTransformMatrices(
          canvas.viewportTransform,
          o.calcTransformMatrix(),
        );
      ctx.save();
      ctx.transform(...m);
      ctx.lineWidth = 1.5 / canvas.getZoom() / Math.max(o.scaleX, o.scaleY);
      ctx.strokeStyle = "#ffffff";
      ctx.setLineDash([6 / canvas.getZoom(), 4 / canvas.getZoom()]);
      ctx.strokeRect(
        selection.x - o.width / 2 - (o.cropX || 0),
        selection.y - o.height / 2 - (o.cropY || 0),
        selection.w,
        selection.h,
      );
      ctx.restore();
    }),
  );
  return () => {
    off.forEach((fn) => fn());
    window.removeEventListener("pointerup", finish);
    stroke = null;
    targetId = null;
    selection = null;
  };
}
