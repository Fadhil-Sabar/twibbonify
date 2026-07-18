import Dexie, { type Table } from "dexie"
import type { TwibbonProject } from "../types/project"

export type AssetRecord = { id: string; projectId: string; type: "template" | "photo" | "thumbnail" | "mask"; photoId?: string; blob: Blob }
class TwibbonifyDatabase extends Dexie {
  projects!: Table<TwibbonProject, string>
  assets!: Table<AssetRecord, string>
  constructor() { super("twibbonify"); this.version(1).stores({ projects: "id, updatedAt", assets: "id, projectId, type, photoId" }) }
}
export const db = new TwibbonifyDatabase()
export const saveProject = (project: TwibbonProject) => db.projects.put({ ...project, updatedAt: Date.now() })
export const saveAsset = (asset: AssetRecord) => db.assets.put(asset)
export const getAsset = (id: string) => db.assets.get(id)
export async function clearProject(projectId: string) { await db.transaction("rw", db.projects, db.assets, async () => { await db.projects.delete(projectId); await db.assets.where("projectId").equals(projectId).delete() }) }
