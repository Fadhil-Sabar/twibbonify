import type { PhotoFrame, PhotoTransform, TemplateAsset } from "../types/project"

type RenderContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
type RenderCanvas = HTMLCanvasElement | OffscreenCanvas

export function isPointInPolygon(x: number, y: number, points: { x: number; y: number }[]) {
  let inside = false
  for (let current = 0, previous = points.length - 1; current < points.length; previous = current++) {
    const a = points[current]
    const b = points[previous]
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

function createCanvas(width: number, height: number): RenderCanvas {
  return typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(width, height)
    : Object.assign(document.createElement("canvas"), { width, height })
}

export function applyColorMask(data: Uint8ClampedArray, canvasWidth: number, canvasHeight: number, frame: PhotoFrame) {
  if (!frame.maskColor) return data
  const { r, g, b, tolerance } = frame.maskColor
  const startX = Math.max(0, Math.floor(frame.x))
  const startY = Math.max(0, Math.floor(frame.y))
  const endX = Math.min(canvasWidth, Math.ceil(frame.x + frame.width))
  const endY = Math.min(canvasHeight, Math.ceil(frame.y + frame.height))
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const offset = (y * canvasWidth + x) * 4
      if (Math.abs(data[offset] - r) <= tolerance && Math.abs(data[offset + 1] - g) <= tolerance && Math.abs(data[offset + 2] - b) <= tolerance) data[offset + 3] = 0
    }
  }
  return data
}

export function buildFlexibleMask(templateData: Uint8ClampedArray, maskData: Uint8ClampedArray, canvasWidth: number, canvasHeight: number, frame: PhotoFrame, alphaMode: boolean) {
  const startX = Math.max(0, Math.floor(frame.x))
  const startY = Math.max(0, Math.floor(frame.y))
  const endX = Math.min(canvasWidth, Math.ceil(frame.x + frame.width))
  const endY = Math.min(canvasHeight, Math.ceil(frame.y + frame.height))
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const offset = (y * canvasWidth + x) * 4
      if (frame.points && frame.points.length >= 3 && !isPointInPolygon(x + 0.5, y + 0.5, frame.points)) continue
      const color = frame.maskColor
      const selected = color
        ? Math.abs(templateData[offset] - color.r) <= color.tolerance && Math.abs(templateData[offset + 1] - color.g) <= color.tolerance && Math.abs(templateData[offset + 2] - color.b) <= color.tolerance
        : alphaMode && templateData[offset + 3] < 245
      if (!selected) continue
      maskData[offset] = 255
      maskData[offset + 1] = 255
      maskData[offset + 2] = 255
      maskData[offset + 3] = color ? 255 : 255 - templateData[offset + 3]
      if (color) templateData[offset + 3] = 0
    }
  }
  return maskData
}

export function clipFrame(context: RenderContext, frame: PhotoFrame) {
  context.beginPath()
  if (frame.shape === "circle") context.ellipse(frame.x + frame.width / 2, frame.y + frame.height / 2, frame.width / 2, frame.height / 2, 0, 0, Math.PI * 2)
  else if (frame.shape === "rounded") context.roundRect(frame.x, frame.y, frame.width, frame.height, Math.min(frame.borderRadius, frame.width / 2, frame.height / 2))
  else context.rect(frame.x, frame.y, frame.width, frame.height)
  context.clip()
}

function drawTransformedPhoto(context: RenderContext, photo: CanvasImageSource, photoWidth: number, photoHeight: number, transform: PhotoTransform) {
  context.save()
  context.translate(transform.x, transform.y)
  context.rotate(transform.rotation * Math.PI / 180)
  context.scale(transform.scale, transform.scale)
  context.drawImage(photo, -photoWidth / 2, -photoHeight / 2)
  context.restore()
}

export function drawPhoto(context: RenderContext, photo: CanvasImageSource, photoWidth: number, photoHeight: number, frame: PhotoFrame, transform: PhotoTransform) {
  context.save()
  clipFrame(context, frame)
  drawTransformedPhoto(context, photo, photoWidth, photoHeight, transform)
  context.restore()
}

