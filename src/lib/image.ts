import type { EditorStep, FramePoint, PhotoFrame, PhotoTransform, TwibbonProject } from "../types/project"

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const
export const MAX_FILE_SIZE = 20 * 1024 * 1024

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) return "Format file tidak didukung. Gunakan JPG, PNG, atau WebP."
  if (file.size > MAX_FILE_SIZE) return "Ukuran file melebihi batas 20 MB."
  return null
}

export function fitScale(imageWidth: number, imageHeight: number, frameWidth: number, frameHeight: number, mode: "cover" | "contain") {
  const ratios = [frameWidth / imageWidth, frameHeight / imageHeight]
  return mode === "cover" ? Math.max(...ratios) : Math.min(...ratios)
}

export function defaultFrame(width: number, height: number): PhotoFrame {
  const size = Math.round(Math.min(width, height) * 0.6)
  return { x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), width: size, height: size, rotation: 0, shape: "rectangle", borderRadius: 24 }
}

export function defaultTransform(photoWidth: number, photoHeight: number, frame: PhotoFrame, fitMode: "cover" | "contain" = "cover"): PhotoTransform {
  return { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2, scale: fitScale(photoWidth, photoHeight, frame.width, frame.height, fitMode), rotation: 0, fitMode }
}

export function remapTransformToFrame(transform: PhotoTransform, photoWidth: number, photoHeight: number, previous: PhotoFrame, next: PhotoFrame): PhotoTransform {
  const previousFit = fitScale(photoWidth, photoHeight, previous.width, previous.height, transform.fitMode)
  const nextFit = fitScale(photoWidth, photoHeight, next.width, next.height, transform.fitMode)
  const previousCenterX = previous.x + previous.width / 2
  const previousCenterY = previous.y + previous.height / 2
  const nextCenterX = next.x + next.width / 2
  const nextCenterY = next.y + next.height / 2
  return {
    ...transform,
    x: nextCenterX + (transform.x - previousCenterX) * (next.width / previous.width),
    y: nextCenterY + (transform.y - previousCenterY) * (next.height / previous.height),
    scale: previousFit > 0 ? transform.scale * (nextFit / previousFit) : nextFit,
  }
}

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

export function resizeFrame(frame: PhotoFrame, handle: ResizeHandle, deltaX: number, deltaY: number, minimumSize = 20): PhotoFrame {
  const next = { ...frame }
  const right = frame.x + frame.width
  const bottom = frame.y + frame.height

  if (handle.includes("w")) {
    next.x = Math.min(frame.x + deltaX, right - minimumSize)
    next.width = right - next.x
  }
  if (handle.includes("e")) next.width = Math.max(minimumSize, frame.width + deltaX)
  if (handle.includes("n")) {
    next.y = Math.min(frame.y + deltaY, bottom - minimumSize)
    next.height = bottom - next.y
  }
  if (handle.includes("s")) next.height = Math.max(minimumSize, frame.height + deltaY)
  return next
}

export function frameBoundsFromPoints(points: FramePoint[], base: PhotoFrame): PhotoFrame {
  if (points.length < 3) return base
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { ...base, x, y, width: Math.max(20, Math.max(...xs) - x), height: Math.max(20, Math.max(...ys) - y), points }
}

export function sanitizeFilename(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "foto"
}

export function outputFilename(pattern: string, original: string, index: number, extension: string) {
  const stem = sanitizeFilename(original)
  const rendered = pattern.replaceAll("{nama-file}", stem).replaceAll("{index}", String(index + 1))
  return `${sanitizeFilename(rendered)}.${extension === "jpeg" ? "jpg" : extension}`
}

const steps: EditorStep[] = ["template", "frame", "photos", "preview", "export"]
export function canOpenStep(step: EditorStep, project: TwibbonProject) {
  const target = steps.indexOf(step)
  if (target <= 0) return true
  if (!project.template) return false
  if (target <= 1) return true
  if (!project.frame) return false
  if (target <= 2) return true
  return project.photos.some((photo) => photo.status !== "error")
}

export async function readImage(file: Blob) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  return bitmap
}

export async function detectTransparency(blob: Blob) {
  if (blob.type === "image/jpeg") return false
  const bitmap = await readImage(blob)
  const scale = Math.min(1, 300 / Math.max(bitmap.width, bitmap.height))
  const canvas = new OffscreenCanvas(Math.max(1, Math.round(bitmap.width * scale)), Math.max(1, Math.round(bitmap.height * scale)))
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) { bitmap.close(); return false }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data
  bitmap.close()
  for (let index = 3; index < data.length; index += 4) if (data[index] < 255) return true
  return false
}

export type TransparentRegion = {
  x: number
  y: number
  width: number
  height: number
  coverage: number
  cornerCoverage?: number
}

