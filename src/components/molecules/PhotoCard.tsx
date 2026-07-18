import { useState } from "react"
import { CheckCircle2, Info, Trash2 } from "lucide-react"
import { useAssetUrl } from "../../hooks/useAssetUrl"
import type { PhotoItem } from "../../types/project"

interface PhotoCardProps {
  photo: PhotoItem
  onDelete: () => void
}

export function PhotoCard({ photo, onDelete }: PhotoCardProps) {
  const [url, setUrl] = useState<string>()
  useAssetUrl(photo.id, setUrl)
  return (
    <article className="photo-card">
      {url && <img src={url} alt="" />}
      <span className={`status ${photo.status}`}>
        {photo.status === "ready" ? <><CheckCircle2 /> Siap</> : <><Info /> Perlu diperiksa</>}
      </span>
      <div>
        <strong title={photo.fileName}>{photo.fileName}</strong>
        <small>{photo.width} × {photo.height}</small>
      </div>
      <button className="icon-button" aria-label={`Hapus ${photo.fileName}`} onClick={onDelete}>
        <Trash2 />
      </button>
    </article>
  )
}
