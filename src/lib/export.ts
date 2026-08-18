import { zipSync } from "fflate"
import { getAsset } from "../db/database"
import { outputFilename, sanitizeFilename } from "./image"
import { createCanvas, drawCutout } from "./render"
import type { PhotoFrame, TemplateAsset, TwibbonProject } from "../types/project"

type Progress = (completed: number, current: string) => void
export async function exportProject(project: TwibbonProject, onProgress: Progress, signal: AbortSignal) {
  if (!project.template || !project.frame) throw new Error("Project belum lengkap")
  const templateRecord = await getAsset(project.template.id)
  if (!templateRecord) throw new Error("Template tidak ditemukan di perangkat")
  const maskRecord = project.frame.maskAssetId ? await getAsset(project.frame.maskAssetId) : undefined
  const worker = new Worker(new URL("../workers/export.worker.ts", import.meta.url), { type: "module" })
  const files: Record<string, Uint8Array> = {}
  try {
    for (let index = 0; index < project.photos.length; index++) {
      if (signal.aborted) throw new DOMException("Export dibatalkan", "AbortError")
      const photo = project.photos[index]
      const record = await getAsset(photo.id)
      if (!record) continue
      const blob = await new Promise<Blob>((resolve, reject) => {
        const id = crypto.randomUUID()
        const abort = () => reject(new DOMException("Export dibatalkan", "AbortError"))
        signal.addEventListener("abort", abort, { once: true })
        worker.onmessage = (event: MessageEvent<{ id: string; blob?: Blob; error?: string }>) => {
          if (event.data.id !== id) return
          signal.removeEventListener("abort", abort)
          if (event.data.blob) resolve(event.data.blob); else reject(new Error(event.data.error))
        }
        worker.postMessage({ id, templateBlob: templateRecord.blob, photoBlob: record.blob, maskBlob: maskRecord?.blob, template: project.template, photoSize: { width: photo.width, height: photo.height }, frame: project.frame, transform: photo.transform, ...project.exportSettings })
      })
      const name = outputFilename(project.exportSettings.namingPattern, photo.fileName, index, project.exportSettings.format)
      let uniqueName = name
      let duplicate = 2
      while (files[uniqueName]) uniqueName = name.replace(/(\.[^.]+)$/, `-${duplicate++}$1`)
      files[uniqueName] = new Uint8Array(await blob.arrayBuffer())
      onProgress(index + 1, photo.fileName)
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    return new Blob([zipSync(files, { level: 0 }) as BlobPart], { type: "application/zip" })
  } finally { worker.terminate() }
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url; anchor.download = name; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function getCutoutFilename(project: TwibbonProject): string {
  const base = project.template?.fileName
    ? sanitizeFilename(project.template.fileName)
    : sanitizeFilename(project.name || "twibbon")
  return `${base}-cutout.png`
}

export async function renderCutoutBlob(
  templateBlob: Blob,
  templateMeta: TemplateAsset,
  frame: PhotoFrame,
  maskBlob?: Blob,
  outputWidth?: number,
  outputHeight?: number,
): Promise<Blob> {
  const [templateBitmap, maskBitmap] = await Promise.all([
    createImageBitmap(templateBlob),
    maskBlob ? createImageBitmap(maskBlob) : Promise.resolve(undefined),
  ])

  const targetWidth = outputWidth ?? templateMeta.width
  const targetHeight = outputHeight ?? templateMeta.height

  try {
    const canvas = createCanvas(templateMeta.width, templateMeta.height)
    const context = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
    if (!context) throw new Error("Canvas tidak tersedia")

    drawCutout(context, templateBitmap, templateMeta, frame, maskBitmap)

    let finalCanvas: HTMLCanvasElement | OffscreenCanvas = canvas
    if (targetWidth !== templateMeta.width || targetHeight !== templateMeta.height) {
      const scaledCanvas = createCanvas(targetWidth, targetHeight)
      const scaledContext = scaledCanvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
      if (!scaledContext) throw new Error("Canvas tidak tersedia")
      scaledContext.drawImage(canvas, 0, 0, targetWidth, targetHeight)
      finalCanvas = scaledCanvas
    }

    if ("convertToBlob" in finalCanvas && typeof (finalCanvas as OffscreenCanvas).convertToBlob === "function") {
      return await (finalCanvas as OffscreenCanvas).convertToBlob({ type: "image/png" })
    }

    return await new Promise<Blob>((resolve, reject) => {
      ;(finalCanvas as HTMLCanvasElement).toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Gagal membuat file PNG"))
      }, "image/png")
    })
  } finally {
    templateBitmap.close()
    maskBitmap?.close()
  }
}

export async function exportTemplateCutout(
  project: TwibbonProject,
  outputWidth?: number,
  outputHeight?: number,
): Promise<Blob> {
  if (!project.template || !project.frame) throw new Error("Template atau frame belum ditentukan")
  const templateRecord = await getAsset(project.template.id)
  if (!templateRecord) throw new Error("Template tidak ditemukan di perangkat")
  const maskRecord = project.frame.maskAssetId ? await getAsset(project.frame.maskAssetId) : undefined

  return await renderCutoutBlob(
    templateRecord.blob,
    project.template,
    project.frame,
    maskRecord?.blob,
    outputWidth,
    outputHeight,
  )
}
