import { useStudio, notify } from "./store";
export const AUTOSAVE_KEY = "brandique.autosave.v1";
const PROJECTS_KEY = "brandique.projects.v1";
let timer;
export function readAutosave(storage) {
  try {
    storage ||= globalThis.localStorage;
    const raw = storage?.getItem(AUTOSAVE_KEY);
    return raw ? JSON.parse(raw).document : null;
  } catch {
    return null;
  }
}
export function writeAutosave(document, storage = globalThis.localStorage) {
  const raw = JSON.stringify({ savedAt: Date.now(), document });
  if (raw.length > 2_000_000)
    throw Error(
      "This design is too large for localStorage. Download a draft to keep it.",
    );
  storage.setItem(AUTOSAVE_KEY, raw);
  return raw.length;
}
export function scheduleAutosave(doc) {
  clearTimeout(timer);
  useStudio.setState({ saveStatus: "Saving on this device…" });
  timer = setTimeout(() => {
    try {
      writeAutosave(doc);
      useStudio.setState({ saveStatus: "Saved on this device", dirty: false });
    } catch (error) {
      useStudio.setState({ saveStatus: "Download draft to save", dirty: true });
      notify(
        error.message || "Browser storage is unavailable. Download a draft.",
      );
    }
  }, 700);
}
export function projectList() {
  try {
    const entries = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}
export function saveProject(document) {
  try {
    const entries = projectList();
    const next = [
      {
        id: crypto.randomUUID(),
        name: document.title || "Untitled design",
        savedAt: Date.now(),
        document,
      },
      ...entries,
    ];
    const raw = JSON.stringify(next);
    if (raw.length > 1_500_000)
      throw Error(
        "Project shelf is full. Download a draft or delete an older saved project.",
      );
    localStorage.setItem(PROJECTS_KEY, raw);
    notify("Saved to this device’s project shelf");
    return true;
  } catch (error) {
    notify(error.message);
    return false;
  }
}
export function deleteProject(id) {
  try {
    localStorage.setItem(
      PROJECTS_KEY,
      JSON.stringify(projectList().filter((p) => p.id !== id)),
    );
    return true;
  } catch {
    notify("Could not update local projects.");
    return false;
  }
}
export function clearAutosave() {
  clearTimeout(timer);
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
    notify("Local recovery draft cleared");
  } catch {
    notify("Browser storage is unavailable.");
  }
}
