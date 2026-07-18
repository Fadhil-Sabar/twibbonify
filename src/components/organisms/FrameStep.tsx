import { useEffect, useState } from "react"
import { WandSparkles } from "lucide-react"
import { toast } from "sonner"
import { saveAsset } from "../../db/database"
import { defaultFrame, defaultTransform } from "../../lib/image"
import { useProjectStore } from "../../stores/project.store"
import { NumberField } from "../atoms/NumberField"
import { FrameCanvas } from "../molecules/FrameCanvas"
import { useAssetUrl } from "../../hooks/useAssetUrl"
import type { PhotoFrame } from "../../types/project"
import { useMagicSelection } from "../../features/frame-editor/useMagicSelection"
import { MagicSelectToolbar } from "../../features/frame-editor/MagicSelectToolbar"
import { scaleSelectionBounds, selectionMaskToBlob, validateSelection } from "../../features/frame-editor/magic-selection.lib"

export function FrameStep({ onNext }: { onNext: () => void }) {
  const { project, setFrame, update } = useProjectStore()
  const [url, setUrl] = useState<string>()
  const frame = project.frame ?? (project.template ? defaultFrame(project.template.width, project.template.height) : null)
  const magic = useMagicSelection(project.template)

  useEffect(() => { if (!project.frame && frame) setFrame(frame) }, [frame, project.frame, setFrame])
  useAssetUrl(project.template?.id, setUrl)

  if (!project.template || !frame) return null

  const change = (patch: Partial<PhotoFrame>) => {
    const next = { ...frame, ...patch }
    next.width = Math.max(20, next.width)
    next.height = Math.max(20, next.height)
    next.x = Math.max(-next.width * .75, Math.min(project.template!.width - next.width * .25, next.x))
    next.y = Math.max(-next.height * .75, Math.min(project.template!.height - next.height * .25, next.y))
    setFrame(next)
  }

  const useMagicSelectionAsFrame = async () => {
    const { bounds, selectedPixelCount, workingWidth, workingHeight } = magic.state
    const validation = validateSelection(bounds, selectedPixelCount, workingWidth, workingHeight, project.template!.width, project.template!.height)
    if (!validation.valid || !bounds) { toast.error(validation.error); return }
    if (validation.warning) toast.warning(validation.warning)
    if (!magic.state.mask) return
    const maskAssetId = crypto.randomUUID()
    const maskBlob = await selectionMaskToBlob(magic.state.mask, workingWidth, workingHeight, magic.state.settings.feather)
    await saveAsset({ id: maskAssetId, projectId: project.id, type: "mask", blob: maskBlob })
    const scaled = scaleSelectionBounds(bounds, workingWidth, workingHeight, project.template!.width, project.template!.height)
    const detected: PhotoFrame = { ...scaled, rotation: 0, shape: "custom", borderRadius: 0, maskAssetId, maskWidth: workingWidth, maskHeight: workingHeight, maskSourceBounds: scaled }
    update((value) => ({ ...value, frame: detected, photos: value.photos.map((photo) => ({ ...photo, transform: defaultTransform(photo.width, photo.height, detected, photo.transform.fitMode) })) }))
    toast.success("Selection digunakan sebagai area foto.")
    onNext()
  }

  return (
    <section>
      <div className="step-heading">
        <span>LANGKAH 2 DARI 5</span>
        <h1>Tentukan area foto</h1>
        <p>Atur bagian template yang akan diisi dengan foto peserta.</p>
      </div>
      <div className="frame-layout">
        <FrameCanvas
          templateUrl={url}
          template={project.template}
          frame={frame}
          onChange={change}
          magicState={magic.state}
          onMagicPick={magic.select}
        />
        <div className="settings">
          <h2>Pengaturan Frame</h2>
          <label>Bentuk Frame</label>
          <div className="segmented shapes">
            {(["rectangle", "circle", "rounded"] as const).map((shape) => (
              <button className={frame.shape === shape ? "selected" : ""} key={shape} onClick={() => change({ shape })}>
                {shape === "rectangle" ? "Persegi" : shape === "circle" ? "Lingkaran" : "Rounded"}
              </button>
            ))}
          </div>
          <div className="field-grid">
            <NumberField label="Lebar (px)" value={frame.width} onChange={(width) => change({ width })} />
            <NumberField label="Tinggi (px)" value={frame.height} onChange={(height) => change({ height })} />
            <NumberField label="Posisi X" value={frame.x} onChange={(x) => change({ x })} />
            <NumberField label="Posisi Y" value={frame.y} onChange={(y) => change({ y })} />
            <NumberField label="Rotasi" value={frame.rotation} onChange={(rotation) => change({ rotation })} />
            <NumberField label="Radius" value={frame.borderRadius} onChange={(borderRadius) => change({ borderRadius })} />
          </div>
          <button className={`button full magic-trigger ${magic.state.active ? "picker-active" : "secondary"}`} aria-pressed={magic.state.active} onClick={() => { if (magic.state.active) magic.deactivate(); else void magic.activate() }}>
            <WandSparkles /> {magic.state.active ? "Tutup Magic Select" : "Magic Select"}
          </button>
          {magic.state.active && <MagicSelectToolbar state={magic.state} onMode={magic.setMode} onTolerance={magic.setTolerance} onFeather={magic.setFeather} onInvert={magic.invert} onExpand={magic.expand} onContract={magic.contract} onReset={magic.reset} onCancel={magic.cancel} onUse={useMagicSelectionAsFrame} onClose={magic.deactivate} />}
        </div>
      </div>
    </section>
  )
}
