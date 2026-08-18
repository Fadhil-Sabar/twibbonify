import { describe, expect, it } from "vitest"
import { applyColorMask, buildFlexibleMask, drawCutout, isPointInPolygon } from "./render"
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

describe("cutout rendering", () => {
  const dummyTemplate = {} as CanvasImageSource
  const meta = {
    id: "tpl-1",
    fileName: "frame.png",
    mimeType: "image/png" as const,
    width: 1000,
    height: 1000,
    size: 50000,
    hasTransparency: true,
    renderMode: "transparent-overlay" as const,
  }

  function createMockCtx() {
    const calls: string[] = []
    const ctx = {
      calls,
      globalCompositeOperation: "source-over",
      fillStyle: "#ffffff",
      clearRect: (x: number, y: number, w: number, h: number) => { calls.push(`clearRect(${x},${y},${w},${h})`) },
      drawImage: () => { calls.push("drawImage") },
      save: () => { calls.push("save") },
      restore: () => { calls.push("restore") },
      beginPath: () => { calls.push("beginPath") },
      rect: (x: number, y: number, w: number, h: number) => { calls.push(`rect(${x},${y},${w},${h})`) },
      ellipse: (x: number, y: number, rx: number, ry: number) => { calls.push(`ellipse(${x},${y},${rx},${ry})`) },
      roundRect: (x: number, y: number, w: number, h: number, r: number) => { calls.push(`roundRect(${x},${y},${w},${h},${r})`) },
      moveTo: (x: number, y: number) => { calls.push(`moveTo(${x},${y})`) },
      lineTo: (x: number, y: number) => { calls.push(`lineTo(${x},${y})`) },
      closePath: () => { calls.push("closePath") },
      fill: () => { calls.push("fill") },
      translate: (x: number, y: number) => { calls.push(`translate(${x},${y})`) },
      rotate: (rad: number) => { calls.push(`rotate(${rad})`) },
      scale: (sx: number, sy: number) => { calls.push(`scale(${sx},${sy})`) },
    }
    return ctx as unknown as CanvasRenderingContext2D & { calls: string[] }
  }

  it("cuts out rectangular frames with destination-out", () => {
    const ctx = createMockCtx()
    const frame: PhotoFrame = { x: 100, y: 100, width: 400, height: 400, rotation: 0, shape: "rectangle", borderRadius: 0 }
    drawCutout(ctx, dummyTemplate, meta, frame)
    expect(ctx.calls).toContain("clearRect(0,0,1000,1000)")
    expect(ctx.calls).toContain("drawImage")
    expect(ctx.calls).toContain("rect(100,100,400,400)")
    expect(ctx.calls).toContain("fill")
    expect(ctx.globalCompositeOperation).toBe("destination-out")
  })

  it("cuts out circular frames", () => {
    const ctx = createMockCtx()
    const frame: PhotoFrame = { x: 100, y: 100, width: 400, height: 400, rotation: 0, shape: "circle", borderRadius: 0 }
    drawCutout(ctx, dummyTemplate, meta, frame)
    expect(ctx.calls).toContain("ellipse(300,300,200,200)")
    expect(ctx.calls).toContain("fill")
  })

  it("cuts out rounded rectangle frames with border radius", () => {
    const ctx = createMockCtx()
    const frame: PhotoFrame = { x: 50, y: 50, width: 300, height: 200, rotation: 0, shape: "rounded", borderRadius: 24 }
    drawCutout(ctx, dummyTemplate, meta, frame)
    expect(ctx.calls).toContain("roundRect(50,50,300,200,24)")
    expect(ctx.calls).toContain("fill")
  })

  it("cuts out custom polygon frames", () => {
    const ctx = createMockCtx()
    const points = [{ x: 10, y: 10 }, { x: 100, y: 10 }, { x: 50, y: 100 }]
    const frame: PhotoFrame = { x: 10, y: 10, width: 90, height: 90, rotation: 0, shape: "custom", borderRadius: 0, points }
    drawCutout(ctx, dummyTemplate, meta, frame)
    expect(ctx.calls).toContain("moveTo(10,10)")
    expect(ctx.calls).toContain("lineTo(100,10)")
    expect(ctx.calls).toContain("lineTo(50,100)")
    expect(ctx.calls).toContain("closePath")
    expect(ctx.calls).toContain("fill")
  })

  it("applies rotation transform when cutting out rotated frames", () => {
    const ctx = createMockCtx()
    const frame: PhotoFrame = { x: 100, y: 100, width: 200, height: 200, rotation: 45, shape: "rectangle", borderRadius: 0 }
    drawCutout(ctx, dummyTemplate, meta, frame)
    expect(ctx.calls).toContain("translate(200,200)")
    expect(ctx.calls).toContain("rotate(0.7853981633974483)")
    expect(ctx.calls).toContain("translate(-200,-200)")
  })

  it("composites confirmed mask with destination-out for Magic Selection", () => {
    const ctx = createMockCtx()
    const dummyMask = {} as CanvasImageSource
    const frame: PhotoFrame = {
      x: 100,
      y: 100,
      width: 400,
      height: 400,
      rotation: 0,
      shape: "custom",
      borderRadius: 0,
      maskAssetId: "mask-123",
      maskSourceBounds: { x: 50, y: 50, width: 200, height: 200 },
    }
    drawCutout(ctx, dummyTemplate, meta, frame, dummyMask)
    expect(ctx.calls).toContain("clearRect(0,0,1000,1000)")
    expect(ctx.calls).toContain("drawImage")
    expect(ctx.globalCompositeOperation).toBe("destination-out")
  })
})


