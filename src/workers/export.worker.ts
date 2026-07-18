/// <reference lib="webworker" />
import { drawComposition } from "../lib/render"
import type { PhotoFrame, PhotoTransform, TemplateAsset } from "../types/project"

type Job = { id: string; templateBlob: Blob; photoBlob: Blob; maskBlob?: Blob; template: TemplateAsset; photoSize: { width: number; height: number }; frame: PhotoFrame; transform: PhotoTransform; width: number; height: number; format: "png" | "jpeg" | "webp"; quality: number }
self.onmessage = async (event: MessageEvent<Job>) => {
  const job = event.data
  try {
    const [template, photo, mask] = await Promise.all([createImageBitmap(job.templateBlob), createImageBitmap(job.photoBlob), job.maskBlob ? createImageBitmap(job.maskBlob) : Promise.resolve(undefined)])
    const source = new OffscreenCanvas(job.template.width, job.template.height)
    const sourceContext = source.getContext("2d")
    if (!sourceContext) throw new Error("Canvas tidak tersedia")
    drawComposition(sourceContext, template, photo, job.template, job.photoSize, job.frame, job.transform, mask)
    const output = new OffscreenCanvas(job.width, job.height)
    const outputContext = output.getContext("2d")
    if (!outputContext) throw new Error("Canvas tidak tersedia")
    outputContext.drawImage(source, 0, 0, job.width, job.height)
    const blob = await output.convertToBlob({ type: `image/${job.format}`, quality: job.quality })
    template.close(); photo.close(); mask?.close()
    self.postMessage({ id: job.id, blob })
  } catch (error) {
    self.postMessage({ id: job.id, error: error instanceof Error ? error.message : "Gagal merender foto" })
  }
}
