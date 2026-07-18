import { useEffect, useRef, useState } from "react"
import { getAsset } from "../../db/database"
import { drawComposition } from "../../lib/render"
import { readImage } from "../../lib/image"
import type { PhotoItem, PhotoTransform, TwibbonProject } from "../../types/project"

interface CompositionCanvasProps {
  project: TwibbonProject
  photo: PhotoItem
  onTransform: (patch: Partial<PhotoTransform>) => void
}

export function CompositionCanvas({ project, photo, onTransform }: CompositionCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number; px: number; py: number } | undefined>(undefined)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!project.template || !project.frame || !canvas.current) return
    let stopped = false
    Promise.all([getAsset(project.template.id), getAsset(photo.id), project.frame.maskAssetId ? getAsset(project.frame.maskAssetId) : Promise.resolve(undefined)]).then(async ([templateRecord, photoRecord, maskRecord]) => {
      if (!templateRecord || !photoRecord || stopped || !canvas.current) return
      const [template, image, mask] = await Promise.all([readImage(templateRecord.blob), readImage(photoRecord.blob), maskRecord ? readImage(maskRecord.blob) : Promise.resolve(undefined)])
      if (stopped) { template.close(); image.close(); mask?.close(); return }
      const context = canvas.current.getContext("2d")
      if (context) drawComposition(context, template, image, project.template!, { width: photo.width, height: photo.height }, project.frame!, photo.transform, mask)
      template.close()
      image.close()
      mask?.close()
      setVersion((value) => value + 1)
    })
    return () => { stopped = true }
  }, [project.template, project.frame, photo.id, photo.width, photo.height, photo.transform])

  if (!project.template) return null
  return (
    <div className="composition">
      <canvas
        ref={canvas}
        width={project.template.width}
        height={project.template.height}
        data-render={version}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = { x: event.clientX, y: event.clientY, px: photo.transform.x, py: photo.transform.y }
        }}
        onPointerMove={(event) => {
          if (drag.current) {
            const displayScale = event.currentTarget.clientWidth / project.template!.width
            onTransform({
              x: drag.current.px + (event.clientX - drag.current.x) / displayScale,
              y: drag.current.py + (event.clientY - drag.current.y) / displayScale,
            })
          }
        }}
        onPointerUp={() => { drag.current = undefined }}
      />
    </div>
  )
}
