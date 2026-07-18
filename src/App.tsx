import { useEffect, useState } from "react"
import { Toaster } from "sonner"
import { route } from "./constants/steps"
import { LandingPage } from "./components/pages/LandingPage"
import { EditorPage } from "./components/pages/EditorPage"

export default function App() {
  const [page, setPage] = useState(route)
  useEffect(() => {
    const update = () => setPage(route())
    addEventListener("popstate", update)
    return () => removeEventListener("popstate", update)
  }, [])
  return <><Toaster position="top-center" richColors/>{page === "editor" ? <EditorPage /> : <LandingPage />}</>
}
