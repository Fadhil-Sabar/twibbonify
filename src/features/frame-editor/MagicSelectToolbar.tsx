import { Check, Maximize2, Minimize2, RefreshCcw, RotateCcw, WandSparkles, X } from "lucide-react"
import type { MagicSelectionMode, MagicSelectionState } from "./magic-selection.types"

type Props = {
  state: MagicSelectionState
  onMode: (mode: MagicSelectionMode) => void
  onTolerance: (value: number) => void
  onFeather: (value: number) => void
  onInvert: () => void
  onExpand: () => void
  onContract: () => void
  onReset: () => void
  onCancel: () => void
  onUse: () => void
  onClose: () => void
}

export function MagicSelectToolbar({ state, onMode, onTolerance, onFeather, onInvert, onExpand, onContract, onReset, onCancel, onUse, onClose }: Props) {
  return <div className="magic-toolbar"><div className="magic-title"><span><WandSparkles/> Magic Select</span><button className="icon-button" aria-label="Tutup Magic Select" onClick={onClose}><X/></button></div><p>Klik area kosong pada template.</p><div className="magic-modes" aria-label="Mode selection">{(["replace", "add", "subtract"] as const).map((mode) => <button key={mode} aria-pressed={state.mode === mode} className={state.mode === mode ? "selected" : ""} onClick={() => onMode(mode)}>{mode === "replace" ? "Ganti pilihan" : mode === "add" ? "Tambah pilihan" : "Kurangi pilihan"}</button>)}</div><label className="magic-range"><span>Toleransi warna <b>{state.settings.tolerance}</b></span><input aria-label="Toleransi warna" type="range" min={0} max={100} value={state.settings.tolerance} onChange={(event) => onTolerance(Number(event.target.value))}/></label><label className="magic-range"><span>Feather <b>{state.settings.feather}px</b></span><input aria-label="Feather selection" type="range" min={0} max={10} value={state.settings.feather} onChange={(event) => onFeather(Number(event.target.value))}/></label><div className="magic-actions"><button disabled={!state.mask} onClick={onInvert} title="Balik pilihan"><RefreshCcw/> Balik</button><button disabled={!state.mask || state.settings.expansion >= 20} onClick={onExpand} title="Perluas area"><Maximize2/> Perluas</button><button disabled={!state.mask || state.settings.expansion <= -20} onClick={onContract} title="Perkecil area"><Minimize2/> Perkecil</button><button disabled={!state.mask} onClick={onReset} title="Reset pilihan"><RotateCcw/> Reset</button></div><div className="magic-status" aria-live="polite">{state.status === "processing" ? <><span className="spinner"/> Mendeteksi area... <button onClick={onCancel}>Batalkan</button></> : state.errorMessage ?? (state.mask ? `${state.selectedPixelCount.toLocaleString("id-ID")} pixel dipilih` : "Belum ada area dipilih")}</div>{state.mask && <div className="magic-convert"><p>Selection akan digunakan langsung sebagai mask foto.</p><button className="button full" onClick={onUse}><Check/> Gunakan sebagai Area Foto</button></div>}</div>
}
