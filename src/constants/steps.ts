import type { EditorStep } from "../types/project"

export const STEP_META: { id: EditorStep; label: string; short: string }[] = [
  { id: "template", label: "Upload Template", short: "Template" },
  { id: "frame", label: "Area Foto", short: "Area Foto" },
  { id: "photos", label: "Upload Foto", short: "Foto" },
  { id: "preview", label: "Atur & Preview", short: "Preview" },
  { id: "export", label: "Download", short: "Unduh" },
]

export function route() {
  return location.pathname === "/editor" ? "editor" : "landing"
}

export function stepFromUrl(): EditorStep {
  const value = new URLSearchParams(location.search).get("step") as EditorStep
  return STEP_META.some((step) => step.id === value) ? value : "template"
}

export function navigate(path: string) {
  history.pushState(null, "", path)
  dispatchEvent(new PopStateEvent("popstate"))
  scrollTo({ top: 0, behavior: "smooth" })
}
