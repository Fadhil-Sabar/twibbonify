import { create } from "zustand"
import { createProject, type PhotoFrame, type PhotoItem, type TwibbonProject } from "../types/project"
import { clearProject, db, saveProject } from "../db/database"
import { remapTransformToFrame } from "../lib/image"

type ProjectStore = {
  project: TwibbonProject
  hydrated: boolean
  autosave: "idle" | "saving" | "saved" | "error"
  setProject: (project: TwibbonProject) => void
  update: (recipe: (project: TwibbonProject) => TwibbonProject) => void
  addPhotos: (photos: PhotoItem[]) => void
  removePhoto: (id: string) => void
  setFrame: (frame: PhotoFrame) => void
  restore: () => Promise<boolean>
  reset: () => Promise<void>
}

let timer: ReturnType<typeof setTimeout> | undefined
export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createProject(), hydrated: false, autosave: "idle",
  setProject: (project) => set({ project, hydrated: true }),
  update: (recipe) => { const project = { ...recipe(get().project), updatedAt: Date.now() }; set({ project, autosave: "saving" }); clearTimeout(timer); timer = setTimeout(() => saveProject(project).then(() => set({ autosave: "saved" })).catch(() => set({ autosave: "error" })), 500) },
  addPhotos: (photos) => get().update((project) => ({ ...project, photos: [...project.photos, ...photos] })),
  removePhoto: (id) => get().update((project) => ({ ...project, photos: project.photos.filter((photo) => photo.id !== id) })),
  setFrame: (frame) => get().update((project) => ({
    ...project,
    frame,
    photos: project.frame ? project.photos.map((photo) => ({
      ...photo,
      transform: remapTransformToFrame(photo.transform, photo.width, photo.height, project.frame!, frame),
    })) : project.photos,
  })),
  restore: async () => { const latest = await db.projects.orderBy("updatedAt").last(); if (latest) { set({ project: latest, hydrated: true, autosave: "saved" }); return true } set({ hydrated: true }); return false },
  reset: async () => { const old = get().project; await clearProject(old.id); set({ project: createProject(), autosave: "idle" }) },
}))
