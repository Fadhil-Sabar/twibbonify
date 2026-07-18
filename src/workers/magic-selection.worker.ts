/// <reference lib="webworker" />
import { contractSelection, countSelection, expandSelection, findLargestTransparentSeed, floodFillSelection, invertSelection, mergeSelection, selectionBounds } from "../features/frame-editor/magic-selection.lib"
import type { MagicSelectionRequest, MagicSelectionResult } from "../features/frame-editor/magic-selection.types"

self.onmessage = (event: MessageEvent<MagicSelectionRequest>) => {
  const request = event.data
  try {
    let mask: Uint8Array
    let seed: { x: number; y: number } | undefined
    if (request.operation === "select") {
      if (!request.imageData || request.startX === undefined || request.startY === undefined) throw new Error("Data selection tidak lengkap")
      const incoming = floodFillSelection(request.imageData.data, request.width, request.height, request.startX, request.startY, request.tolerance)
      mask = mergeSelection(request.previousMask, incoming, request.mode)
    } else if (request.operation === "auto-transparent") {
      if (!request.imageData) throw new Error("Data template tidak lengkap")
      seed = findLargestTransparentSeed(request.imageData.data, request.width, request.height) ?? undefined
      mask = seed ? floodFillSelection(request.imageData.data, request.width, request.height, seed.x, seed.y, request.tolerance) : new Uint8Array(request.width * request.height)
    } else {
      if (!request.previousMask) throw new Error("Belum ada selection")
      if (request.operation === "invert") mask = invertSelection(request.previousMask)
      else if (request.operation === "expand") mask = expandSelection(request.previousMask, request.width, request.height, request.amount)
      else mask = contractSelection(request.previousMask, request.width, request.height, request.amount)
    }
    const result: MagicSelectionResult = { requestId: request.requestId, mask, bounds: selectionBounds(mask, request.width, request.height), selectedPixelCount: countSelection(mask), seed }
    self.postMessage(result, { transfer: [mask.buffer] })
  } catch (error) {
    const result: MagicSelectionResult = { requestId: request.requestId, mask: new Uint8Array(), bounds: null, selectedPixelCount: 0, error: error instanceof Error ? error.message : "Selection gagal diproses" }
    self.postMessage(result)
  }
}
