import { describe, expect, it } from "vitest"
import { canOpenStep, defaultFrame, detectColorRegion, detectTransparentRegion, fitScale, frameBoundsFromPoints, outputFilename, remapTransformToFrame, resizeFrame, sanitizeFilename, validateImageFile } from "./image"
import { createProject } from "../types/project"

describe("image math", () => {
  it("calculates cover and contain scales", () => { expect(fitScale(1000, 500, 200, 200, "cover")).toBe(.4); expect(fitScale(1000, 500, 200, 200, "contain")).toBe(.2) })
  it("centers a frame at 60% of the shortest side", () => { expect(defaultFrame(1000, 500)).toMatchObject({ x: 350, y: 100, width: 300, height: 300 }) })
  it("remaps a centered transform and preserves relative zoom", () => {
    const previous = { x: 100, y: 100, width: 400, height: 400, rotation: 0, shape: "rectangle" as const, borderRadius: 0 }
    const next = { ...previous, x: 50, y: 200, width: 600, height: 800 }
    const transform = { x: 300, y: 300, scale: 0.8, rotation: 12, fitMode: "cover" as const }
    expect(remapTransformToFrame(transform, 1000, 1000, previous, next)).toEqual({ x: 350, y: 600, scale: 1.6, rotation: 12, fitMode: "cover" })
  })
  it("resizes from any edge while anchoring the opposite edge", () => {
    const frame = { x: 100, y: 80, width: 300, height: 200, rotation: 0, shape: "rounded" as const, borderRadius: 20 }
    expect(resizeFrame(frame, "nw", 40, 30)).toMatchObject({ x: 140, y: 110, width: 260, height: 170 })
    expect(resizeFrame(frame, "e", 50, 0)).toMatchObject({ x: 100, width: 350 })
    expect(resizeFrame(frame, "s", 0, -20)).toMatchObject({ y: 80, height: 180 })
  })
  it("stops resizing at the minimum size", () => {
    const frame = { x: 10, y: 10, width: 100, height: 100, rotation: 0, shape: "rectangle" as const, borderRadius: 0 }
    expect(resizeFrame(frame, "nw", 200, 200)).toMatchObject({ x: 90, y: 90, width: 20, height: 20 })
  })
  it("recalculates frame bounds after a free contour point moves", () => {
    const frame = { x: 0, y: 0, width: 100, height: 100, rotation: 0, shape: "custom" as const, borderRadius: 0 }
    const points = [{ x: 20, y: 10 }, { x: 120, y: 30 }, { x: 80, y: 140 }, { x: 5, y: 90 }]
    expect(frameBoundsFromPoints(points, frame)).toMatchObject({ x: 5, y: 10, width: 115, height: 130, points })
  })
})
describe("file handling", () => {
  it("sanitizes and renders unique naming tokens", () => { expect(sanitizeFilename("Foto Àyu (1).jpg")).toBe("Foto-Ayu-1"); expect(outputFilename("twibbon-{index}-{nama-file}", "Ayu.jpg", 1, "jpeg")).toBe("twibbon-2-Ayu.jpg") })
  it("rejects unsupported and oversized images", () => { expect(validateImageFile(new File(["x"], "x.pdf", { type: "application/pdf" }))).toContain("tidak didukung"); expect(validateImageFile(new File([new Uint8Array(20 * 1024 * 1024 + 1)], "x.png", { type: "image/png" }))).toContain("20 MB") })
})
describe("step guards", () => {
  it("prevents opening incomplete steps", () => { const project = createProject(); expect(canOpenStep("template", project)).toBe(true); expect(canOpenStep("frame", project)).toBe(false); expect(canOpenStep("export", project)).toBe(false) })
})

describe("transparent area detection", () => {
  it("finds the largest enclosed transparent region", () => {
    const width = 10
    const height = 10
    const alpha = new Uint8Array(width * height).fill(255)
    for (let y = 2; y <= 7; y++) for (let x = 3; x <= 6; x++) alpha[y * width + x] = 0
    alpha[1 * width + 1] = 0

    expect(detectTransparentRegion(alpha, width, height)).toEqual({ x: 3, y: 2, width: 4, height: 6, coverage: 1 })
  })

  it("ignores transparent background connected to a canvas edge", () => {
    const width = 8
    const height = 8
    const alpha = new Uint8Array(width * height).fill(255)
    for (let y = 0; y < height; y++) alpha[y * width] = 0
    expect(detectTransparentRegion(alpha, width, height)).toBeNull()
  })
})

describe("color area detection", () => {
  it("finds an enclosed near-white region", () => {
    const width = 6
    const height = 6
    const rgba = new Uint8ClampedArray(width * height * 4).fill(255)
    for (let index = 0; index < width * height; index++) {
      rgba[index * 4] = 40; rgba[index * 4 + 1] = 50; rgba[index * 4 + 2] = 60
    }
    for (let y = 2; y <= 3; y++) for (let x = 1; x <= 4; x++) {
      const offset = (y * width + x) * 4
      rgba[offset] = 248; rgba[offset + 1] = 246; rgba[offset + 2] = 242
    }
    expect(detectColorRegion(rgba, width, height, { r: 255, g: 255, b: 255 }, { tolerance: 24 })).toMatchObject({ x: 1, y: 2, width: 4, height: 2 })
  })

  it("flood-fills the color selected by a user", () => {
    const width = 5
    const height = 5
    const rgba = new Uint8ClampedArray(width * height * 4).fill(255)
    for (let index = 0; index < width * height; index++) rgba[index * 4 + 3] = 255
    for (let y = 1; y <= 3; y++) for (let x = 1; x <= 2; x++) {
      const offset = (y * width + x) * 4
      rgba[offset] = 180; rgba[offset + 1] = 120; rgba[offset + 2] = 70
    }
    expect(detectColorRegion(rgba, width, height, { r: 180, g: 120, b: 70 }, { sample: { x: 1, y: 2 }, ignoreEdge: false })).toMatchObject({ x: 1, y: 1, width: 2, height: 3 })
  })

  it("merges aligned circle fragments separated by an occluding banner", () => {
    const width = 100
    const height = 100
    const rgba = new Uint8ClampedArray(width * height * 4)
    for (let index = 0; index < width * height; index++) {
      rgba[index * 4] = 30; rgba[index * 4 + 1] = 80; rgba[index * 4 + 2] = 180; rgba[index * 4 + 3] = 255
    }
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if ((x - 50) ** 2 + (y - 50) ** 2 > 35 ** 2 || (y >= 55 && y <= 65)) continue
      const offset = (y * width + x) * 4
      rgba[offset] = 250; rgba[offset + 1] = 250; rgba[offset + 2] = 250
    }

    const region = detectColorRegion(rgba, width, height, { r: 255, g: 255, b: 255 }, { tolerance: 10 })
    expect(region).toMatchObject({ x: 15, y: 15, width: 71, height: 71 })
    expect(region!.cornerCoverage).toBeLessThan(0.28)
  })
})
