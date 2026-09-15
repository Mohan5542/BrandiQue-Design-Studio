import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownToLine,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Undo2,
  Redo2,
  MousePointer2,
  Type,
  Shapes,
  Image as ImageIcon,
  LayoutTemplate,
  Layers,
  Upload,
  Search,
  MoreHorizontal,
  Eye,
  EyeOff,
  LockKeyhole,
  LockKeyholeOpen,
  Trash2,
  Copy,
  Check,
  Maximize,
  PanelLeftClose,
  PanelRightClose,
  Square,
  Triangle,
  Circle,
  MoveUp,
  MoveDown,
  Group,
  FileJson,
  FolderOpen,
  X,
  SlidersHorizontal,
  CheckCircle2,
  GripVertical,
  Settings2,
  Keyboard,
  Download,
  RotateCw,
} from "lucide-react";
import { useStudio, notify, presets } from "./store";
import * as editor from "./editor";
import * as advanced from "./advanced";
import Inspector, { BrushPanel, ImageAdjustments } from "./Inspector";
import {
  Paintbrush,
  Hand,
  Pipette,
  Grid2X2,
  Magnet,
  Github,
} from "lucide-react";
const IconButton = ({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  className = "",
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className={`icon-btn ${active ? "active" : ""} ${className}`}
  >
    <Icon size={18} />
  </button>
);
function Workspace() {
  const host = useRef(),
    wrap = useRef();
  const [drag, setDrag] = useState(false);
  const ready = useStudio((s) => s.ready);
  useEffect(() => {
    const root = document.createElement("div"),
      el = document.createElement("canvas");
    root.appendChild(el);
    host.current.appendChild(root);
    const session = editor.initialize(el);
    const detachAdvanced = advanced.attachEvents(session.c, wrap.current);
    let frame;
    const fit = () => {
      if (!wrap.current || useStudio.getState().canvas !== session.c) return;
      const s = useStudio.getState(),
        availableW = wrap.current.clientWidth - 72,
        availableH = wrap.current.clientHeight - 86;
      const zoom = s.fit
        ? Math.max(
            0.05,
            Math.min(availableW / s.width, availableH / s.height, 1),
          )
        : s.zoom;
      session.c.setDimensions({
        width: s.width * zoom,
        height: s.height * zoom,
      });
      session.c.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
      session.c.calcOffset();
      session.c.requestRenderAll();
      if (s.zoom !== zoom) useStudio.setState({ zoom });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap.current);
    window.addEventListener("studio-fit", schedule);
    session.ready
      .then(schedule)
      .catch(() => notify("The canvas could not load. Please reload."));
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("studio-fit", schedule);
      detachAdvanced();
      session.dispose();
      root.remove();
    };
  }, []);
  return (
    <div
      className={`workspace ${drag ? "dragging" : ""}`}
      ref={wrap}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDrag(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const c = useStudio.getState().canvas;
        if (c)
          editor.importFiles(
            [...e.dataTransfer.files],
            c.getScenePoint(e.nativeEvent),
          );
      }}
    >
      <div className="ruler ruler-x">
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i}>{i * 100}</span>
        ))}
      </div>
      <div className="ruler ruler-y">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{i * 100}</span>
        ))}
      </div>
      <div className="canvas-scroll">
        <div className="artboard-label">
          <span>01</span> {useStudio((s) => s.title)}{" "}
          <span className="artboard-dim">
            {useStudio((s) => s.width)} × {useStudio((s) => s.height)}
          </span>
        </div>
        <div className="artboard-surface">
          <div ref={host} className="canvas-host" />
          {useStudio((s) => s.showGrid) && (
            <div
              className="artboard-grid"
              style={{
                backgroundSize: `${useStudio.getState().gridSize * useStudio.getState().zoom}px ${useStudio.getState().gridSize * useStudio.getState().zoom}px`,
              }}
            />
          )}
        </div>
      </div>
      {!ready && <div className="loading-overlay">Preparing your canvas…</div>}
      {drag && (
        <div className="drop-overlay">
          <Upload size={34} />
          <strong>Drop it. Make it yours.</strong>
          <span>Images, SVG vectors, or a saved draft</span>
        </div>
      )}
    </div>
  );
}
const templates = [
  {
    id: "noise",
    name: "Make some noise",
    category: "Bold typography",
    tag: "noise",
  },
  {
    id: "type",
    name: "Less, but better",
    category: "Minimal editorial",
    tag: "type",
  },
  {
    id: "fresh",
    name: "A fresh perspective",
    category: "Social & lifestyle",
    tag: "fresh",
  },
];
function TemplateArt({ kind }) {
  return (
    <div className={`template-art ${kind}`} aria-hidden="true">
      {kind === "noise" ? (
        <>
          <small>
            BRANDIQUE® <span>001</span>
          </small>
          <b>MAKE SOME</b>
          <strong>NOISE.</strong>
          <em>BREAK THE ORDINARY.</em>
        </>
      ) : kind === "type" ? (
        <>
          <small>THE ART OF SIMPLICITY</small>
          <b>
            Less,
            <br />
            but better.
          </b>
          <em>A LITTLE SPACE.</em>
        </>
      ) : (
        <>
          <small>NEW WAYS OF SEEING</small>
          <b>
            A FRESH
            <br />
            PERSPECTIVE
          </b>
          <i />
          <em>MAKE ROOM FOR SOMETHING NEW.</em>
        </>
      )}
    </div>
  );
}
function Library({ onImport, onTemplate }) {
  const tab = useStudio((s) => s.tab);
  const [query, setQuery] = useState("");
  return (
    <aside className="library-panel">
      <div className="panel-heading">
        <h2>
          {tab === "brush"
            ? "Brush studio"
            : tab === "adjustments"
              ? "Image lab"
              : tab === "templates"
                ? "Your next great idea."
                : tab === "text"
                  ? "Say it your way."
                  : tab === "shapes"
                    ? "Build something bold."
                    : "Make it yours."}
        </h2>
        <span className="panel-eyebrow">
          {tab === "templates"
            ? "START WITH A LITTLE INSPIRATION"
            : tab === "text"
              ? "WORDS THAT MAKE AN IMPACT"
              : tab === "shapes"
                ? "THE BUILDING BLOCKS"
                : "YOUR FILES. YOUR CREATIVE SPACE."}
        </span>
      </div>
      {tab === "brush" ? (
        <BrushPanel />
      ) : tab === "adjustments" ? (
        <div className="tools-content advanced-tools">
          <ImageAdjustments />
        </div>
      ) : tab === "templates" ? (
        <>
          <label className="search-field">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates"
              aria-label="Search templates"
            />
            <span>⌕</span>
          </label>
          <div className="category-pills">
            <span className="chosen">All templates</span>
            <span>Made for you</span>
          </div>
          <div className="section-label">
            CURATED STARTING POINTS{" "}
            <span>
              {
                templates.filter((t) =>
                  t.name.toLowerCase().includes(query.toLowerCase()),
                ).length
              }
            </span>
          </div>
          <div className="template-list">
            {templates
              .filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
              .map((t, i) => (
                <button
                  key={t.id}
                  className={`template-card ${i === 0 ? "featured" : ""}`}
                  onClick={() => onTemplate(t.id)}
                >
                  <TemplateArt kind={t.tag} />
                  <span className="template-caption">
                    <span>
                      <strong>{t.name}</strong>
                      <small>{t.category}</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </span>
                </button>
              ))}
            {!templates.filter((t) =>
              t.name.toLowerCase().includes(query.toLowerCase()),
            ).length && (
              <p className="muted">
                No templates found. Try “noise” or “fresh”.
              </p>
            )}
          </div>
        </>
      ) : tab === "text" ? (
        <div className="tools-content">
          <button
            className="yellow-button full"
            onClick={() => editor.add("text")}
          >
            <Plus size={17} /> Add text
          </button>
          <div className="section-label">TYPE STYLES</div>
          {[
            ["Add a heading", 72, 700],
            ["Add a subheading", 40, 600],
            ["Add body text", 24, 400],
          ].map(([label, size, weight]) => (
            <button
              className="text-choice"
              key={label}
              style={{ fontSize: size / 3 + 7, fontWeight: weight }}
              onClick={() => {
                editor.add("text");
                editor.update({
                  text: label,
                  fontSize: size,
                  fontWeight: weight,
                });
              }}
            >
              {label}
            </button>
          ))}
          <div className="tip-card">
            <Type size={19} />
            <p>Double-click any text on the canvas to edit it directly.</p>
          </div>
          <div className="section-label">BUNDLED FONTS</div>
          <p className="font-example">
            Inter <span>Aa</span>
          </p>
          <p className="font-example" style={{ fontFamily: "Bebas Neue" }}>
            Bebas Neue <span>Aa</span>
          </p>
          <p className="font-example" style={{ fontFamily: "DM Sans" }}>
            DM Sans <span>Aa</span>
          </p>
        </div>
      ) : tab === "shapes" ? (
        <div className="tools-content">
          <div className="shape-grid">
            {[
              ["rectangle", Square],
              ["circle", Circle],
              ["triangle", Triangle],
              ["rounded", Square],
              ["line", Minus],
            ].map(([name, Icon]) => (
              <button key={name} onClick={() => editor.add(name)}>
                <Icon size={42} strokeWidth={1.4} />
                <span>{name}</span>
              </button>
            ))}
          </div>
          <div className="tip-card">
            <Shapes size={20} />
            <p>
              Select a shape to change its color, size, rotation, and opacity.
            </p>
          </div>
        </div>
      ) : (
        <div className="tools-content">
          <button className="upload-zone" onClick={onImport}>
            <Upload size={28} />
            <strong>Bring your ideas in</strong>
            <span>
              Choose files or drop them
              <br />
              anywhere on the canvas
            </span>
            <small>PNG, JPG, WebP, SVG · Up to 20 MB</small>
          </button>
          <button className="secondary-button full" onClick={onImport}>
            <FolderOpen size={16} /> Open a saved draft
          </button>
          <div className="tip-card">
            <LockKeyhole size={19} />
            <p>
              No account or database. Download an editable draft before closing
              your tab.
            </p>
          </div>
        </div>
      )}
      <div className="library-bottom">
        <div className="mini-brand">bq.</div>
        <span>
          OPEN SOURCE · NO ACCOUNT
          <br />
          <strong>Your files stay yours.</strong>
        </span>
      </div>
    </aside>
  );
}
function NumberField({ label, value, onChange, min, max }) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input
        aria-label={label}
        type="number"
        value={value ?? 0}
        min={min}
        max={max}
        onChange={(e) => {
          if (e.target.value === "") return;
          const n = Number(e.target.value);
          if (
            Number.isFinite(n) &&
            (min === undefined || n >= min) &&
            (max === undefined || n <= max)
          )
            onChange(n);
        }}
      />
    </label>
  );
}
function Modal({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-header">
        <h2>{title}</h2>
        <IconButton icon={X} label="Close dialog" onClick={onClose} />
      </div>
      {children}
    </dialog>
  );
}
export default function App() {
  const s = useStudio();
  const input = useRef();
  const [modal, setModal] = useState(null),
    [format, setFormat] = useState("png"),
    [scale, setScale] = useState(2),
    [pending, setPending] = useState(null),
    [left, setLeft] = useState(() => window.innerWidth > 600),
    [right, setRight] = useState(() => window.innerWidth > 1000),
    [menu, setMenu] = useState(false),
    [updateReady, setUpdateReady] = useState(false);
  const onImport = () => input.current.click();
  const askReplace = (id) => {
    setPending(id);
    setModal("replace");
  };
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(tag) ||
        e.target.isContentEditable ||
        useStudio.getState().canvas?.getActiveObject()?.isEditing ||
        document.querySelector("dialog[open]")
      )
        return;
      const command = e.ctrlKey || e.metaKey;
      if (command && e.key.toLowerCase() === "z") {
        e.preventDefault();
        editor.travel(e.shiftKey ? 1 : -1);
      } else if (command && e.key.toLowerCase() === "d") {
        e.preventDefault();
        editor.duplicate();
      } else if (command && e.key.toLowerCase() === "s") {
        e.preventDefault();
        editor.exportFile("json");
      } else if (command && e.key.toLowerCase() === "g") {
        e.preventDefault();
        editor.groupSelection();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        editor.removeSelected();
      } else if (e.key === "Escape") {
        s.canvas?.discardActiveObject();
        editor.sync();
      } else if (command && e.key.toLowerCase() === "a") {
        e.preventDefault();
        advanced.selectAll();
      } else if (e.key.toLowerCase() === "v") advanced.setTool("select");
      else if (e.key.toLowerCase() === "b") {
        advanced.setTool("brush");
        useStudio.setState({ tab: "brush" });
      } else if (e.key.toLowerCase() === "h") advanced.setTool("hand");
      else if (e.key.toLowerCase() === "i") advanced.setTool("eyedropper");
      else if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
      ) {
        e.preventDefault();
        const n = e.shiftKey ? 10 : 1;
        advanced.nudge(
          e.key === "ArrowLeft" ? -n : e.key === "ArrowRight" ? n : 0,
          e.key === "ArrowUp" ? -n : e.key === "ArrowDown" ? n : 0,
        );
      } else if (e.key.toLowerCase() === "t") editor.add("text");
      else if (e.key.toLowerCase() === "r") editor.add("rectangle");
      else if (e.key.toLowerCase() === "o") editor.add("circle");
    };
    window.addEventListener("keydown", onKey);
    const offline = () =>
      notify(
        "Studio cached for offline use. Download drafts to save your designs.",
      );
    window.addEventListener("offline-ready", offline);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("offline-ready", offline);
    };
  }, [s.canvas]);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    Promise.resolve(
      context.registerTool(
        {
          name: "get_design_state",
          description: "Read the current canvas dimensions and layer names.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute: () => {
            const s = useStudio.getState();
            return {
              title: s.title,
              width: s.width,
              height: s.height,
              layers: s.layers,
            };
          },
        },
        { signal: controller.signal },
      ),
    ).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const warn = (ev) => {
      if (useStudio.getState().dirty) {
        ev.preventDefault();
        ev.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  useEffect(() => {
    const ready = () => setUpdateReady(true);
    window.addEventListener("studio-update-ready", ready);
    return () => window.removeEventListener("studio-update-ready", ready);
  }, []);
  function zoomBy(delta) {
    useStudio.setState({
      fit: false,
      zoom: Math.min(3, Math.max(0.1, s.zoom + delta)),
    });
    window.dispatchEvent(new Event("studio-fit"));
  }
  return (
    <div
      className={`studio ${!left ? "left-closed" : ""} ${!right ? "right-closed" : ""}`}
    >
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => e.preventDefault()}
          aria-label="BrandiQue home"
        >
          <span className="brand-symbol">
            bq<span>↗</span>
          </span>
          <span>
            BrandiQue<span className="studio-word">STUDIO 2.0</span>
          </span>
        </a>
        <span className="header-divider" />
        <div className="file-menu-wrap">
          <button className="file-button" onClick={() => setMenu(!menu)}>
            File <ChevronDown size={13} />
          </button>
          {menu && (
            <>
              <button
                className="menu-backdrop"
                aria-label="Close file menu"
                onClick={() => setMenu(false)}
              />
              <div className="file-menu">
                <button
                  onClick={() => {
                    askReplace("new");
                    setMenu(false);
                  }}
                >
                  <Plus size={16} /> New design
                </button>
                <button
                  onClick={() => {
                    onImport();
                    setMenu(false);
                  }}
                >
                  <FolderOpen size={16} /> Open draft or asset
                </button>
                <button
                  onClick={() => {
                    editor.exportFile("json");
                    setMenu(false);
                  }}
                >
                  <FileJson size={16} /> Download draft <kbd>⌘S</kbd>
                </button>
              </div>
            </>
          )}
        </div>
        <div className="document-title">
          <input
            value={s.title}
            aria-label="Design name"
            onChange={(e) => useStudio.setState({ title: e.target.value })}
            onBlur={() => editor.changed()}
          />
          <ChevronDown size={12} />
        </div>
        <div className="header-actions">
          <span className="save-status">
            <CheckCircle2 size={14} />
            {s.saveStatus}
          </span>
          <button
            className="yellow-button"
            onClick={() => setModal("export")}
            disabled={!s.ready}
          >
            <ArrowDownToLine size={16} /> Export <ChevronDown size={13} />
          </button>
          <a
            className="source-link"
            href="/brandique-source.zip"
            download
            title="Download open-source code"
            aria-label="Download open-source code"
          >
            <Github size={19} />
          </a>
        </div>
      </header>
      <div className="subbar">
        <div className="breadcrumb">
          Workspace <ChevronRight size={12} />
          <strong>Design editor</strong>
          <span className="beta-badge">OPEN SOURCE</span>
        </div>
        <div className="edit-controls">
          <IconButton
            icon={Undo2}
            label="Undo (Ctrl+Z)"
            onClick={() => editor.travel(-1)}
            disabled={!s.canUndo}
          />
          <IconButton
            icon={Redo2}
            label="Redo (Ctrl+Shift+Z)"
            onClick={() => editor.travel(1)}
            disabled={!s.canRedo}
          />
          <span className="control-divider" />
          <IconButton
            icon={PanelLeftClose}
            label="Toggle asset panel"
            onClick={() => setLeft(!left)}
          />
          <IconButton
            icon={PanelRightClose}
            label="Toggle properties panel"
            onClick={() => setRight(!right)}
          />
        </div>
      </div>
      <div className="editor-body">
        <nav className="tool-rail" aria-label="Editor tools">
          <IconButton
            icon={MousePointer2}
            label="Move tool (V)"
            active={s.tool === "select"}
            onClick={() => advanced.setTool("select")}
          />
          <IconButton
            icon={Hand}
            label="Hand tool (H / Space)"
            active={s.tool === "hand"}
            onClick={() => advanced.setTool("hand")}
          />
          <div className="rail-divider" />
          {[
            ["templates", LayoutTemplate, "Templates"],
            ["text", Type, "Text"],
            ["shapes", Shapes, "Elements"],
            ["uploads", ImageIcon, "Uploads"],
            ["brush", Paintbrush, "Brush"],
            ["adjustments", SlidersHorizontal, "Adjust"],
          ].map(([id, Icon, label]) => (
            <button
              key={id}
              className={`rail-tool ${s.tab === id ? "active" : ""}`}
              onClick={() => {
                useStudio.setState({ tab: id });
                advanced.setTool(id === "brush" ? "brush" : "select");
                setLeft(true);
              }}
              title={label}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
          <IconButton
            icon={Pipette}
            label="Eyedropper (I)"
            active={s.tool === "eyedropper"}
            onClick={() => advanced.setTool("eyedropper")}
          />
          <div className="rail-spacer" />
          <IconButton
            icon={Keyboard}
            label="Keyboard shortcuts"
            onClick={() => setModal("shortcuts")}
          />
          <div className="rail-foot">bq.</div>
        </nav>
        {left && <Library onImport={onImport} onTemplate={askReplace} />}
        <div className="center-column">
          <div className="document-tabbar">
            <div className="document-tab">
              <span className="document-tab-icon">Bq</span>
              {s.title || "Untitled design"}
              {s.dirty && (
                <span className="unsaved-dot" title="Unsaved changes" />
              )}
              <span>{Math.round(s.zoom * 100)}%</span>
            </div>
            <button
              aria-label="New design"
              title="New design"
              onClick={() => askReplace("new")}
            >
              <Plus size={15} />
            </button>
            <span className="document-color-mode">RGB / 8</span>
          </div>
          <div className="canvas-toolbar">
            <div>
              <span className="toolbar-title">
                {s.tool === "brush"
                  ? "Brush"
                  : s.tool === "hand"
                    ? "Hand"
                    : s.tool === "eyedropper"
                      ? "Eyedropper"
                      : s.selected
                        ? "Selection"
                        : "Move"}
              </span>
              <span className="toolbar-divider" />
              {s.selected ? (
                <>
                  <IconButton
                    icon={Copy}
                    label="Duplicate selection"
                    onClick={editor.duplicate}
                  />
                  <IconButton
                    icon={Group}
                    label="Group / ungroup"
                    onClick={editor.groupSelection}
                  />
                  <IconButton
                    icon={Trash2}
                    label="Delete selection"
                    onClick={editor.removeSelected}
                  />
                </>
              ) : (
                <span className="canvas-toolbar-hint">
                  {s.tool === "brush"
                    ? `${s.brushSize}px · ${s.brushOpacity}% opacity`
                    : s.tool === "hand"
                      ? "Drag to pan · Ctrl + scroll to zoom"
                      : s.tool === "eyedropper"
                        ? "Click a pixel to sample its color"
                        : "Select a layer to start editing"}
                </span>
              )}
            </div>
            <div className="view-options">
              <IconButton
                icon={Grid2X2}
                label="Toggle canvas grid"
                active={s.showGrid}
                onClick={() => useStudio.setState({ showGrid: !s.showGrid })}
              />
              <IconButton
                icon={Magnet}
                label="Snap to grid"
                active={s.snap}
                onClick={() => useStudio.setState({ snap: !s.snap })}
              />
              <button
                className="size-chip"
                onClick={() => {
                  setRight(true);
                  s.canvas?.discardActiveObject();
                  editor.sync();
                }}
              >
                {s.width} × {s.height}
                <ChevronDown size={12} />
              </button>
            </div>
          </div>
          <Workspace />
          <div className="canvas-bottom">
            <span className="canvas-caption">
              <span className="tiny-square" /> Page 1 of 1
            </span>
            <div className="zoom-control">
              <IconButton
                icon={Minus}
                label="Zoom out"
                onClick={() => zoomBy(-0.1)}
              />
              <button
                onClick={() => {
                  useStudio.setState({ fit: false, zoom: 1 });
                  window.dispatchEvent(new Event("studio-fit"));
                }}
              >
                {Math.round(s.zoom * 100)}%
              </button>
              <IconButton
                icon={Plus}
                label="Zoom in"
                onClick={() => zoomBy(0.1)}
              />
              <span />
              <IconButton
                icon={Maximize}
                label="Fit canvas to workspace"
                onClick={() => {
                  useStudio.setState({ fit: true });
                  window.dispatchEvent(new Event("studio-fit"));
                }}
              />
            </div>
            <span className="canvas-help">
              Space to pan · Ctrl + scroll to zoom
            </span>
          </div>
        </div>
        {right && <Inspector />}
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/svg+xml,.json"
        hidden
        onChange={(e) => {
          editor.importFiles([...e.target.files]);
          e.target.value = "";
        }}
      />
      {updateReady && (
        <div className="update-banner">
          <span>
            A new studio version is ready. Download your draft before
            refreshing.
          </span>
          <button
            onClick={() => {
              editor.exportFile("json");
              window.dispatchEvent(new Event("studio-apply-update"));
            }}
          >
            Save draft & update
          </button>
          <button
            onClick={() => setUpdateReady(false)}
            aria-label="Dismiss update"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {s.toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {s.toast}
          <button
            onClick={() => useStudio.setState({ toast: "" })}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {modal === "export" && (
        <Modal
          title="Made by you. Ready for the world."
          onClose={() => setModal(null)}
        >
          <p className="modal-description">
            Download your design, exactly how you need it.
          </p>
          <label className="field-label">
            File format
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="png">PNG — High-quality image</option>
              <option value="jpeg">JPEG — Compressed image</option>
              <option value="webp">
                WebP — Smaller image with transparency
              </option>
              <option value="svg">SVG — Scalable vector</option>
              <option value="json">JSON — Editable BrandiQue draft</option>
            </select>
          </label>
          {["png", "jpeg", "webp"].includes(format) && (
            <label className="field-label">
              Resolution
              <select
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
              >
                <option value="1">
                  1× · {s.width} × {s.height} px
                </option>
                <option value="2">
                  2× · {s.width * 2} × {s.height * 2} px
                </option>
                <option value="3">
                  3× · {s.width * 3} × {s.height * 3} px
                </option>
              </select>
            </label>
          )}
          {format === "svg" && (
            <p className="muted">
              Text stays editable. Install matching fonts when opening
              elsewhere. Use PNG for an exact composite of blend modes and image
              effects.
            </p>
          )}
          <button
            className="yellow-button full"
            onClick={() => editor.exportFile(format, scale)}
          >
            <Download size={17} /> Download {format.toUpperCase()}
          </button>
          <p className="export-note">
            <LockKeyhole size={12} /> Created on your device. No uploads, ever.
          </p>
        </Modal>
      )}
      {modal === "replace" && (
        <Modal
          title={
            pending === "new"
              ? "Start with a clean canvas?"
              : "Make this template your own?"
          }
          onClose={() => setModal(null)}
        >
          <p className="modal-description">
            This replaces your current canvas. Download a draft first if you
            want to keep this design.
          </p>
          <button
            className="secondary-button full"
            onClick={() => editor.exportFile("json")}
          >
            <Download size={16} /> Download current draft
          </button>
          <button
            className="yellow-button full"
            onClick={() => {
              if (pending === "new") editor.newDocument();
              else editor.seed(pending);
              setModal(null);
            }}
          >
            {" "}
            {pending === "new"
              ? "Create blank canvas"
              : "Use this template"}{" "}
            <ArrowUpRight size={17} />
          </button>
        </Modal>
      )}
      {modal === "shortcuts" && (
        <Modal
          title="Less clicking. More creating."
          onClose={() => setModal(null)}
        >
          <div className="shortcut-list">
            {[
              ["Move tool", "V"],
              ["Brush tool", "B"],
              ["Hand tool", "H / Space"],
              ["Eyedropper", "I"],
              ["Select all", "Ctrl / ⌘ A"],
              ["Nudge", "Arrow keys"],
              ["Nudge 10 px", "Shift + arrows"],
              ["Add text", "T"],
              ["Add rectangle", "R"],
              ["Add circle", "O"],
              ["Undo", "Ctrl / ⌘ Z"],
              ["Redo", "Ctrl / ⌘ Shift Z"],
              ["Duplicate", "Ctrl / ⌘ D"],
              ["Group / ungroup", "Ctrl / ⌘ G"],
              ["Download draft", "Ctrl / ⌘ S"],
              ["Delete selection", "Delete"],
              ["Deselect", "Esc"],
            ].map(([a, b]) => (
              <div key={a}>
                <span>{a}</span>
                <kbd>{b}</kbd>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
