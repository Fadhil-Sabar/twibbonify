import type { PhotoFrame } from "../../types/project"
import { DEFAULT_SELECTION_INSET } from "./magic-selection.constants"
import type { MagicSelectionMode, SelectionBounds, SelectionConversionShape, SelectionValidation } from "./magic-selection.types"

export function rgbaDistance(source: [number, number, number, number], target: [number, number, number, number]) {
  const alphaDistance = Math.abs(source[3] - target[3]) / 255 * 100
  if (source[3] < 16 && target[3] < 16) return alphaDistance
  const rgbDistance = Math.sqrt((source[0] - target[0]) ** 2 + (source[1] - target[1]) ** 2 + (source[2] - target[2]) ** 2)
  const normalizedRgb = rgbDistance / Math.sqrt(3 * 255 ** 2) * 100
  return normalizedRgb * 0.55 + alphaDistance * 0.45
}

export function floodFillSelection(data: Uint8ClampedArray, width: number, height: number, startX: number, startY: number, tolerance: number) {
  const mask = new Uint8Array(width * height)
  if (startX < 0 || startY < 0 || startX >= width || startY >= height) return mask
  const start = startY * width + startX
  const sourceOffset = start * 4
  const target: [number, number, number, number] = [data[sourceOffset], data[sourceOffset + 1], data[sourceOffset + 2], data[sourceOffset + 3]]
  const queue = new Int32Array(width * height)
  let read = 0
  let write = 1
  queue[0] = start
  mask[start] = 255

  while (read < write) {
    const index = queue[read++]
    const x = index % width
    for (const neighbor of [index - 1, index + 1, index - width, index + width]) {
      if (neighbor < 0 || neighbor >= mask.length || mask[neighbor]) continue
      if (Math.abs(neighbor % width - x) > 1) continue
      const offset = neighbor * 4
      const color: [number, number, number, number] = [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]]
      if (rgbaDistance(color, target) > tolerance) continue
      mask[neighbor] = 255
      queue[write++] = neighbor
    }
  }
  return mask
}

export function findLargestTransparentSeed(data: Uint8ClampedArray, width: number, height: number, alphaThreshold = 245) {
  const visited = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  let bestEnclosed: { seed: number; count: number } | null = null
  let bestAny: { seed: number; count: number } | null = null

  for (let start = 0; start < visited.length; start++) {
    if (visited[start] || data[start * 4 + 3] >= alphaThreshold) continue
    let read = 0
    let write = 1
    let touchesEdge = false
    let minX = width; let minY = height; let maxX = 0; let maxY = 0
    queue[0] = start
    visited[start] = 1
    while (read < write) {
      const index = queue[read++]
      const x = index % width
      const y = Math.floor(index / width)
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesEdge = true
      for (const neighbor of [index - 1, index + 1, index - width, index + width]) {
        if (neighbor < 0 || neighbor >= visited.length || visited[neighbor] || data[neighbor * 4 + 3] >= alphaThreshold) continue
        if (Math.abs(neighbor % width - x) > 1) continue
        visited[neighbor] = 1
        queue[write++] = neighbor
      }
    }
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    let seed = queue[0]
    let nearest = Number.POSITIVE_INFINITY
    for (let index = 0; index < write; index++) {
      const pixel = queue[index]
      const distance = (pixel % width - centerX) ** 2 + (Math.floor(pixel / width) - centerY) ** 2
      if (distance < nearest) { nearest = distance; seed = pixel }
    }
    const candidate = { seed, count: write }
    if (!bestAny || write > bestAny.count) bestAny = candidate
    if (!touchesEdge && (!bestEnclosed || write > bestEnclosed.count)) bestEnclosed = candidate
  }
  const selected = bestEnclosed ?? bestAny
  return selected ? { x: selected.seed % width, y: Math.floor(selected.seed / width) } : null
}

export function mergeSelection(previous: Uint8Array | undefined, incoming: Uint8Array, mode: MagicSelectionMode) {
  if (!previous || mode === "replace") return incoming
  const result = previous.slice()
  for (let index = 0; index < result.length; index++) {
    if (mode === "add" && incoming[index]) result[index] = 255
    if (mode === "subtract" && incoming[index]) result[index] = 0
  }
  return result
}

export function invertSelection(mask: Uint8Array) {
  const result = new Uint8Array(mask.length)
  for (let index = 0; index < mask.length; index++) result[index] = mask[index] ? 0 : 255
  return result
}

export function expandSelection(mask: Uint8Array, width: number, height: number, amount = 1) {
  let current = mask.slice()
  for (let pass = 0; pass < Math.max(0, amount); pass++) {
    const next = current.slice()
    for (let index = 0; index < current.length; index++) {
      if (!current[index]) continue
      const x = index % width
      if (x > 0) next[index - 1] = 255
      if (x < width - 1) next[index + 1] = 255
      if (index >= width) next[index - width] = 255
      if (index < width * (height - 1)) next[index + width] = 255
    }
    current = next
  }
  return current
}

