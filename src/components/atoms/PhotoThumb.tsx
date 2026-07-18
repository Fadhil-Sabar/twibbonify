import { useState } from "react"
import { useAssetUrl } from "../../hooks/useAssetUrl"

export function PhotoThumb({ id }: { id: string }) {
  const [url, setUrl] = useState<string>()
  useAssetUrl(id, setUrl)
  return url ? <img src={url} alt="Pratinjau foto" loading="lazy" decoding="async" /> : null
}
