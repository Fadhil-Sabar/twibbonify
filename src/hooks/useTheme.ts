import { useCallback, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "twibbonify-theme"

function resolveTheme(preference: Theme): "light" | "dark" {
  if (preference === "system") {
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return preference
}

function applyTheme(resolved: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", resolved)
}

export function useTheme() {
  const [preference, setPreference] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system"
  })

  useEffect(() => {
    const resolved = resolveTheme(preference)
    applyTheme(resolved)
  }, [preference])

  useEffect(() => {
    if (preference !== "system") return
    const mq = matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme(mq.matches ? "dark" : "light")
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [preference])

  const setTheme = useCallback((next: Theme) => {
    setPreference(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const toggle = useCallback(() => {
    const resolved = resolveTheme(preference)
    setTheme(resolved === "dark" ? "light" : "dark")
  }, [preference, setTheme])

  const resolved = resolveTheme(preference)
  return { preference, resolved, setTheme, toggle }
}
