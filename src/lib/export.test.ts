import { describe, expect, it } from "vitest"
import { getCutoutFilename } from "./export"
import { createProject } from "../types/project"

describe("export utilities", () => {
  it("generates cutout filename based on template filename", () => {
    const project = createProject()
    project.template = {
      id: "tpl-1",
      fileName: "twibbon-hut-ri.png",
      mimeType: "image/png",
      width: 1080,
      height: 1080,
      size: 100000,
      hasTransparency: true,
      renderMode: "transparent-overlay",
    }
    expect(getCutoutFilename(project)).toBe("twibbon-hut-ri-cutout.png")
  })

  it("handles template filename with spaces and special characters", () => {
    const project = createProject()
    project.template = {
      id: "tpl-2",
      fileName: "Template Acara (HUT #80).png",
      mimeType: "image/png",
      width: 1080,
      height: 1080,
      size: 100000,
      hasTransparency: true,
      renderMode: "transparent-overlay",
    }
    expect(getCutoutFilename(project)).toBe("Template-Acara-HUT-80-cutout.png")
  })

  it("falls back to project name if template has no filename", () => {
    const project = createProject()
    project.name = "Twibbon Ramadhan"
    project.template = {
      id: "tpl-3",
      fileName: "",
      mimeType: "image/png",
      width: 1080,
      height: 1080,
      size: 100000,
      hasTransparency: true,
      renderMode: "transparent-overlay",
    }
    expect(getCutoutFilename(project)).toBe("Twibbon-Ramadhan-cutout.png")
  })

  it("falls back to default when template and project name are empty", () => {
    const project = createProject()
    project.name = ""
    project.template = null
    expect(getCutoutFilename(project)).toBe("twibbon-cutout.png")
  })
})
