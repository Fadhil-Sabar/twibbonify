import { useRef, useState } from "react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { exportProject, downloadBlob } from "../../lib/export"
import { useProjectStore } from "../../stores/project.store"
import { NumberField } from "../atoms/NumberField"

export function ExportStep() {
  const { project, update } = useProjectStore()
  const [state, setState] = useState<{ status: "idle" | "processing" | "done" | "cancelled" | "error"; completed: number; current: string }>({
    status: "idle", completed: 0, current: "",
  })
  const controller = useRef<AbortController | undefined>(undefined)

  const run = async () => {
    controller.current = new AbortController()
    setState({ status: "processing", completed: 0, current: "Menyiapkan template" })
    try {
      const blob = await exportProject(
        project,
        (completed, current) => setState({ status: "processing", completed, current }),
        controller.current.signal
      )
      setState({ status: "done", completed: project.photos.length, current: "Semua hasil siap" })
      downloadBlob(blob, `twibbonify-${new Date().toISOString().slice(0, 10)}.zip`)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError")
        setState((value) => ({ ...value, status: "cancelled", current: "Ekspor dibatalkan" }))
      else {
        setState((value) => ({ ...value, status: "error", current: "Ekspor gagal" }))
        toast.error(error instanceof Error ? error.message : "Export gagal")
      }
    }
  }

  const percent = project.photos.length ? Math.round(state.completed / project.photos.length * 100) : 0

  return (
    <section>
      <div className="step-heading">
        <span>LANGKAH 5 DARI 5</span>
        <h1>Unduh hasil</h1>
        <p>Pilih format, lalu unduh seluruh twibbon dalam satu ZIP.</p>
      </div>

      <div className="export-layout">
        <div className="settings export-settings">
          <h2>Pengaturan Ekspor</h2>
          <label>Format file</label>
          <div className="segmented">
            {(["png", "jpeg", "webp"] as const).map((format) => (
              <button
                key={format}
                className={project.exportSettings.format === format ? "selected" : ""}
                onClick={() => update((value) => ({ ...value, exportSettings: { ...value.exportSettings, format } }))}
              >
                {format === "jpeg" ? "JPG" : format.toUpperCase()}
              </button>
            ))}
          </div>
          {project.exportSettings.format !== "png" && (
            <label className="range">
              <span>Kualitas <b>{Math.round(project.exportSettings.quality * 100)}%</b></span>
              <input
                type="range"
                min={.5}
                max={1}
                step={.01}
                value={project.exportSettings.quality}
                onChange={(event) => update((value) => ({ ...value, exportSettings: { ...value.exportSettings, quality: Number(event.target.value) } }))}
              />
            </label>
          )}
          <div className="field-grid">
            <NumberField label="Lebar" value={project.exportSettings.width} onChange={(width) => update((value) => ({ ...value, exportSettings: { ...value.exportSettings, width } }))} />
            <NumberField label="Tinggi" value={project.exportSettings.height} onChange={(height) => update((value) => ({ ...value, exportSettings: { ...value.exportSettings, height } }))} />
          </div>
        </div>

        <div className="export-summary">
          <div>
            <span>STATUS EKSPOR</span>
            <h2>{state.status === "processing" ? "Memproses twibbon" : state.status === "done" ? "Semua hasil siap!" : "Siap membuat twibbon"}</h2>
            <p>{project.photos.length} foto · {project.exportSettings.width} × {project.exportSettings.height} px</p>
          </div>
          <b>{percent}%</b>
          <div className="progress" role="progressbar" aria-valuenow={percent}>
            <i style={{ width: `${percent}%` }} />
          </div>
          <small>{state.current || "Semua proses akan berjalan di perangkat ini."}</small>
          <button className="button full" disabled={state.status === "processing"} onClick={run}>
            <Sparkles /> Ekspor Semua
          </button>
          {state.status === "processing" && (
            <button className="text-button danger" onClick={() => controller.current?.abort()}>Batalkan</button>
          )}
        </div>
      </div>
    </section>
  )
}
