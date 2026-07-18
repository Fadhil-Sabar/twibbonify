import { Download, FileArchive, ImagePlus } from "lucide-react"

export function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="template-mock">
        <div className="mock-hole"><ImagePlus /></div>
        <span>Template utama</span>
      </div>
      <div className="people-mock">
        <div className="portrait one" />
        <div className="portrait two" />
      </div>
      <div className="zip-ticket">
        <FileArchive />
        <span><strong>Hasil_Twibbon.zip</strong><small>12 file · siap diunduh</small></span>
        <Download />
      </div>
    </div>
  )
}
