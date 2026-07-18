import { useEffect, useRef } from "react"
import type { MagicSelectionState } from "./magic-selection.types"

export function MagicSelectionOverlay({ state }: { state: MagicSelectionState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !state.mask || !state.workingWidth || !state.workingHeight) return
    canvas.width = state.workingWidth; canvas.height = state.workingHeight
    const context = canvas.getContext("2d")
    if (!context) return
    const image = context.createImageData(state.workingWidth, state.workingHeight)
    for (let index = 0; index < state.mask.length; index++) {
      if (!state.mask[index]) continue
      const offset = index * 4
      image.data[offset] = 122; image.data[offset + 1] = 139; image.data[offset + 2] = 101; image.data[offset + 3] = 71
    }
    context.putImageData(image, 0, 0)
  }, [state.mask, state.workingWidth, state.workingHeight])
  if (!state.mask) return null
  const bounds = state.bounds
  return <div className="magic-overlay" aria-hidden="true"><canvas ref={canvasRef} style={{ filter: state.settings.feather ? `blur(${state.settings.feather}px)` : undefined }}/>{bounds && <span className="magic-bounds" style={{ left: `${bounds.x / state.workingWidth * 100}%`, top: `${bounds.y / state.workingHeight * 100}%`, width: `${bounds.width / state.workingWidth * 100}%`, height: `${bounds.height / state.workingHeight * 100}%` }}/>}</div>
}
