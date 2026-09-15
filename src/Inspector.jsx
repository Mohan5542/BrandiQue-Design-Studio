import { useState } from "react";
import {
  Type,
  Square,
  Image as ImageIcon,
  Group,
  Eye,
  EyeOff,
  LockKeyhole,
  LockKeyholeOpen,
  Plus,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  History,
  RotateCcw,
  FlipHorizontal2,
  FlipVertical2,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  PanelRightClose,
  ChevronDown,
  SlidersHorizontal,
  Crop,
  Blend,
  Paintbrush,
  Download,
  Check,
} from "lucide-react";
import { useStudio, notify } from "./store";
import { presets } from "./store";
import * as e from "./editor";
import * as a from "./advanced";
export function ToolButton({ icon: Icon, label, onClick, disabled, active }) {
  return (
    <button
      type="button"
      className={`icon-btn ${active ? "active" : ""}`}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon size={17} />
    </button>
  );
}
export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = "",
}) {
  return (
    <label className="pro-range">
      <span>
        {label}
        <output>
          {value}
          {suffix}
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(ev) => onChange(Number(ev.target.value))}
      />
    </label>
  );
}
export function NumberField({ label, value, onChange, min, max, step = 1 }) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input
        type="number"
        aria-label={label}
        value={value ?? 0}
        min={min}
        max={max}
        step={step}
        onChange={(ev) => {
          const n = Number(ev.target.value);
          if (
            ev.target.value !== "" &&
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
function Section({ title, children, open = true }) {
  return (
    <details className="pro-section" open={open}>
      <summary>
        {title}
        <ChevronDown size={14} />
      </summary>
      <div>{children}</div>
    </details>
  );
}
export function ImageAdjustments() {
  const selected = useStudio((s) => s.selected);
  const [crop, setCrop] = useState({ left: 0, top: 0, right: 0, bottom: 0 });
  const ad = { ...a.adjustmentDefaults, ...selected?.adjustments };
  if (!selected?.isImage)
    return (
      <div className="tool-empty">
        <SlidersHorizontal size={30} />
        <strong>Select an image</strong>
        <p>
          Import a photo and select its layer to adjust color, light, and crop.
        </p>
      </div>
    );
  return (
    <>
      <div className="section-title">
        Light & color{" "}
        <ToolButton
          icon={RotateCcw}
          label="Reset image adjustments"
          onClick={() => a.adjustImage(a.adjustmentDefaults)}
        />
      </div>
      {[
        ["brightness", "Brightness", -100, 100],
        ["contrast", "Contrast", -100, 100],
        ["saturation", "Saturation", -100, 100],
        ["blur", "Blur", 0, 60],
      ].map(([key, label, min, max]) => (
        <Range
          key={key}
          label={label}
          min={min}
          max={max}
          value={ad[key]}
          onChange={(n) => a.adjustImage({ [key]: n })}
        />
      ))}
      <div className="filter-chips">
        {[
          ["grayscale", "B&W"],
          ["sepia", "Sepia"],
          ["invert", "Invert"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={ad[key] ? "active" : ""}
            onClick={() => a.adjustImage({ [key]: !ad[key] })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="section-title crop-title">
        <span>
          <Crop size={15} /> Crop image
        </span>
        <ToolButton
          icon={RotateCcw}
          label="Reset crop"
          onClick={() => {
            setCrop({ left: 0, top: 0, right: 0, bottom: 0 });
            a.cropImage({});
          }}
        />
      </div>
      <p className="pro-help">
        Trim from the original image. Your original pixels are preserved.
      </p>
      <div className="crop-fields">
        {Object.keys(crop).map((key) => (
          <NumberField
            key={key}
            label={key + " %"}
            value={crop[key]}
            min={0}
            max={90}
            onChange={(n) => setCrop({ ...crop, [key]: n })}
          />
        ))}
      </div>
      <button
        className="secondary-button full"
        onClick={() => a.cropImage(crop)}
      >
        <Crop size={15} /> Apply crop
      </button>
    </>
  );
}
export function BrushPanel() {
  const s = useStudio();
  return (
    <div className="tools-content advanced-tools">
      <div className="brush-preview">
        <span
          style={{
            width: Math.max(7, Math.min(s.brushSize, 70)),
            height: Math.max(7, Math.min(s.brushSize, 70)),
            background: s.brushColor,
            opacity: s.brushOpacity / 100,
          }}
        />
      </div>
      <Range
        label="Brush size"
        value={s.brushSize}
        min={1}
        max={150}
        suffix=" px"
        onChange={(n) => a.configureBrush({ brushSize: n })}
      />
      <Range
        label="Opacity"
        value={s.brushOpacity}
        min={1}
        max={100}
        suffix="%"
        onChange={(n) => a.configureBrush({ brushOpacity: n })}
      />
      <label className="pro-color-label">
        Brush color
        <input
          type="color"
          value={s.brushColor}
          onChange={(ev) => a.configureBrush({ brushColor: ev.target.value })}
        />
      </label>
      <div className="swatches">
        {["#FBFF00", "#ffffff", "#171817", "#3567dc", "#ef5268", "#60d4aa"].map(
          (color) => (
            <button
              key={color}
              style={{ background: color }}
              aria-label={"Brush color " + color}
              onClick={() => a.configureBrush({ brushColor: color })}
            />
          ),
        )}
      </div>
      <button
        className="yellow-button full"
        onClick={() => a.setTool(s.tool === "brush" ? "select" : "brush")}
      >
        <Paintbrush size={16} />
        {s.tool === "brush" ? "Finish drawing" : "Start drawing"}
      </button>
      <p className="pro-help">
        Each stroke becomes an editable vector layer. Press V to return to the
        move tool.
      </p>
    </div>
  );
}
function LayerList() {
  const s = useStudio();
  const [drag, setDrag] = useState(null),
    [query, setQuery] = useState(""),
    [renaming, setRenaming] = useState(null),
    [name, setName] = useState("");
  return (
    <>
      <div className="layer-search">
        <input
          aria-label="Search layers"
          placeholder="Find a layer…"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
        />
        <span>{s.layers.length}</span>
      </div>
      <div className="layer-list pro-layer-list">
        {s.layers
          .filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
          .map((l) => (
            <div
              key={l.id}
              draggable={!renaming}
              onDragStart={() => setDrag(l.id)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={(ev) => {
                ev.preventDefault();
                if (drag) e.reorder(drag, l.id);
                setDrag(null);
              }}
              className={`layer-row ${s.selected?.id === l.id ? "selected" : ""} ${!l.visible ? "hidden-layer" : ""}`}
            >
              <button
                className="layer-visibility"
                title={`${l.visible ? "Hide" : "Show"} ${l.name}`}
                onClick={() => e.layerAction(l.id, "hide")}
              >
                {l.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                className="layer-select"
                onClick={() => {
                  a.setTool("select");
                  e.selectLayer(l.id);
                }}
                onDoubleClick={() => {
                  setRenaming(l.id);
                  setName(l.name);
                }}
                title={l.name + " · Double-click to rename"}
              >
                <span className="layer-icon">
                  {/text/i.test(l.type) ? (
                    <Type size={17} />
                  ) : l.type.toLowerCase() === "group" ? (
                    <Group size={17} />
                  ) : l.type.toLowerCase() === "image" ? (
                    <ImageIcon size={17} />
                  ) : (
                    <Square size={16} />
                  )}
                </span>
                {renaming === l.id ? (
                  <input
                    autoFocus
                    value={name}
                    aria-label="Layer name"
                    onClick={(ev) => ev.stopPropagation()}
                    onChange={(ev) => setName(ev.target.value)}
                    onBlur={() => {
                      a.renameLayer(l.id, name);
                      setRenaming(null);
                    }}
                    onKeyDown={(ev) => {
                      ev.stopPropagation();
                      if (ev.key === "Enter") {
                        a.renameLayer(l.id, name);
                        setRenaming(null);
                      }
                      if (ev.key === "Escape") setRenaming(null);
                    }}
                  />
                ) : (
                  <span>{l.name}</span>
                )}
              </button>
              <button
                className={`layer-lock ${l.locked ? "locked" : ""}`}
                title={`${l.locked ? "Unlock" : "Lock"} ${l.name}`}
                onClick={() => e.layerAction(l.id, "lock")}
              >
                {l.locked ? (
                  <LockKeyhole size={13} />
                ) : (
                  <LockKeyholeOpen size={13} />
                )}
              </button>
            </div>
          ))}
      </div>
      {!s.layers.length && (
        <p className="pro-help padded">
          Add an image, text, or shape to begin.
        </p>
      )}
      <div className="layer-bottom">
        <span>Drag to reorder</span>
        <div>
          <ToolButton
            icon={Group}
            label="Group / ungroup"
            disabled={!s.selected}
            onClick={e.groupSelection}
          />
          <ToolButton
            icon={Copy}
            label="Duplicate layer"
            disabled={!s.selected}
            onClick={e.duplicate}
          />
          <ToolButton
            icon={MoveUp}
            label="Bring forward"
            disabled={!s.selected}
            onClick={() => e.layerAction(s.selected.id, "up")}
          />
          <ToolButton
            icon={MoveDown}
            label="Send backward"
            disabled={!s.selected}
            onClick={() => e.layerAction(s.selected.id, "down")}
          />
          <ToolButton
            icon={Trash2}
            label="Delete selection"
            disabled={!s.selected}
            onClick={e.removeSelected}
          />
        </div>
      </div>
    </>
  );
}
export default function Inspector() {
  const s = useStudio(),
    o = s.selected;
  const [panel, setPanel] = useState("properties"),
    [gradient, setGradient] = useState({
      a: "#FBFF00",
      b: "#EF5268",
      direction: "horizontal",
    });
  const [shadow, setShadow] = useState({
    color: "#000000",
    blur: 24,
    x: 8,
    y: 12,
  });
  const resize = (key, n) => {
    const obj = s.canvas.getActiveObject();
    if (obj)
      e.update({
        [key === "W" ? "scaleX" : "scaleY"]:
          n / (key === "W" ? obj.width : obj.height),
      });
  };
  return (
    <aside className="inspector pro-inspector">
      <div className="inspector-tabs">
        {[
          ["properties", "Properties"],
          ["layers", "Layers"],
          ["history", "History"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={panel === id ? "selected" : ""}
            onClick={() => setPanel(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="inspector-scroll">
        {panel === "history" ? (
          <div className="history-panel">
            <div className="section-title">
              Session history <History size={16} />
            </div>
            <p className="pro-help">
              Return to any step. New edits replace the steps that follow.
            </p>
            {[...s.history].reverse().map((h) => (
              <button
                key={h.index}
                className={`history-step ${h.current ? "current" : ""} ${h.index > s.historyIndex ? "future" : ""}`}
                onClick={() => e.jumpTo(h.index)}
              >
                <span className="history-marker">
                  {h.current ? <Check size={13} /> : h.index + 1}
                </span>
                <span>{h.label}</span>
                {h.current && <small>Current</small>}
              </button>
            ))}
          </div>
        ) : panel === "layers" ? (
          <>
            <div className="layer-blend">
              <label>
                Blend
                <select
                  value={o?.blendMode || "source-over"}
                  disabled={!o}
                  onChange={(ev) =>
                    e.update({ globalCompositeOperation: ev.target.value })
                  }
                >
                  {[
                    "source-over",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "hue",
                    "saturation",
                    "color",
                    "luminosity",
                  ].map((v) => (
                    <option key={v} value={v}>
                      {v === "source-over" ? "Normal" : v.replaceAll("-", " ")}
                    </option>
                  ))}
                </select>
              </label>
              {o && (
                <Range
                  label="Opacity"
                  min={0}
                  max={100}
                  value={o.opacity}
                  suffix="%"
                  onChange={(n) => e.update({ opacity: n / 100 })}
                />
              )}
            </div>
            <LayerList />
          </>
        ) : (
          <>
            {o ? (
              <>
                <Section title="Transform">
                  <div className="selection-caption">
                    {s.selectionCount > 1
                      ? `${s.selectionCount} layers selected`
                      : s.layers.find((l) => l.id === o.id)?.name ||
                        "Selection"}
                  </div>
                  <div className="alignment-row">
                    {[
                      ["left", AlignStartVertical],
                      ["center", AlignCenterVertical],
                      ["right", AlignEndVertical],
                      ["top", AlignStartHorizontal],
                      ["middle", AlignCenterHorizontal],
                      ["bottom", AlignEndHorizontal],
                    ].map(([mode, Icon]) => (
                      <ToolButton
                        key={mode}
                        icon={Icon}
                        label={"Align " + mode}
                        onClick={() => a.align(mode)}
                      />
                    ))}
                  </div>
                  <div className="field-row">
                    <NumberField
                      label="X"
                      value={o.left}
                      onChange={(n) => e.update({ left: n })}
                    />
                    <NumberField
                      label="Y"
                      value={o.top}
                      onChange={(n) => e.update({ top: n })}
                    />
                  </div>
                  <div className="field-row">
                    <NumberField
                      label="W"
                      value={o.width}
                      min={1}
                      max={16000}
                      onChange={(n) => resize("W", n)}
                    />
                    <NumberField
                      label="H"
                      value={o.height}
                      min={1}
                      max={16000}
                      onChange={(n) => resize("H", n)}
                    />
                  </div>
                  <div className="field-row">
                    <NumberField
                      label="°"
                      value={o.angle}
                      onChange={(n) => e.update({ angle: n })}
                    />
                    <ToolButton
                      icon={FlipHorizontal2}
                      label="Flip horizontal"
                      onClick={() => a.flip("horizontal")}
                    />
                    <ToolButton
                      icon={FlipVertical2}
                      label="Flip vertical"
                      onClick={() => a.flip("vertical")}
                    />
                  </div>
                  {s.selectionCount >= 3 && (
                    <div className="field-row">
                      <button
                        className="mini-button"
                        onClick={() => a.distribute("horizontal")}
                      >
                        Distribute ↔
                      </button>
                      <button
                        className="mini-button"
                        onClick={() => a.distribute("vertical")}
                      >
                        Distribute ↕
                      </button>
                    </div>
                  )}
                </Section>
                {o.text !== undefined && (
                  <Section title="Typography">
                    <select
                      className="pro-select"
                      value={o.fontFamily}
                      onChange={(ev) =>
                        e.update({ fontFamily: ev.target.value })
                      }
                    >
                      {["Inter", "Bebas Neue", "DM Sans"].map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                    <div className="field-row">
                      <NumberField
                        label="Size"
                        value={o.fontSize}
                        min={8}
                        max={1000}
                        onChange={(n) => e.update({ fontSize: n })}
                      />
                      <button
                        className={`type-toggle ${Number(o.fontWeight) >= 600 ? "active" : ""}`}
                        onClick={() =>
                          e.update({
                            fontWeight: Number(o.fontWeight) >= 600 ? 400 : 700,
                          })
                        }
                      >
                        <b>B</b>
                      </button>
                      <button
                        className={`type-toggle ${o.fontStyle === "italic" ? "active" : ""}`}
                        onClick={() =>
                          e.update({
                            fontStyle:
                              o.fontStyle === "italic" ? "normal" : "italic",
                          })
                        }
                      >
                        <i>I</i>
                      </button>
                      <button
                        className={`type-toggle ${o.underline ? "active" : ""}`}
                        onClick={() => e.update({ underline: !o.underline })}
                      >
                        <u>U</u>
                      </button>
                    </div>
                    <div className="field-row">
                      <NumberField
                        label="Tracking"
                        value={o.charSpacing || 0}
                        min={-100}
                        max={1000}
                        onChange={(n) => e.update({ charSpacing: n })}
                      />
                      <NumberField
                        label="Leading"
                        value={o.lineHeight || 1.16}
                        min={0.5}
                        max={3}
                        step={0.05}
                        onChange={(n) => e.update({ lineHeight: n })}
                      />
                    </div>
                    <div className="text-align-row">
                      {["left", "center", "right", "justify"].map((v) => (
                        <button
                          key={v}
                          className={o.textAlign === v ? "active" : ""}
                          onClick={() => e.update({ textAlign: v })}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </Section>
                )}
                {o.isImage ? (
                  <Section title="Image adjustments">
                    <ImageAdjustments key={o.id} />
                    <button className="mini-button full" onClick={a.rasterize}>
                      Bake effects into pixels
                    </button>
                  </Section>
                ) : (
                  <Section title="Fill & stroke">
                    <label className="pro-color-label">
                      Solid fill
                      <input
                        type="color"
                        value={
                          /^#[0-9a-f]{6}$/i.test(o.fill) ? o.fill : "#ffffff"
                        }
                        onChange={(ev) => e.update({ fill: ev.target.value })}
                      />
                    </label>
                    <div className="swatches">
                      {[
                        "#FBFF00",
                        "#FFFFFF",
                        "#171817",
                        "#3567DC",
                        "#EF5268",
                        "#60D4AA",
                      ].map((v) => (
                        <button
                          key={v}
                          aria-label={"Fill " + v}
                          style={{ background: v }}
                          onClick={() => e.update({ fill: v })}
                        />
                      ))}
                    </div>
                    <div className="gradient-controls">
                      <input
                        type="color"
                        aria-label="Gradient start"
                        value={gradient.a}
                        onChange={(ev) =>
                          setGradient({ ...gradient, a: ev.target.value })
                        }
                      />
                      <span>→</span>
                      <input
                        type="color"
                        aria-label="Gradient end"
                        value={gradient.b}
                        onChange={(ev) =>
                          setGradient({ ...gradient, b: ev.target.value })
                        }
                      />
                      <select
                        value={gradient.direction}
                        aria-label="Gradient direction"
                        onChange={(ev) =>
                          setGradient({
                            ...gradient,
                            direction: ev.target.value,
                          })
                        }
                      >
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                        <option value="diagonal">Diagonal</option>
                      </select>
                    </div>
                    <button
                      className="mini-button full"
                      onClick={() =>
                        a.applyGradient(
                          gradient.a,
                          gradient.b,
                          gradient.direction,
                        )
                      }
                    >
                      Apply gradient
                    </button>
                    <div className="field-row">
                      <NumberField
                        label="Stroke"
                        value={o.strokeWidth || 0}
                        min={0}
                        max={100}
                        onChange={(n) =>
                          e.update({
                            strokeWidth: n,
                            stroke: o.stroke || "#171817",
                          })
                        }
                      />
                      <input
                        className="standalone-color"
                        type="color"
                        aria-label="Stroke color"
                        value={
                          /^#[0-9a-f]{6}$/i.test(o.stroke)
                            ? o.stroke
                            : "#171817"
                        }
                        onChange={(ev) =>
                          e.update({
                            stroke: ev.target.value,
                            strokeWidth: o.strokeWidth || 2,
                          })
                        }
                      />
                    </div>
                  </Section>
                )}
                <Section title="Appearance">
                  <Range
                    label="Opacity"
                    min={0}
                    max={100}
                    value={o.opacity}
                    suffix="%"
                    onChange={(n) => e.update({ opacity: n / 100 })}
                  />
                  <label className="field-label">
                    Blend mode
                    <select
                      value={o.blendMode || "source-over"}
                      onChange={(ev) =>
                        e.update({ globalCompositeOperation: ev.target.value })
                      }
                    >
                      {[
                        "source-over",
                        "multiply",
                        "screen",
                        "overlay",
                        "darken",
                        "lighten",
                        "soft-light",
                        "hard-light",
                        "difference",
                        "exclusion",
                        "color",
                        "luminosity",
                      ].map((v) => (
                        <option key={v} value={v}>
                          {v === "source-over"
                            ? "Normal"
                            : v.replaceAll("-", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="field-row">
                    <button
                      className="mini-button"
                      onClick={() => a.mask("circle")}
                    >
                      Circle mask
                    </button>
                    <button
                      className="mini-button"
                      onClick={() => a.mask("rounded")}
                    >
                      Round mask
                    </button>
                  </div>
                  {o.hasMask && (
                    <button
                      className="mini-button full"
                      onClick={() => a.mask("none")}
                    >
                      Remove mask
                    </button>
                  )}
                </Section>
                <Section title="Drop shadow" open={false}>
                  <label className="pro-color-label">
                    Shadow color
                    <input
                      type="color"
                      value={shadow.color}
                      onChange={(ev) =>
                        setShadow({ ...shadow, color: ev.target.value })
                      }
                    />
                  </label>
                  <Range
                    label="Blur"
                    min={0}
                    max={100}
                    value={shadow.blur}
                    onChange={(n) => setShadow({ ...shadow, blur: n })}
                  />
                  <div className="field-row">
                    <NumberField
                      label="X"
                      value={shadow.x}
                      onChange={(n) => setShadow({ ...shadow, x: n })}
                    />
                    <NumberField
                      label="Y"
                      value={shadow.y}
                      onChange={(n) => setShadow({ ...shadow, y: n })}
                    />
                  </div>
                  <div className="field-row">
                    <button
                      className="mini-button"
                      onClick={() =>
                        a.applyShadow(
                          true,
                          shadow.color,
                          shadow.blur,
                          shadow.x,
                          shadow.y,
                        )
                      }
                    >
                      Apply
                    </button>
                    <button
                      className="mini-button"
                      onClick={() => a.applyShadow(false)}
                    >
                      Remove
                    </button>
                  </div>
                </Section>
              </>
            ) : (
              <>
                <Section title="Document">
                  <label className="field-label">
                    Canvas preset
                    <select
                      value={
                        presets.find(
                          (p) => p.width === s.width && p.height === s.height,
                        )?.name || "custom"
                      }
                      onChange={(ev) => {
                        const p = presets.find(
                          (p) => p.name === ev.target.value,
                        );
                        if (p) e.resize(p.width, p.height);
                      }}
                    >
                      <option value="custom">Custom dimensions</option>
                      {presets.map((p) => (
                        <option key={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                  <div className="field-row">
                    <NumberField
                      label="W"
                      value={s.width}
                      min={100}
                      max={8192}
                      onChange={(n) => e.resize(n, s.height)}
                    />
                    <NumberField
                      label="H"
                      value={s.height}
                      min={100}
                      max={8192}
                      onChange={(n) => e.resize(s.width, n)}
                    />
                  </div>
                  <p className="pro-help">Pixels · RGB color · 1 artboard</p>
                </Section>
                <Section title="Canvas background">
                  <label className="pro-color-label">
                    Color
                    <input
                      type="color"
                      value={
                        /^#[0-9a-f]{6}$/i.test(s.canvas?.backgroundColor)
                          ? s.canvas.backgroundColor
                          : "#ffffff"
                      }
                      onChange={(ev) => a.setBackground(ev.target.value)}
                    />
                  </label>
                  <button
                    className="mini-button full"
                    onClick={() => a.setBackground("transparent")}
                  >
                    Use transparent background
                  </button>
                  <p className="pro-help">
                    Transparency is preserved in PNG and WebP exports.
                  </p>
                </Section>
                <Section title="Grid & snapping">
                  <label className="pro-check">
                    <input
                      type="checkbox"
                      checked={s.showGrid}
                      onChange={(ev) =>
                        useStudio.setState({ showGrid: ev.target.checked })
                      }
                    />{" "}
                    Show grid
                  </label>
                  <label className="pro-check">
                    <input
                      type="checkbox"
                      checked={s.snap}
                      onChange={(ev) =>
                        useStudio.setState({ snap: ev.target.checked })
                      }
                    />{" "}
                    Snap objects to grid
                  </label>
                  <NumberField
                    label="Grid size"
                    value={s.gridSize}
                    min={5}
                    max={200}
                    onChange={(n) => useStudio.setState({ gridSize: n })}
                  />
                </Section>
                <div className="workspace-guide">
                  <span className="guide-mark">↗</span>
                  <h3>
                    Everything starts
                    <br />
                    with an idea.
                  </h3>
                  <p>
                    Select a layer to reveal its controls, or drop an image to
                    start editing.
                  </p>
                  <div>
                    <kbd>V</kbd> Move <kbd>B</kbd> Brush <kbd>T</kbd> Text
                  </div>
                </div>
              </>
            )}
            <div className="mini-layers-heading">
              Layers <span>{s.layers.length}</span>
            </div>
            <LayerList />
          </>
        )}
      </div>
      <div className="pro-save-footer">
        <Download size={14} />
        <button onClick={() => e.exportFile("json")}>
          Save editable draft
        </button>
        <span>No account needed</span>
      </div>
    </aside>
  );
}
