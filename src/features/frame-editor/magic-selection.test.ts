import { describe, expect, it } from "vitest"
import { contractSelection, convertSelectionToFrame, expandSelection, floodFillSelection, invertSelection, mergeSelection, rgbaDistance, scaleSelectionBounds, selectionBounds, validateSelection } from "./magic-selection.lib"

function image(width: number, height: number, pixels: [number, number, number, number][]) {
  const data = new Uint8ClampedArray(width * height * 4)
  pixels.forEach((pixel, index) => data.set(pixel, index * 4))
  return data
}

describe("RGBA distance", () => {
  it("normalizes identical and opposite colors", () => {
    expect(rgbaDistance([10, 20, 30, 255], [10, 20, 30, 255])).toBe(0)
    expect(rgbaDistance([0, 0, 0, 255], [255, 255, 255, 255])).toBeCloseTo(55)
  })
  it("prioritizes alpha and ignores meaningless RGB for transparent pixels", () => {
    expect(rgbaDistance([0, 0, 0, 0], [255, 20, 90, 0])).toBe(0)
    expect(rgbaDistance([0, 0, 0, 0], [0, 0, 0, 255])).toBeGreaterThan(40)
  })
})

describe("contiguous flood fill", () => {
  const white: [number, number, number, number] = [255, 255, 255, 255]
  const gray: [number, number, number, number] = [220, 220, 220, 255]
  const black: [number, number, number, number] = [0, 0, 0, 255]
  it("selects one connected region without crossing a divider", () => {
    const data = image(5, 2, [white, white, black, white, white, white, white, black, white, white])
    expect([...floodFillSelection(data, 5, 2, 0, 0, 5)]).toEqual([255, 255, 0, 0, 0, 255, 255, 0, 0, 0])
  })
  it("responds to low and high tolerance", () => {
    const data = image(3, 1, [white, gray, black])
    expect([...floodFillSelection(data, 3, 1, 0, 0, 2)]).toEqual([255, 0, 0])
    expect([...floodFillSelection(data, 3, 1, 0, 0, 10)]).toEqual([255, 255, 0])
  })
})

describe("selection operations", () => {
  it("adds and subtracts masks", () => {
    const previous = new Uint8Array([255, 0, 255, 0])
    const incoming = new Uint8Array([0, 255, 255, 0])
    expect([...mergeSelection(previous, incoming, "add")]).toEqual([255, 255, 255, 0])
    expect([...mergeSelection(previous, incoming, "subtract")]).toEqual([255, 0, 0, 0])
  })
  it("inverts a mask", () => expect([...invertSelection(new Uint8Array([0, 255]))]).toEqual([255, 0]))
  it("expands and contracts by one pixel", () => {
    const center = new Uint8Array([0, 0, 0, 0, 255, 0, 0, 0, 0])
    const expanded = expandSelection(center, 3, 3, 1)
    expect([...expanded]).toEqual([0, 255, 0, 255, 255, 255, 0, 255, 0])
    expect([...contractSelection(expanded, 3, 3, 1)]).toEqual([...center])
  })
  it("contracts a selection that touches the image boundary", () => {
    const full = new Uint8Array(25).fill(255)
    expect([...contractSelection(full, 5, 5, 1)].filter(Boolean)).toHaveLength(9)
  })
  it("calculates selection bounds", () => expect(selectionBounds(new Uint8Array([0, 0, 0, 255, 255, 0, 0, 255, 0]), 3, 3)).toEqual({ x: 0, y: 1, width: 2, height: 2 }))
})

describe("selection conversion", () => {
  it("scales working bounds to original template coordinates", () => expect(scaleSelectionBounds({ x: 10, y: 20, width: 100, height: 50 }, 500, 250, 1000, 500)).toEqual({ x: 20, y: 40, width: 200, height: 100 }))
  it("creates a centered circle from the shortest bound", () => {
    const frame = convertSelectionToFrame({ x: 10, y: 10, width: 100, height: 80 }, "circle", 7000, 200, 200, 200, 200)
    expect(frame.shape).toBe("circle")
    expect(frame.width).toBe(frame.height)
    expect(frame.x).toBeGreaterThan(10)
  })
  it("creates rounded frames with a 12 percent radius", () => {
    const frame = convertSelectionToFrame({ x: 10, y: 10, width: 100, height: 80 }, "rounded", 7000, 200, 200, 200, 200)
    expect(frame.shape).toBe("rounded")
    expect(frame.borderRadius).toBeCloseTo(Math.min(frame.width, frame.height) * .12)
  })
  it("rejects empty and tiny selections", () => {
    expect(validateSelection(null, 0, 100, 100).valid).toBe(false)
    expect(validateSelection({ x: 0, y: 0, width: 5, height: 5 }, 25, 100, 100).valid).toBe(false)
  })
})

describe("Magic Select integration flow", () => {
  it("selects a transparent fixture and converts it into an editable frame", () => {
    const width = 64
    const height = 64
    const pixels: [number, number, number, number][] = Array.from({ length: width * height }, () => [40, 80, 120, 255])
    for (let y = 12; y < 52; y++) for (let x = 14; x < 50; x++) pixels[y * width + x] = [0, 0, 0, 0]
    const mask = floodFillSelection(image(width, height, pixels), width, height, 20, 20, 4)
    const bounds = selectionBounds(mask, width, height)
    const count = mask.reduce((total, value) => total + (value ? 1 : 0), 0)
    const validation = validateSelection(bounds, count, width, height, 1080, 1080)
    expect(validation.valid).toBe(true)
    const frame = convertSelectionToFrame(bounds!, "rounded", count, width, height, 1080, 1080)
    expect(frame).toMatchObject({ shape: "rounded", rotation: 0 })
    expect(frame.width).toBeGreaterThan(500)
    expect(frame.height).toBeGreaterThan(600)
  })
})
