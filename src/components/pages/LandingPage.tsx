import { ArrowRight, FileArchive, ImagePlus, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react"
import { navigate } from "../../constants/steps"
import { Header } from "../organisms/Header"
import { Footer } from "../organisms/Footer"
import { HeroArt } from "../organisms/HeroArt"

export function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><ShieldCheck /> 100% diproses di perangkatmu</span>
          <h1>Bikin banyak twibbon dalam hitungan menit.</h1>
          <p>Upload satu template, tambahkan semua foto peserta, lalu unduh seluruh hasil sekaligus.</p>
            <div className="hero-actions">
              <button className="button" onClick={() => navigate("/editor?step=template")}><ImagePlus /> Mulai Buat Twibbon</button>
              <a className="button secondary" href="#cara-kerja">Lihat Cara Kerja</a>
            </div>
            <small><LockKeyhole /> Foto tidak diunggah ke server, semuanya diproses di perangkatmu.</small>
          </div>
          <HeroArt />
        </section>
        <section className="benefits" id="tentang">
          <article><ShieldCheck /><h3>Privasi Penuh</h3><p>Tidak ada data yang meninggalkan browser. Semua pemrosesan foto dilakukan secara lokal.</p></article>
          <article><Sparkles /><h3>Proses Ringkas</h3><p>Satu template untuk hingga 100 foto, tanpa mengedit setiap hasil secara manual.</p></article>
          <article><FileArchive /><h3>Format ZIP</h3><p>Seluruh hasil dibundel rapi agar mudah dibagikan ke peserta.</p></article>
        </section>
        <section className="how" id="cara-kerja">
          <div className="section-title">
            <span>ALUR SEDERHANA</span>
            <h2>Tiga gerakan, puluhan hasil</h2>
            <p>Tak perlu akun atau perangkat lunak desain.</p>
          </div>
          <div className="how-grid">
            <article><b>01</b><h3>Upload template</h3><p>Pilih desain PNG, JPG, atau WebP milikmu.</p></article>
            <article><b>02</b><h3>Masukkan foto</h3><p>Tentukan area dan tambahkan seluruh foto peserta.</p></article>
            <article><b>03</b><h3>Download ZIP</h3><p>Periksa hasil lalu unduh semuanya sekaligus.</p></article>
          </div>
        </section>
        <section className="landing-cta">
          <span>SIAP MULAI?</span>
          <h2>Satu template. Banyak cerita.</h2>
          <button className="button light" onClick={() => navigate("/editor?step=template")}>Mulai Buat Sekarang <ArrowRight /></button>
        </section>
      </main>
      <Footer />
    </>
  )
}
