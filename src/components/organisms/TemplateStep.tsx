import { useState } from "react"
import { CheckCircle2, Trash2, UploadCloud, WandSparkles } from "lucide-react"
import { toast } from "sonner"
import { saveAsset, saveProject } from "../../db/database"
import { detectTransparency, readImage, validateImageFile } from "../../lib/image"
import { useProjectStore } from "../../stores/project.store"
import { Dropzone } from "../molecules/Dropzone"
import { useAssetUrl } from "../../hooks/useAssetUrl"
import type { ImageMime } from "../../types/project"

export function TemplateStep() {
  const { project, update } = useProjectStore()
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState<string>()
  useAssetUrl(project.template?.id, setUrl)

  const upload = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    const error = validateImageFile(file)
    if (error) return toast.error(error)
    if (project.frame && !confirm("Mengganti template akan mengatur ulang area foto. Lanjutkan?")) return
    setBusy(true)
    try {
      const bitmap = await readImage(file)
      const hasTransparency = await detectTransparency(file)
      const template = {
        id: crypto.randomUUID(),
        fileName: file.name,
        mimeType: file.type as ImageMime,
        width: bitmap.width,
        height: bitmap.height,
        size: file.size,
        hasTransparency,
        renderMode: hasTransparency ? "transparent-overlay" as const : "photo-on-top" as const,
      }
      bitmap.close()
      await saveAsset({ id: template.id, projectId: project.id, type: "template", blob: file })
      const next = {
        ...project,
        template,
        frame: null,
        photos: [],
        exportSettings: { ...project.exportSettings, width: template.width, height: template.height },
        updatedAt: Date.now(),
      }
      update(() => next)
      await saveProject(next)
      if (!hasTransparency) toast.warning("Template tidak memiliki area transparan. Gunakan fitur Magic Select untuk menentukan area foto secara manual.")
    } catch {
      toast.error("Template gagal diproses. Coba gunakan file lain.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="step-panel narrow">
      <div className="step-heading">
        <span>LANGKAH 1 DARI 5</span>
        <h1>Upload template twibbon</h1>
        <p>Gunakan template PNG transparan untuk hasil terbaik.</p>
      </div>

      {project.template && url ? (
        <div className="template-card">
          <img src={url} alt="Preview template" />
          <div className="template-card-info">
            <strong>{project.template.fileName}</strong>
            <span>{project.template.width} × {project.template.height} px · {(project.template.size / 1048576).toFixed(1)} MB</span>
            <span className={project.template.hasTransparency ? "status ready" : "status warning"}>
              {project.template.hasTransparency ? "Transparansi terdeteksi" : "Tanpa transparansi"}
            </span>
          </div>
          <div className="template-card-actions">
            <Dropzone onFiles={upload}>
              <button className="button secondary">Ganti</button>
            </Dropzone>
            <button className="icon-button danger" aria-label="Hapus template" onClick={() => update((value) => ({ ...value, template: null, frame: null, photos: [] }))}>
              <Trash2 />
            </button>
          </div>
        </div>
      ) : (
        <Dropzone onFiles={upload}>
          <span className="upload-icon"><UploadCloud /></span>
          <h2>{busy ? "Memeriksa template..." : "Tarik dan lepas file di sini"}</h2>
          <p>atau pilih file dari perangkatmu</p>
          <span className="button">Pilih Template</span>
          <small>PNG, JPG, atau WebP · Maksimal 20 MB</small>
        </Dropzone>
      )}

      <div className="upload-tips">
        <p><CheckCircle2 /><span><strong>Gunakan file transparan</strong>Pastikan area wajah pada template sudah dihapus.</span></p>
        <p><WandSparkles /><span><strong>Gunakan Magic Select</strong>Template tanpa transparansi bisa diatur area fotonya di langkah selanjutnya.</span></p>
        <p><CheckCircle2 /><span><strong>Resolusi optimal</strong>Disarankan resolusi minimal 1080 × 1080 px.</span></p>
      </div>

    </section>
  )
}
