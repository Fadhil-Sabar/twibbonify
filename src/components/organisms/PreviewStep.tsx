import { useState } from "react"
import { ArrowLeft, ArrowRight, Check, RotateCcw, RotateCw, Sparkles, ZoomIn } from "lucide-react"
import { defaultTransform } from "../../lib/image"
import { useProjectStore } from "../../stores/project.store"
import { PhotoThumb } from "../atoms/PhotoThumb"
import { CompositionCanvas } from "../molecules/CompositionCanvas"
import type { PhotoTransform } from "../../types/project"

export function PreviewStep() {
  const { project, update } = useProjectStore()
  const [active, setActive] = useState(0)
  const photo = project.photos[active]

  if (!photo || !project.template || !project.frame) return null

  const transform = (patch: Partial<PhotoTransform>) =>
    update((value) => ({
      ...value,
      photos: value.photos.map((item, index) =>
        index === active ? { ...item, transform: { ...item.transform, ...patch } } : item
      ),
    }))

  const reset = () => transform(defaultTransform(photo.width, photo.height, project.frame!, photo.transform.fitMode))

  const applyAll = () => {
    if (!confirm("Terapkan ukuran dan rotasi foto ini ke semua foto?")) return
    update((value) => ({
      ...value,
      photos: value.photos.map((item) => ({
        ...item,
        transform: { ...item.transform, scale: photo.transform.scale, rotation: photo.transform.rotation },
      })),
    }))
  }

  return (
    <section>
      <div className="step-heading">
        <span>LANGKAH 4 DARI 5</span>
        <h1>Atur & Preview</h1>
        <p>Geser, perbesar, atau putar setiap foto sampai pas.</p>
      </div>

      <div className="preview-layout">
        <div>
          <CompositionCanvas project={project} photo={photo} onTransform={transform} />
          <div className="transform-controls">
            <label>
              <span><ZoomIn /> Ukuran foto</span>
              <b>{Math.round(photo.transform.scale * 100)}%</b>
              <input
                type="range"
                min={.05}
                max={Math.max(3, photo.transform.scale * 2)}
                step={.01}
                value={photo.transform.scale}
                onChange={(event) => transform({ scale: Number(event.target.value) })}
              />
            </label>
            <div>
              <button onClick={() => transform({ rotation: photo.transform.rotation - 90 })}>
                <RotateCcw /> Putar kiri
              </button>
              <button onClick={() => transform({ rotation: photo.transform.rotation + 90 })}>
                <RotateCw /> Putar kanan
              </button>
              <button onClick={reset}><RotateCcw /> Atur ulang</button>
            </div>
            <button className="text-button" onClick={applyAll}>
              <Sparkles /> Terapkan ukuran ke semua foto
            </button>
          </div>
        </div>

        <aside className="preview-list">
          <div>
            <h2>Hasil Preview</h2>
            <span>{project.photos.filter((item) => item.status !== "error").length} dari {project.photos.length} foto siap</span>
          </div>
          <div className="preview-thumbs">
            {project.photos.map((item, index) => (
              <button className={index === active ? "active" : ""} key={item.id} onClick={() => setActive(index)}>
                <PhotoThumb id={item.id} />
                <Check />
              </button>
            ))}
          </div>
          <div className="photo-nav">
            <button disabled={active === 0} onClick={() => setActive(active - 1)}>
              <ArrowLeft /> Sebelumnya
            </button>
            <span>{active + 1} / {project.photos.length}</span>
            <button disabled={active === project.photos.length - 1} onClick={() => setActive(active + 1)}>
              Berikutnya <ArrowRight />
            </button>
          </div>
        </aside>
      </div>

    </section>
  )
}
