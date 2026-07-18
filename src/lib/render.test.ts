import { describe, expect, it } from "vitest"
import { applyColorMask, buildFlexibleMask, isPointInPolygon } from "./render"
import type { PhotoFrame } from "../types/project"

describe("template color masking", () => {
  it("removes matching pixels only inside the detected frame", () => {
    const width = 4
    const height = 3
    const data = new Uint8ClampedArray(width * height * 4).fill(255)
    const frame: PhotoFrame = {
      x: 1, y: 1, width: 2, height: 1, rotation: 0, shape: "rectangle", borderRadius: 0,
      maskColor: { r: 255, g: 255, b: 255, tolerance: 10 },
    }

    applyColorMask(data, width, height, frame)

    expect(data[(1 * width + 1) * 4 + 3]).toBe(0)
    expect(data[(1 * width + 2) * 4 + 3]).toBe(0)
    expect(data[3]).toBe(255)
  })

  it("preserves non-matching artwork inside the frame", () => {
    const data = new Uint8ClampedArray([220, 0, 0, 255])
    const frame: PhotoFrame = {
      x: 0, y: 0, width: 1, height: 1, rotation: 0, shape: "rectangle", borderRadius: 0,
      maskColor: { r: 255, g: 255, b: 255, tolerance: 20 },
    }
    applyColorMask(data, 1, 1, frame)
    expect(data[3]).toBe(255)
  })

  it("builds an exact irregular mask instead of filling its bounding box", () => {
    const width = 3
    const height = 3
    const template = new Uint8ClampedArray(width * height * 4)
    const mask = new Uint8ClampedArray(width * height * 4)
    for (let index = 0; index < width * height; index++) {
      template[index * 4] = 20; template[index * 4 + 1] = 30; template[index * 4 + 2] = 40; template[index * 4 + 3] = 255
    }
    for (const [x, y] of [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]) {
      const offset = (y * width + x) * 4
      template[offset] = 250; template[offset + 1] = 250; template[offset + 2] = 250
    }
    const frame: PhotoFrame = { x: 0, y: 0, width: 3, height: 3, rotation: 0, shape: "custom", borderRadius: 0, maskColor: { r: 255, g: 255, b: 255, tolerance: 10 } }
    buildFlexibleMask(template, mask, width, height, frame, false)
    expect(mask[(1 * width + 1) * 4 + 3]).toBe(255)
    expect(mask[3]).toBe(0)
    expect(template[(1 * width + 1) * 4 + 3]).toBe(0)
  })

  it("uses template alpha as a flexible mask", () => {
    const template = new Uint8ClampedArray([100, 100, 100, 0, 100, 100, 100, 255])
    const mask = new Uint8ClampedArray(8)
    const frame: PhotoFrame = { x: 0, y: 0, width: 2, height: 1, rotation: 0, shape: "custom", borderRadius: 0 }
    buildFlexibleMask(template, mask, 2, 1, frame, true)
    expect(mask[3]).toBe(255)
    expect(mask[7]).toBe(0)
  })

  it("clips an irregular pixel mask to edited contour points", () => {
    const points = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 2, y: 2 }, { x: 4, y: 4 }, { x: 0, y: 4 }]
    expect(isPointInPolygon(1, 2, points)).toBe(true)
    expect(isPointInPolygon(3.5, 2, points)).toBe(false)
  })
})