export function contractSelection(mask: Uint8Array, width: number, height: number, amount = 1) {
  let current = mask.slice()
  for (let pass = 0; pass < Math.max(0, amount); pass++) {
    const next = current.slice()
    for (let index = 0; index < current.length; index++) {
      if (!current[index]) continue
      const x = index % width
      const y = Math.floor(index / width)
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1 || !current[index - 1] || !current[index + 1] || !current[index - width] || !current[index + width]) next[index] = 0
    }
    current = next
  }
  return current
}

export function selectionBounds(mask: Uint8Array, width: number, height: number): SelectionBounds | null {
  let minX = width; let minY = height; let maxX = -1; let maxY = -1
  for (let index = 0; index < mask.length; index++) {
    if (!mask[index]) continue
    const x = index % width
    const y = Math.floor(index / width)
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
  return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

export function countSelection(mask: Uint8Array) {
  let count = 0
  for (const pixel of mask) if (pixel) count++
  return count
}

export function selectionMaskImageData(mask: Uint8Array, width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let index = 0; index < mask.length; index++) {
    if (!mask[index]) continue
    const offset = index * 4
    data[offset] = 255; data[offset + 1] = 255; data[offset + 2] = 255; data[offset + 3] = mask[index]
  }
  return data
}

export async function selectionMaskToBlob(mask: Uint8Array, width: number, height: number, feather = 0) {
  const source = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(width, height) : Object.assign(document.createElement("canvas"), { width, height })
  const sourceContext = source.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
  if (!sourceContext) throw new Error("Canvas mask tidak tersedia.")
  sourceContext.putImageData(new ImageData(selectionMaskImageData(mask, width, height), width, height), 0, 0)
  let output = source
  if (feather > 0) {
    output = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(width, height) : Object.assign(document.createElement("canvas"), { width, height })
    const outputContext = output.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
    if (!outputContext) throw new Error("Canvas mask tidak tersedia.")
    outputContext.filter = `blur(${feather}px)`
    outputContext.drawImage(source, 0, 0)
  }
  if (typeof OffscreenCanvas !== "undefined" && output instanceof OffscreenCanvas) return output.convertToBlob({ type: "image/png" })
  return new Promise<Blob>((resolve, reject) => { (output as HTMLCanvasElement).toBlob((blob) => blob ? resolve(blob) : reject(new Error("Mask gagal disimpan.")), "image/png") })
}

export function scaleSelectionBounds(bounds: SelectionBounds, workingWidth: number, workingHeight: number, targetWidth: number, targetHeight: number): SelectionBounds {
  const scaleX = targetWidth / workingWidth
  const scaleY = targetHeight / workingHeight
  return { x: bounds.x * scaleX, y: bounds.y * scaleY, width: bounds.width * scaleX, height: bounds.height * scaleY }
}

export function validateSelection(bounds: SelectionBounds | null, selectedPixelCount: number, imageWidth: number, imageHeight: number, targetWidth = imageWidth, targetHeight = imageHeight): SelectionValidation {
  if (!bounds || selectedPixelCount === 0) return { valid: false, error: "Area tidak dapat dideteksi. Coba tingkatkan toleransi atau pilih titik lain." }
  const ratio = selectedPixelCount / (imageWidth * imageHeight)
  if (ratio < 0.001) return { valid: false, error: "Area yang dipilih terlalu kecil." }
  if (bounds.width * targetWidth / imageWidth < 20 || bounds.height * targetHeight / imageHeight < 20) return { valid: false, error: "Area foto harus berukuran minimal 20 × 20 pixel." }
  if (ratio > 0.95) return { valid: true, warning: "Area yang dipilih hampir memenuhi seluruh template. Coba kurangi toleransi." }
  return { valid: true }
}

export function convertSelectionToFrame(bounds: SelectionBounds, shape: SelectionConversionShape, selectedPixelCount: number, workingWidth: number, workingHeight: number, templateWidth: number, templateHeight: number): PhotoFrame {
  const scaled = scaleSelectionBounds(bounds, workingWidth, workingHeight, templateWidth, templateHeight)
  const insetX = DEFAULT_SELECTION_INSET * templateWidth / workingWidth
  const insetY = DEFAULT_SELECTION_INSET * templateHeight / workingHeight
  let x = scaled.x + insetX
  let y = scaled.y + insetY
  let width = Math.max(20, scaled.width - insetX * 2)
  let height = Math.max(20, scaled.height - insetY * 2)
  const fillRatio = selectedPixelCount / Math.max(1, bounds.width * bounds.height)
  const resolved: Exclude<SelectionConversionShape, "auto"> = shape === "auto"
    ? (width / height >= 0.85 && width / height <= 1.15 && fillRatio >= 0.65 && fillRatio <= 0.9 ? "circle" : "rounded")
    : shape
  if (resolved === "circle") {
    const size = Math.min(width, height)
    x += (width - size) / 2; y += (height - size) / 2; width = size; height = size
  }
  return { x, y, width, height, rotation: 0, shape: resolved, borderRadius: resolved === "rounded" ? Math.min(width, height) * 0.12 : 0 }
}
