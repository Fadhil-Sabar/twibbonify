import type { PhotoFrame } from "../../types/project"

export type MagicSelectionMode = "replace" | "add" | "subtract"
export type SelectionConversionShape = "auto" | "rectangle" | "circle" | "rounded"
export type SelectionBounds = { x: number; y: number; width: number; height: number }

export type MagicSelectionSettings = {
  tolerance: number
  contiguous: true
  expansion: number
  feather: number
}

export type MagicSelectionState = {
  active: boolean
  status: "idle" | "processing" | "ready" | "error"
  mode: MagicSelectionMode
  settings: MagicSelectionSettings
  mask: Uint8Array | null
  bounds: SelectionBounds | null
  selectedPixelCount: number
  lastPoint: { x: number; y: number } | null
  errorMessage: string | null
  workingWidth: number
  workingHeight: number
}

export type MagicSelectionRequest = {
  requestId: string
  operation: "select" | "auto-transparent" | "invert" | "expand" | "contract"
  imageData?: ImageData
  width: number
  height: number
  startX?: number
  startY?: number
  tolerance: number
  mode: MagicSelectionMode
  previousMask?: Uint8Array
  amount?: number
}

export type MagicSelectionResult = {
  requestId: string
  mask: Uint8Array
  bounds: SelectionBounds | null
  selectedPixelCount: number
  seed?: { x: number; y: number }
  error?: string
}

export type SelectionValidation = { valid: boolean; warning?: string; error?: string }
export type ConvertedSelection = { frame: PhotoFrame; warning?: string }
