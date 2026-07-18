import { useEffect, useRef, useState } from "react"
import { getAsset } from "../../db/database"
import type { TemplateAsset } from "../../types/project"
import { MAGIC_SELECTION_MAX_DIMENSION, defaultMagicSelectionSettings } from "./magic-selection.constants"
import type { MagicSelectionMode, MagicSelectionRequest, MagicSelectionResult, MagicSelectionState } from "./magic-selection.types"

const initialState = (): MagicSelectionState => ({ active: false, status: "idle", mode: "replace", settings: defaultMagicSelectionSettings, mask: null, bounds: null, selectedPixelCount: 0, lastPoint: null, errorMessage: null, workingWidth: 0, workingHeight: 0 })

export function useMagicSelection(template: TemplateAsset | null) {
  const [state, setState] = useState<MagicSelectionState>(initialState)
  const workerRef = useRef<Worker | null>(null)
  const imageRef = useRef<ImageData | null>(null)
  const latestRequestRef = useRef("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const replayRef = useRef<{ point: { x: number; y: number }; mode: MagicSelectionMode; baseMask?: Uint8Array } | null>(null)

  const ensureWorker = () => {
    if (workerRef.current) return workerRef.current
    const worker = new Worker(new URL("../../workers/magic-selection.worker.ts", import.meta.url), { type: "module" })
    worker.onmessage = (event: MessageEvent<MagicSelectionResult>) => {
      if (event.data.requestId !== latestRequestRef.current) return
      if (event.data.error) {
        setState((value) => ({ ...value, status: "error", errorMessage: event.data.error ?? "Selection gagal diproses" }))
        return
      }
      setState((value) => {
        const point = event.data.seed && value.workingWidth && value.workingHeight
          ? { x: event.data.seed.x / value.workingWidth, y: event.data.seed.y / value.workingHeight }
          : value.lastPoint
        if (event.data.seed && point) replayRef.current = { point, mode: "replace" }
        return { ...value, status: event.data.selectedPixelCount ? "ready" : "idle", mask: event.data.selectedPixelCount ? event.data.mask : null, bounds: event.data.bounds, selectedPixelCount: event.data.selectedPixelCount, lastPoint: point, errorMessage: null }
      })
    }
    worker.onerror = () => setState((value) => ({ ...value, status: "error", errorMessage: "Magic Select worker gagal dijalankan." }))
    workerRef.current = worker
    return worker
  }

  const prepareImage = async () => {
    if (imageRef.current) return imageRef.current
    if (!template) throw new Error("Upload template terlebih dahulu.")
    const record = await getAsset(template.id)
    if (!record) throw new Error("Template tidak ditemukan di perangkat.")
    const bitmap = await createImageBitmap(record.blob, { imageOrientation: "from-image" })
    const scale = Math.min(1, MAGIC_SELECTION_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(width, height) : Object.assign(document.createElement("canvas"), { width, height })
    const context = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
    if (!context) { bitmap.close(); throw new Error("Canvas tidak tersedia pada browser ini.") }
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    imageRef.current = context.getImageData(0, 0, width, height)
    setState((value) => ({ ...value, workingWidth: width, workingHeight: height }))
    return imageRef.current
  }

  const post = (request: MagicSelectionRequest) => {
    latestRequestRef.current = request.requestId
    setState((value) => ({ ...value, status: "processing", errorMessage: null }))
    const transfers: Transferable[] = []
    if (request.imageData) transfers.push(request.imageData.data.buffer)
    if (request.previousMask) transfers.push(request.previousMask.buffer)
    ensureWorker().postMessage(request, transfers)
  }

  const sendSelection = async (point: { x: number; y: number }, mode: MagicSelectionMode, baseMask: Uint8Array | undefined, tolerance: number) => {
    try {
      const image = await prepareImage()
      const startX = Math.min(image.width - 1, Math.max(0, Math.floor(point.x * image.width)))
      const startY = Math.min(image.height - 1, Math.max(0, Math.floor(point.y * image.height)))
      const imageCopy = new ImageData(new Uint8ClampedArray(image.data), image.width, image.height)
      post({ requestId: crypto.randomUUID(), operation: "select", imageData: imageCopy, width: image.width, height: image.height, startX, startY, tolerance, mode, previousMask: baseMask?.slice() })
    } catch (error) {
      setState((value) => ({ ...value, status: "error", errorMessage: error instanceof Error ? error.message : "Template gagal dibaca." }))
    }
  }

  const activate = async () => {
    setState((value) => ({ ...value, active: true, status: "idle", errorMessage: null }))
    try {
      const image = await prepareImage()
      if (template?.hasTransparency) {
        const imageCopy = new ImageData(new Uint8ClampedArray(image.data), image.width, image.height)
        post({ requestId: crypto.randomUUID(), operation: "auto-transparent", imageData: imageCopy, width: image.width, height: image.height, tolerance: state.settings.tolerance, mode: "replace" })
      }
    } catch (error) { setState((value) => ({ ...value, status: "error", errorMessage: error instanceof Error ? error.message : "Template gagal dibaca." })) }
  }
  const deactivate = () => {
    clearTimeout(debounceRef.current)
    workerRef.current?.terminate(); workerRef.current = null; latestRequestRef.current = ""; replayRef.current = null; imageRef.current = null
    setState(initialState())
  }
  const select = (point: { x: number; y: number }, shortcutMode?: MagicSelectionMode) => {
    const mode = shortcutMode ?? state.mode
    const baseMask = mode === "replace" ? undefined : state.mask?.slice()
    replayRef.current = { point, mode, baseMask }
    setState((value) => ({ ...value, lastPoint: point, mode }))
    void sendSelection(point, mode, baseMask, state.settings.tolerance)
  }
  const setMode = (mode: MagicSelectionMode) => setState((value) => ({ ...value, mode }))
  const setTolerance = (tolerance: number) => {
    setState((value) => ({ ...value, settings: { ...value.settings, tolerance } }))
    clearTimeout(debounceRef.current)
    const replay = replayRef.current
    if (replay) debounceRef.current = setTimeout(() => void sendSelection(replay.point, replay.mode, replay.baseMask, tolerance), 150)
  }
  const setFeather = (feather: number) => setState((value) => ({ ...value, settings: { ...value.settings, feather } }))
  const operation = (kind: "invert" | "expand" | "contract", amount = 1) => {
    if (!state.mask || !state.workingWidth || !state.workingHeight) return
    post({ requestId: crypto.randomUUID(), operation: kind, width: state.workingWidth, height: state.workingHeight, tolerance: state.settings.tolerance, mode: state.mode, previousMask: state.mask.slice(), amount })
    if (kind !== "invert") setState((value) => ({ ...value, settings: { ...value.settings, expansion: Math.max(-20, Math.min(20, value.settings.expansion + (kind === "expand" ? amount : -amount))) } }))
  }
  const reset = () => { replayRef.current = null; setState((value) => ({ ...value, status: "idle", mask: null, bounds: null, selectedPixelCount: 0, lastPoint: null, errorMessage: null })) }
  const cancel = () => { workerRef.current?.terminate(); workerRef.current = null; latestRequestRef.current = ""; setState((value) => ({ ...value, status: "idle" })) }

  useEffect(() => () => { clearTimeout(debounceRef.current); workerRef.current?.terminate(); imageRef.current = null }, [template?.id])
  return { state, activate, deactivate, select, setMode, setTolerance, setFeather, invert: () => operation("invert"), expand: () => operation("expand"), contract: () => operation("contract"), reset, cancel }
}
