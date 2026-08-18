import { useState } from "react"
import { Download, ImagePlus, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { saveAsset } from "../../db/database"
import { defaultTransform, readImage, validateImageFile } from "../../lib/image"
import { downloadBlob, exportTemplateCutout, getCutoutFilename } from "../../lib/export"
import { useProjectStore } from "../../stores/project.store"
import { Dropzone } from "../molecules/Dropzone"
import { PhotoCard } from "../molecules/PhotoCard"
import type { ImageMime, PhotoItem } from "../../types/project"

export function PhotosStep() {
  const { project, addPhotos, removePhoto, update } = useProjectStore()
  const [busy, setBusy] = useState(false)
  const [cutoutBusy, setCutoutBusy] = useState(false)

  const downloadCutout = async () => {
    if (!project.template || !project.frame) {
      toast.error("Template atau bingkai belum ditentukan.")
      return
    }
    setCutoutBusy(true)
    try {
      const blob = await exportTemplateCutout(project)
      const filename = getCutoutFilename(project)
      downloadBlob(blob, filename)
      toast.success("Cutout bingkai transparan berhasil diunduh.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengunduh cutout frame.")
    } finally {
      setCutoutBusy(false)
    }
  }

  const upload = async (files: File[]) => {
    if (!project.frame) return
    const available = 100 - project.photos.length
    if (files.length > available) toast.error(`Maksimal 100 foto. Hanya ${available} slot tersisa.`)
    setBusy(true)
    const added: PhotoItem[] = []
    for (const file of files.slice(0, available)) {
      const error = validateImageFile(file)
      if (error) { toast.error(`${file.name}: ${error}`); continue }
      try {
        const bitmap = await readImage(file)
        const id = crypto.randomUUID()
        const transform = defaultTransform(bitmap.width, bitmap.height, project.frame)
        const low = bitmap.width * transform.scale < project.frame.width || bitmap.height * transform.scale < project.frame.height
        const item: PhotoItem = {
          id,
          fileName: file.name,
          mimeType: file.type as ImageMime,
          width: bitmap.width,
          height: bitmap.height,
          size: file.size,
          transform,
          status: low ? "warning" : "ready",
          warning: low ? "low-resolution" : undefined,
          createdAt: Date.now(),
        }
        bitmap.close()
        await saveAsset({ id, projectId: project.id, type: "photo", photoId: id, blob: file })
        added.push(item)
        addPhotos([item])
        await new Promise((resolve) => setTimeout(resolve, 0))
      } catch {
        toast.error(`${file.name}: Foto gagal diproses.`)
      }
    }
    setBusy(false)
  }

  return (
    <section>
      <div className="step-heading">
        <span>LANGKAH 3 DARI 5</span>
        <h1>Tambahkan foto peserta</h1>
        <p>Unggah beberapa foto sekaligus untuk diproses secara massal.</p>
      </div>

      {project.photos.length === 0 && (
        <>
          <Dropzone multiple onFiles={upload}>
            <span className="upload-icon"><ImagePlus /></span>
            <h2>{busy ? "Memproses foto..." : "Seret & lepas semua foto"}</h2>
            <p>atau ketuk untuk memilih dari galeri</p>
            <div className="chips">
              <span>JPG</span><span>PNG</span><span>WebP</span><span>Maks. 20 MB</span>
            </div>
          </Dropzone>

          <div className="cutout-banner">
            <div>
              <strong>Butuh file template transparan saja?</strong>
              <p>Unduh cutout bingkai PNG transparan dengan area foto yang sudah berlubang untuk diedit di Canva atau aplikasi lain.</p>
            </div>
            <button
              type="button"
              className="button secondary compact"
              onClick={downloadCutout}
              disabled={cutoutBusy || !project.template || !project.frame}
              aria-busy={cutoutBusy}
              aria-label="Unduh bingkai cutout PNG transparan"
            >
              {cutoutBusy ? <span className="spinner" /> : <Download />}
              {cutoutBusy ? "Memproses..." : "Unduh Cutout PNG"}
            </button>
          </div>
        </>
      )}

      <div className="photo-toolbar">
        <strong>{project.photos.length} foto terpilih</strong>
        <Dropzone multiple onFiles={upload}>
          <button className="text-button"><Plus /> Tambah Foto</button>
        </Dropzone>
        <button className="text-button danger" disabled={!project.photos.length} onClick={() => {
          if (confirm("Hapus semua foto dari project ini?")) update((value) => ({ ...value, photos: [] }))
        }}>
          <Trash2 /> Hapus Semua
        </button>
      </div>

      {busy && <div className="processing"><span className="spinner" /> Memproses foto...</div>}

      <div className="photo-grid">
        {project.photos.map((photo) => (
          <PhotoCard photo={photo} key={photo.id} onDelete={() => removePhoto(photo.id)} />
        ))}
      </div>

    </section>
  )
}