export function detectTransparentRegion(
  alpha: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  threshold = 245,
): TransparentRegion | null {
  if (width <= 0 || height <= 0 || alpha.length !== width * height) return null

  const visited = new Uint8Array(alpha.length)
  const queue = new Int32Array(alpha.length)
  let best: TransparentRegion | null = null

  for (let start = 0; start < alpha.length; start++) {
    if (visited[start] || alpha[start] >= threshold) continue

    let read = 0
    let write = 1
    let count = 0
    let touchesEdge = false
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    queue[0] = start
    visited[start] = 1

    while (read < write) {
      const index = queue[read++]
      const x = index % width
      const y = Math.floor(index / width)
      count++
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesEdge = true

      const neighbors = [index - 1, index + 1, index - width, index + width]
      for (const neighbor of neighbors) {
        if (neighbor < 0 || neighbor >= alpha.length || visited[neighbor] || alpha[neighbor] >= threshold) continue
        const neighborX = neighbor % width
        if (Math.abs(neighborX - x) > 1) continue
        visited[neighbor] = 1
        queue[write++] = neighbor
      }
    }

    const regionWidth = maxX - minX + 1
    const regionHeight = maxY - minY + 1
    const regionArea = regionWidth * regionHeight
    if (touchesEdge || count < width * height * 0.005) continue
    if (!best || count > best.coverage * best.width * best.height) {
      best = { x: minX, y: minY, width: regionWidth, height: regionHeight, coverage: count / regionArea }
    }
  }

  return best
}

export function detectColorRegion(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  target: { r: number; g: number; b: number },
  options: { tolerance?: number; sample?: { x: number; y: number }; ignoreEdge?: boolean } = {},
): TransparentRegion | null {
  if (width <= 0 || height <= 0 || rgba.length !== width * height * 4) return null
  const tolerance = options.tolerance ?? 28
  const matches = (index: number) => {
    const offset = index * 4
    return Math.abs(rgba[offset] - target.r) <= tolerance
      && Math.abs(rgba[offset + 1] - target.g) <= tolerance
      && Math.abs(rgba[offset + 2] - target.b) <= tolerance
      && rgba[offset + 3] > 20
  }
  const visited = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  const starts = options.sample
    ? [Math.min(height - 1, Math.max(0, Math.round(options.sample.y))) * width + Math.min(width - 1, Math.max(0, Math.round(options.sample.x)))]
    : Array.from({ length: width * height }, (_, index) => index)
  type ColorComponent = TransparentRegion & { pixelCount: number }
  const components: ColorComponent[] = []
  let best: ColorComponent | null = null

  for (const start of starts) {
    if (visited[start] || !matches(start)) continue
    let read = 0
    let write = 1
    let count = 0
    let touchesEdge = false
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    queue[0] = start
    visited[start] = 1

    while (read < write) {
      const index = queue[read++]
      const x = index % width
      const y = Math.floor(index / width)
      count++
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesEdge = true
      for (const neighbor of [index - 1, index + 1, index - width, index + width]) {
        if (neighbor < 0 || neighbor >= visited.length || visited[neighbor] || !matches(neighbor)) continue
        if (Math.abs(neighbor % width - x) > 1) continue
        visited[neighbor] = 1
        queue[write++] = neighbor
      }
    }

    const regionWidth = maxX - minX + 1
    const regionHeight = maxY - minY + 1
    const regionArea = regionWidth * regionHeight
    if ((options.ignoreEdge ?? true) && touchesEdge) continue
    if (!options.sample && count < width * height * 0.001) continue
    const component = { x: minX, y: minY, width: regionWidth, height: regionHeight, coverage: count / regionArea, pixelCount: count }
    components.push(component)
    if (!best || count > best.pixelCount) best = component
  }
  if (!best || options.sample) return best

  let merged = { ...best }
  const included = new Set<ColorComponent>([best])
  let changed = true
  while (changed) {
    changed = false
    for (const component of components) {
      if (included.has(component)) continue
      const overlapX = Math.max(0, Math.min(merged.x + merged.width, component.x + component.width) - Math.max(merged.x, component.x))
      const overlapRatio = overlapX / Math.max(1, Math.min(merged.width, component.width))
      const verticalGap = Math.max(0, Math.max(merged.y, component.y) - Math.min(merged.y + merged.height, component.y + component.height))
      const centerDistance = Math.abs((merged.x + merged.width / 2) - (component.x + component.width / 2))
      if (overlapRatio < 0.45 || verticalGap > Math.max(merged.width, component.width) * 0.35 || centerDistance > Math.max(merged.width, component.width) * 0.28) continue
      const left = Math.min(merged.x, component.x)
      const top = Math.min(merged.y, component.y)
      const right = Math.max(merged.x + merged.width, component.x + component.width)
      const bottom = Math.max(merged.y + merged.height, component.y + component.height)
      merged = { x: left, y: top, width: right - left, height: bottom - top, coverage: 0, pixelCount: merged.pixelCount + component.pixelCount }
      included.add(component)
      changed = true
    }
  }

  merged.coverage = merged.pixelCount / (merged.width * merged.height)
  const cornerWidth = Math.max(1, Math.ceil(merged.width * 0.2))
  const cornerHeight = Math.max(1, Math.ceil(merged.height * 0.2))
  let cornerMatches = 0
  for (let y = merged.y; y < merged.y + merged.height; y++) {
    const inVerticalCorner = y < merged.y + cornerHeight || y >= merged.y + merged.height - cornerHeight
    if (!inVerticalCorner) continue
    for (let x = merged.x; x < merged.x + merged.width; x++) {
      const inHorizontalCorner = x < merged.x + cornerWidth || x >= merged.x + merged.width - cornerWidth
      if (inHorizontalCorner && matches(y * width + x)) cornerMatches++
    }
  }
  return { x: merged.x, y: merged.y, width: merged.width, height: merged.height, coverage: merged.coverage, cornerCoverage: cornerMatches / (cornerWidth * cornerHeight * 4) }
}

