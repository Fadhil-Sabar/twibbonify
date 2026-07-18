export type ImageMime = "image/png" | "image/jpeg" | "image/webp"
export type EditorStep = "template" | "frame" | "photos" | "preview" | "export"

export type TemplateAsset = {
  id: string; fileName: string; mimeType: ImageMime; width: number; height: number
  size: number; hasTransparency: boolean; renderMode: "transparent-overlay" | "photo-on-top"
}
export type FramePoint = { x: number; y: number }
export type PhotoFrame = { x: number; y: number; width: number; height: number; rotation: number; shape: "rectangle" | "circle" | "rounded" | "custom"; borderRadius: number; maskColor?: { r: number; g: number; b: number; tolerance: number }; points?: FramePoint[]; maskAssetId?: string; maskWidth?: number; maskHeight?: number; maskSourceBounds?: { x: number; y: number; width: number; height: number } }
export type PhotoTransform = { x: number; y: number; scale: number; rotation: number; fitMode: "cover" | "contain" }
export type PhotoItem = { id: string; fileName: string; mimeType: ImageMime; width: number; height: number; size: number; transform: PhotoTransform; status: "ready" | "warning" | "error"; warning?: "low-resolution" | "invalid-image"; createdAt: number }
export type ExportSettings = { format: "png" | "jpeg" | "webp"; quality: number; width: number; height: number; namingPattern: string }
export type TwibbonProject = { id: string; name: string; template: TemplateAsset | null; frame: PhotoFrame | null; photos: PhotoItem[]; exportSettings: ExportSettings; createdAt: number; updatedAt: number }

export const defaultExportSettings: ExportSettings = { format: "png", quality: 0.92, width: 1080, height: 1080, namingPattern: "twibbon-{nama-file}" }
export const createProject = (): TwibbonProject => { const now = Date.now(); return { id: crypto.randomUUID(), name: "Twibbon baru", template: null, frame: null, photos: [], exportSettings: defaultExportSettings, createdAt: now, updatedAt: now } }
