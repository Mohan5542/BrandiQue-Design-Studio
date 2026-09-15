import { useEffect, useState } from "react";
import {
  Paintbrush,
  Eraser,
  Stamp,
  PaintBucket,
  WandSparkles,
  Scan,
  Sun,
  Moon,
  Plus,
  FolderOpen,
  Trash2,
  HardDrive,
  ChevronDown,
} from "lucide-react";
import { useStudio, notify } from "./store";
import * as e from "./editor";
import * as a from "./advanced";
import * as p from "./pixelTools";
import { Range } from "./Inspector";
import {
  saveProject,
  projectList,
  deleteProject,
  clearAutosave,
} from "./localFiles";
const tools = [
  ["paint", Paintbrush, "Paint"],
  ["eraser", Eraser, "Eraser"],
  ["clone", Stamp, "Clone"],
  ["fill", PaintBucket, "Fill"],
  ["magic-erase", WandSparkles, "Magic erase"],
  ["marquee", Scan, "Select"],
  ["dodge", Sun, "Dodge"],
  ["burn", Moon, "Burn"],
];
export function PixelPanel() {
  const s = useStudio();
  return (
    <div className="tools-content pixel-panel">
      <button className="yellow-button full" onClick={p.newPaintLayer}>
        <Plus size={16} /> New paint layer
      </button>
      <div className="pixel-tool-grid">
        {tools.map(([id, Icon, name]) => (
          <button
            key={id}
            onClick={() => p.activatePixelTool(id)}
            className={s.tool === id ? "active" : ""}
          >
            <Icon size={20} />
            <span>{name}</span>
          </button>
        ))}
      </div>
      <p className="pixel-target">
        {s.pixelTarget || "Select a photo or create a paint layer"}
      </p>
      <Range
        label="Brush size"
        value={s.brushSize}
        min={1}
        max={250}
        suffix=" px"
        onChange={(n) => a.configureBrush({ brushSize: n })}
      />
      <Range
        label="Opacity / strength"
        value={s.brushOpacity}
        min={1}
        max={100}
        suffix="%"
        onChange={(n) => a.configureBrush({ brushOpacity: n })}
      />
      <label className="pro-color-label">
        Foreground
        <input
          type="color"
          value={s.brushColor}
          onChange={(ev) => a.configureBrush({ brushColor: ev.target.value })}
        />
      </label>
      <Range
        label="Fill / erase tolerance"
        value={s.fillTolerance}
        min={0}
        max={150}
        onChange={(n) => useStudio.setState({ fillTolerance: n })}
      />
      <div className="pixel-instructions">
        {s.tool === "clone"
          ? "Alt-click to sample a source, then paint to clone."
          : s.tool === "marquee"
            ? "Drag on the selected image to select a rectangular area."
            : s.tool === "magic-erase"
              ? "Click to remove a connected region of similar colors."
              : "Pixel tools affect the selected raster layer. Changes can be undone."}
      </div>
      {s.pixelSelection && (
        <div className="selection-actions">
          <strong>
            {Math.round(s.pixelSelection.w)} × {Math.round(s.pixelSelection.h)}{" "}
            px {s.pixelSelection.inverted ? "· inverted" : ""}
          </strong>
          <button onClick={p.copyPixels}>Copy selection to new layer</button>
          <button onClick={p.clearPixels}>Clear selected pixels</button>
          <button onClick={p.invertPixels}>Invert selection</button>
          <button onClick={p.deselectPixels}>Deselect</button>
        </div>
      )}
      <button
        className="secondary-button full"
        onClick={() => {
          a.rasterize();
          notify("Selected layer rasterized. Choose a pixel tool.");
        }}
      >
        Rasterize selected object
      </button>
      <p className="pro-help">
        Pixel painting bakes existing image adjustments into the layer. Keep a
        duplicate for a non-destructive original.
      </p>
    </div>
  );
}
export function ProjectsPanel() {
  const [projects, setProjects] = useState(projectList);
  const [pending, setPending] = useState(null);
  return (
    <div className="tools-content projects-panel">
      <button
        className="yellow-button full"
        onClick={() => {
          if (saveProject(e.snapshot())) setProjects(projectList());
        }}
      >
        <HardDrive size={16} /> Save named snapshot
      </button>
      <p className="pro-help">
        Stored in this browser on this device. Use JSON drafts to move designs
        between devices.
      </p>
      {!projects.length && (
        <div className="tool-empty">
          <FolderOpen size={28} />
          <strong>Your local project shelf</strong>
          <p>Save a named snapshot to keep a version here.</p>
        </div>
      )}
      {projects.map((project) => (
        <div className="project-row" key={project.id}>
          <button onClick={() => setPending(project)}>
            <strong>{project.name}</strong>
            <span>
              {new Date(project.savedAt).toLocaleDateString()} ·{" "}
              {project.document.width} × {project.document.height}
            </span>
          </button>
          <button
            title="Delete saved snapshot"
            onClick={() => {
              if (deleteProject(project.id)) setProjects(projectList());
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      {pending && (
        <div className="project-confirm">
          <p>Open “{pending.name}”? This replaces the current canvas.</p>
          <button onClick={() => e.exportFile("json")}>
            Download current draft
          </button>
          <button
            onClick={async () => {
              try {
                await e.loadDocument(pending.document);
                setPending(null);
              } catch (error) {
                notify(error.message);
              }
            }}
          >
            Open saved project
          </button>
          <button onClick={() => setPending(null)}>Cancel</button>
        </div>
      )}
      <button className="secondary-button full" onClick={clearAutosave}>
        Clear recovery draft
      </button>
      <p className="pro-help">
        LocalStorage has limited space. Large or image-heavy designs should be
        saved as downloaded drafts.
      </p>
    </div>
  );
}
function dispatch(name) {
  window.dispatchEvent(new Event("studio-" + name));
}
export function StudioMenus() {
  const s = useStudio();
  const menus = {
    Edit: [
      ["Undo", () => e.travel(-1), !s.canUndo],
      ["Redo", () => e.travel(1), !s.canRedo],
      ["Duplicate layer", e.duplicate, !s.selected],
      ["Delete layer", e.removeSelected, !s.selected],
      ["Select all layers", a.selectAll],
    ],
    Image: [
      ["Image adjustments", () => useStudio.setState({ tab: "adjustments" })],
      ["Pixel editing", () => useStudio.setState({ tab: "pixels" })],
      ["Flip horizontal", () => a.flip("horizontal"), !s.selected],
      ["Flip vertical", () => a.flip("vertical"), !s.selected],
      ["Transparent background", () => a.setBackground("transparent")],
    ],
    Layer: [
      ["New paint layer", p.newPaintLayer],
      ["New text layer", () => e.add("text")],
      ["Group / ungroup", e.groupSelection, !s.selected],
      ["Rasterize selected layer", a.rasterize, !s.selected],
      ["Bring forward", () => e.layerAction(s.selected.id, "up"), !s.selected],
      [
        "Send backward",
        () => e.layerAction(s.selected.id, "down"),
        !s.selected,
      ],
    ],
    Select: [
      [
        "Rectangle selection",
        () => {
          useStudio.setState({ tab: "pixels" });
          p.activatePixelTool("marquee");
        },
      ],
      ["Invert pixel selection", p.invertPixels, !s.pixelSelection],
      ["Copy pixels to layer", p.copyPixels, !s.pixelSelection],
      ["Clear pixels", p.clearPixels, !s.pixelSelection],
      ["Deselect pixels", p.deselectPixels],
    ],
    Filter: [
      [
        "Grayscale",
        () => a.adjustImage({ grayscale: true }),
        !s.selected?.isImage,
      ],
      ["Sepia", () => a.adjustImage({ sepia: true }), !s.selected?.isImage],
      ["Invert", () => a.adjustImage({ invert: true }), !s.selected?.isImage],
      [
        "Reset image filters",
        () => a.adjustImage(a.adjustmentDefaults),
        !s.selected?.isImage,
      ],
    ],
    View: [
      [
        "Fit canvas",
        () => {
          useStudio.setState({ fit: true });
          dispatch("fit");
        },
      ],
      [
        "Actual size (100%)",
        () => {
          useStudio.setState({ fit: false, zoom: 1 });
          dispatch("fit");
        },
      ],
      ["Toggle grid", () => useStudio.setState({ showGrid: !s.showGrid })],
      ["Toggle snapping", () => useStudio.setState({ snap: !s.snap })],
      ["Local projects", () => useStudio.setState({ tab: "projects" })],
    ],
  };
  return (
    <div className="studio-menus">
      {Object.entries(menus).map(([name, items]) => (
        <details
          key={name}
          className="studio-menu"
          onToggle={(ev) => {
            if (ev.currentTarget.open)
              document.querySelectorAll(".studio-menu[open]").forEach((el) => {
                if (el !== ev.currentTarget) el.open = false;
              });
          }}
        >
          <summary>{name}</summary>
          <div>
            {items.map(([label, action, disabled]) => (
              <button
                key={label}
                disabled={disabled}
                onClick={(ev) => {
                  action();
                  ev.currentTarget.closest("details").open = false;
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
