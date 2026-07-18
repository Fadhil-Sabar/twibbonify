import { useEffect } from "react"
import { getAsset } from "../db/database"

export function useAssetUrl(id: string | undefined, setUrl: (url: string | undefined) => void) {
  useEffect(() => {
    if (!id) return
    let objectUrl = ""
    getAsset(id).then((record) => {
      if (record) {
        objectUrl = URL.createObjectURL(record.blob)
        setUrl(objectUrl)
      }
    })
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id, setUrl])
}
