/// <reference lib="webworker" />
import { contractSelection, countSelection, expandSelection, floodFillSelection, invertSelection, mergeSelection, selectionBounds } from "../features/frame-editor/magic-selection.lib"
import type { MagicSelectionRequest, MagicSelectionResult } from "../features/frame-editor/magic-selection.types"

self.onmessage = (event: MessageEvent<MagicSelectionRequest>) => {
  const request = event.data
  try {
    let mask: Uint8Array
    if (request.operation === "select") {
      if (!request.imageData || request.startX === undefined || request.startY === undefined) throw new Error("Data selection tidak lengkap")
      const incoming = floodFillSelection(request.imageData.data, request.width, request.height, request.startX, request.startY, request.tolerance)
      mask = mergeSelection(request.previousMask, incoming, request.mode)
    } else {
      if (!request.previousMask) throw new Error("Belum ada selection")
      if (request.operation === "invert") mask = invertSelection(request.previousMask)
      else if (request.operation === "expand") mask = expandSelection(request.previousMask, request.width, request.height, request.amount)
      else mask = contractSelection(request.previousMask, request.width, request.height, request.amount)
    }
    const result: MagicSelectionResult = { requestId: request.requestId, mask, bounds: selectionBounds(mask, request.width, request.height), selectedPixelCount: countSelection(mask) }
    self.postMessage(result, { transfer: [mask.buffer] })
  } catch (error) {
    const result: MagicSelectionResult = { requestId: request.requestId, mask: new Uint8Array(), bounds: null, selectedPixelCount: 0, error: error instanceof Error ? error.message : "Selection gagal diproses" }
    self.postMessage(result)
  }
}