function regionToFrame(region: TransparentRegion, sampledWidth: number, sampledHeight: number, originalWidth: number, originalHeight: number): PhotoFrame {
  const scaleX = originalWidth / sampledWidth
  const scaleY = originalHeight / sampledHeight
  const aspectRatio = region.width / region.height
  const hasCircularCorners = region.cornerCoverage !== undefined && region.cornerCoverage < 0.28 && aspectRatio >= 0.72 && aspectRatio <= 1.38
  const shape = hasCircularCorners || (region.coverage >= 0.72 && region.coverage <= 0.84)
    ? "circle" as const
    : region.coverage < 0.97 ? "rounded" as const : "rectangle" as const
  const frameWidth = Math.round(region.width * scaleX)
  const frameHeight = Math.round(region.height * scaleY)
  const x = Math.round(region.x * scaleX)
  const y = Math.round(region.y * scaleY)
  const roundedLoss = Math.max(0, 1 - region.coverage)
  const estimatedRadius = Math.sqrt(roundedLoss * frameWidth * frameHeight / (4 - Math.PI))
  return { x, y, width: frameWidth, height: frameHeight, rotation: 0, shape, borderRadius: shape === "rounded" ? Math.round(Math.min(estimatedRadius, frameWidth / 2, frameHeight / 2)) : 0 }
}

export async function detectPhotoFrame(blob: Blob, originalWidth: number, originalHeight: number, colorPoint?: { x: number; y: number }): Promise<PhotoFrame | null> {
  const bitmap = await readImage(blob)
  const sampleScale = Math.min(1, 400 / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * sampleScale))
  const height = Math.max(1, Math.round(bitmap.height * sampleScale))
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) { bitmap.close(); return null }
  context.drawImage(bitmap, 0, 0, width, height)
  const rgba = context.getImageData(0, 0, width, height).data
  bitmap.close()

  let region: TransparentRegion | null
  let maskColor: PhotoFrame["maskColor"]
  if (colorPoint) {
    const sample = { x: colorPoint.x * width, y: colorPoint.y * height }
    const sampleX = Math.min(width - 1, Math.max(0, Math.floor(sample.x)))
    const sampleY = Math.min(height - 1, Math.max(0, Math.floor(sample.y)))
    const offset = (sampleY * width + sampleX) * 4
    maskColor = { r: rgba[offset], g: rgba[offset + 1], b: rgba[offset + 2], tolerance: 32 }
    region = detectColorRegion(rgba, width, height, maskColor, { tolerance: maskColor.tolerance, sample, ignoreEdge: false })
  } else {
    const alpha = new Uint8Array(width * height)
    for (let source = 3, target = 0; source < rgba.length; source += 4, target++) alpha[target] = rgba[source]
    region = detectTransparentRegion(alpha, width, height)
    if (!region) {
      maskColor = { r: 255, g: 255, b: 255, tolerance: 24 }
      region = detectColorRegion(rgba, width, height, maskColor, { tolerance: maskColor.tolerance, ignoreEdge: true })
    }
  }
  if (!region) return null
  const centerX = region.x + region.width / 2
  const centerY = region.y + region.height / 2
  const points: FramePoint[] = []
  const matches = (x: number, y: number) => {
    const offset = (y * width + x) * 4
    if (maskColor) return Math.abs(rgba[offset] - maskColor.r) <= maskColor.tolerance && Math.abs(rgba[offset + 1] - maskColor.g) <= maskColor.tolerance && Math.abs(rgba[offset + 2] - maskColor.b) <= maskColor.tolerance
    return rgba[offset + 3] < 245
  }
  const maxRadius = Math.hypot(region.width, region.height)
  for (let index = 0; index < 24; index++) {
    const angle = index / 24 * Math.PI * 2
    let boundary: FramePoint | null = null
    for (let radius = 0; radius <= maxRadius; radius += 0.75) {
      const x = Math.round(centerX + Math.cos(angle) * radius)
      const y = Math.round(centerY + Math.sin(angle) * radius)
      if (x < region.x || y < region.y || x >= region.x + region.width || y >= region.y + region.height) break
      if (matches(x, y)) boundary = { x: x * originalWidth / width, y: y * originalHeight / height }
    }
    points.push(boundary ?? {
      x: (centerX + Math.cos(angle) * region.width / 2) * originalWidth / width,
      y: (centerY + Math.sin(angle) * region.height / 2) * originalHeight / height,
    })
  }
  return { ...regionToFrame(region, width, height, originalWidth, originalHeight), shape: "custom", maskColor, points }
}
