import { ShieldCheck } from "lucide-react"

export function PrivacyNotice() {
  return (
    <aside className="privacy">
      <span className="icon-bubble"><ShieldCheck /></span>
      <div>
        <strong>Foto tetap aman di perangkatmu</strong>
        <p>Twibbonify memproses semua gambar langsung di browser. Foto tidak diunggah, disimpan, atau dikirim ke server.</p>
      </div>
    </aside>
  )
}
