import { useRef, type PointerEvent as ReactPointerEvent } from "react"
import { Minus, Plus, RotateCcw } from "lucide-react"
import { defaultFrame, resizeFrame, type ResizeHandle } from "../../lib/image"
import type { PhotoFrame, TwibbonProject } from "../../types/project"
import { MagicSelectionOverlay } from "../../features/frame-editor/MagicSelectionOverlay"
import type { MagicSelectionMode, MagicSelectionState } from "../../features/frame-editor/magic-selection.types"

interface FrameCanvasProps {
  templateUrl?: string
  template: NonNullable<TwibbonProject["template"]>
  frame: PhotoFrame
  onChange: (patch: Partial<PhotoFrame>) => void
  magicState: MagicSelectionState
  onMagicPick: (point: { x: number; y: number }, mode?: MagicSelectionMode) => void
}

export function FrameCanvas({ templateUrl, template, frame, onChange, magicState, onMagicPick }: FrameCanvasProps) {
  const interaction = useRef<
    | { mode: "move"; x: number; y: number; frameX: number; frameY: number; scale: number }
    | { mode: "resize"; x: number; y: number; frame: PhotoFrame; handle: ResizeHandle; scale: number }
    | undefined
  >(undefined)

  const canvasScale = (element: Element) =>
    ((element.closest(".checkerboard") as HTMLElement | null)?.clientWidth ?? template.width) / template.width

  const startMove = (event: ReactPointerEvent) => {
    if (magicState.active) return
    event.currentTarget.setPointerCapture(event.pointerId)
    interaction.current = {
      mode: "move",
      x: event.clientX,
      y: event.clientY,
      frameX: frame.x,
      frameY: frame.y,
      scale: canvasScale(event.currentTarget),
    }
  }

  const move = (event: ReactPointerEvent) => {
    const active = interaction.current
    if (!active || active.mode !== "move") return
    onChange({
      x: active.frameX + (event.clientX - active.x) / active.scale,
      y: active.frameY + (event.clientY - active.y) / active.scale,
    })
  }

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>, handle: ResizeHandle) => {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    interaction.current = {
      mode: "resize",
      x: event.clientX,
      y: event.clientY,
      frame: { ...frame },
      handle,
      scale: canvasScale(event.currentTarget),
    }
  }

  const resize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const active = interaction.current
    if (!active || active.mode !== "resize") return
    event.stopPropagation()
    const screenX = (event.clientX - active.x) / active.scale
    const screenY = (event.clientY - active.y) / active.scale
    const radians = active.frame.rotation * Math.PI / 180
    const localX = screenX * Math.cos(radians) + screenY * Math.sin(radians)
    const localY = -screenX * Math.sin(radians) + screenY * Math.cos(radians)
    onChange(resizeFrame(active.frame, active.handle, localX, localY))
  }

  const handles: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"]

  return (
    <div className="canvas-side">
      <div
        className={`checkerboard ${magicState.active ? "color-picking" : ""}`}
        style={{ aspectRatio: `${template.width}/${template.height}` }}
        onPointerDown={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect()
          const point = { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height }
          if (magicState.active) {
            onMagicPick(point, event.altKey ? "subtract" : event.shiftKey ? "add" : undefined)
            return
          }
        }}
      >
        {templateUrl && <img src={templateUrl} alt="Template pada kanvas" />}
        {magicState.active && <MagicSelectionOverlay state={magicState} />}
        {!magicState.active && <div
          className={`frame-box ${frame.shape}`}
          tabIndex={0}
          aria-label="Area foto, gunakan tombol panah untuk menggeser"
          onKeyDown={(event) => {
            const amount = event.shiftKey ? 10 : 1
            if (event.key === "ArrowLeft") onChange({ x: frame.x - amount })
            if (event.key === "ArrowRight") onChange({ x: frame.x + amount })
            if (event.key === "ArrowUp") onChange({ y: frame.y - amount })
            if (event.key === "ArrowDown") onChange({ y: frame.y + amount })
          }}
          onPointerDown={startMove}
          onPointerMove={move}
          onPointerUp={() => { interaction.current = undefined }}
          style={{
            left: `${frame.x / template.width * 100}%`,
            top: `${frame.y / template.height * 100}%`,
            width: `${frame.width / template.width * 100}%`,
            height: `${frame.height / template.height * 100}%`,
            borderRadius: frame.shape === "circle" ? "50%" : frame.shape === "rounded" ? `${frame.borderRadius / frame.width * 100}%` : 0,
            transform: `rotate(${frame.rotation}deg)`,
          }}
        >
          {handles.map((handle) => (
            <button
              key={handle}
              type="button"
              className={`resize-handle ${handle}`}
              aria-label={`Ubah ukuran dari ${handle}`}
              onPointerDown={(event) => startResize(event, handle)}
              onPointerMove={resize}
              onPointerUp={(event) => { event.stopPropagation(); interaction.current = undefined }}
            />
          ))}
        </div>}
      </div>
      <div className="canvas-toolbar">
        <Minus /> 100% <Plus />
        <span />Sesuaikan
        <button onClick={() => onChange(defaultFrame(template.width, template.height))}>
          <RotateCcw /> Reset
        </button>
      </div>
    </div>
  )
}
