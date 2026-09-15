import { create } from "zustand";
export const presets = [
  { name: "Instagram post", width: 1080, height: 1080 },
  { name: "Instagram story", width: 1080, height: 1920 },
  { name: "Landscape", width: 1920, height: 1080 },
  { name: "Portrait post", width: 1080, height: 1350 },
];
export const useStudio = create((set) => ({
  canvas: null,
  layers: [],
  selected: null,
  selectionCount: 0,
  title: "Make some noise",
  width: 1080,
  height: 1080,
  zoom: 1,
  fit: true,
  tab: "templates",
  tool: "select",
  brushSize: 18,
  brushColor: "#FBFF00",
  brushOpacity: 100,
  showGrid: false,
  snap: false,
  gridSize: 25,
  history: [],
  historyIndex: 0,
  dirty: false,
  saveStatus: "Loading…",
  ready: false,
  canUndo: false,
  canRedo: false,
  toast: "",
  revision: 0,
  set: (patch) => set(patch),
}));
let toastTimer;
export function notify(toast) {
  useStudio.setState({ toast });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => useStudio.setState({ toast: "" }), 3500);
}