function drawFlexibleComposition(context: RenderContext, template: CanvasImageSource, photo: CanvasImageSource, meta: TemplateAsset, photoSize: { width: number; height: number }, frame: PhotoFrame, transform: PhotoTransform) {
  const overlayCanvas = createCanvas(meta.width, meta.height)
  const maskCanvas = createCanvas(meta.width, meta.height)
  const photoCanvas = createCanvas(meta.width, meta.height)
  const overlayContext = overlayCanvas.getContext("2d", { willReadFrequently: true }) as RenderContext | null
  const maskContext = maskCanvas.getContext("2d") as RenderContext | null
  const photoContext = photoCanvas.getContext("2d") as RenderContext | null
  if (!overlayContext || !maskContext || !photoContext) return

  overlayContext.drawImage(template, 0, 0, meta.width, meta.height)
  const overlayData = overlayContext.getImageData(0, 0, meta.width, meta.height)
  const maskData = maskContext.createImageData(meta.width, meta.height)
  buildFlexibleMask(overlayData.data, maskData.data, meta.width, meta.height, frame, meta.renderMode === "transparent-overlay")
  overlayContext.putImageData(overlayData, 0, 0)
  maskContext.putImageData(maskData, 0, 0)

  drawTransformedPhoto(photoContext, photo, photoSize.width, photoSize.height, transform)
  photoContext.globalCompositeOperation = "destination-in"
  photoContext.drawImage(maskCanvas, 0, 0)
  photoContext.globalCompositeOperation = "source-over"

  context.drawImage(photoCanvas, 0, 0)
  context.drawImage(overlayCanvas, 0, 0)
}

function drawStoredMaskComposition(context: RenderContext, template: CanvasImageSource, photo: CanvasImageSource, mask: CanvasImageSource, meta: TemplateAsset, photoSize: { width: number; height: number }, frame: PhotoFrame, transform: PhotoTransform) {
  const photoCanvas = createCanvas(meta.width, meta.height)
  const overlayCanvas = createCanvas(meta.width, meta.height)
  const maskCanvas = createCanvas(meta.width, meta.height)
  const photoContext = photoCanvas.getContext("2d") as RenderContext | null
  const overlayContext = overlayCanvas.getContext("2d") as RenderContext | null
  const maskContext = maskCanvas.getContext("2d") as RenderContext | null
  if (!photoContext || !overlayContext || !maskContext) return

  const source = frame.maskSourceBounds
  if (source) {
    maskContext.save()
    maskContext.translate(frame.x + frame.width / 2, frame.y + frame.height / 2)
    maskContext.rotate(frame.rotation * Math.PI / 180)
    maskContext.scale(frame.width / source.width, frame.height / source.height)
    maskContext.drawImage(mask, -source.x - source.width / 2, -source.y - source.height / 2, meta.width, meta.height)
    maskContext.restore()
  } else maskContext.drawImage(mask, 0, 0, meta.width, meta.height)

  drawTransformedPhoto(photoContext, photo, photoSize.width, photoSize.height, transform)
  photoContext.globalCompositeOperation = "destination-in"
  photoContext.drawImage(maskCanvas, 0, 0)
  photoContext.globalCompositeOperation = "source-over"

  overlayContext.drawImage(template, 0, 0, meta.width, meta.height)
  overlayContext.globalCompositeOperation = "destination-out"
  overlayContext.drawImage(maskCanvas, 0, 0)
  overlayContext.globalCompositeOperation = "source-over"

  context.drawImage(photoCanvas, 0, 0)
  context.drawImage(overlayCanvas, 0, 0)
}

export function drawComposition(context: RenderContext, template: CanvasImageSource, photo: CanvasImageSource, meta: TemplateAsset, photoSize: { width: number; height: number }, frame: PhotoFrame, transform: PhotoTransform, confirmedMask?: CanvasImageSource) {
  context.clearRect(0, 0, meta.width, meta.height)
  if (confirmedMask) {
    drawStoredMaskComposition(context, template, photo, confirmedMask, meta, photoSize, frame, transform)
    return
  }
  if (frame.shape === "custom" || frame.maskColor) {
    drawFlexibleComposition(context, template, photo, meta, photoSize, frame, transform)
    return
  }
  if (meta.renderMode === "photo-on-top") context.drawImage(template, 0, 0, meta.width, meta.height)
  drawPhoto(context, photo, photoSize.width, photoSize.height, frame, transform)
  if (meta.renderMode === "transparent-overlay") context.drawImage(template, 0, 0, meta.width, meta.height)
}
