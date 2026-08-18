import { ArrowRight, FileArchive, ImagePlus, LockKeyhole, Scissors, ShieldCheck, Sparkles } from "lucide-react"
import { navigate } from "../../constants/steps"
import { Header } from "../organisms/Header"
import { Footer } from "../organisms/Footer"
import { HeroArt } from "../organisms/HeroArt"

export function LandingPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><ShieldCheck /> 100% diproses di perangkatmu</span>
          <h1>Satu template, puluhan twibbon. Semua beres dalam hitungan menit.</h1>
          <p>Upload templatemu sekali, masukkan semua foto peserta, lalu unduh hasilnya dalam satu file ZIP. Tanpa install, tanpa daftar.</p>
            <div className="hero-actions">
              <button className="button" onClick={() => navigate("/editor?step=template")}><ImagePlus /> Bikin Twibbon Sekarang</button>
              <a className="button secondary" href="#cara-kerja">Cara Kerjanya?</a>
            </div>
            <small><LockKeyhole /> Fotomu tetap di perangkatmu. Nol unggahan ke server.</small>
          </div>
          <HeroArt />
        </section>
        <section className="benefits" id="tentang">
          <article><ShieldCheck /><h2>Privasi Terjamin</h2><p>Foto peserta nggak pernah keluar dari browser. Semua diproses di sini, di perangkatmu.</p></article>
          <article><Sparkles /><h2>Proses Massal</h2><p>Upload sampai 100 foto dalam satu tarikan, biarkan sistem yang menyusun semua. Kamu tinggal unduh.</p></article>
          <article><Scissors /><h2>Cutout PNG Transparan</h2><p>Unduh template dengan area foto berlubang, siap dipakai lagi di Canva atau aplikasi desain lain.</p></article>
          <article><FileArchive /><h2>Siap Dibagikan</h2><p>Semua hasil otomatis terbundel rapi dalam satu ZIP. Kirim langsung ke peserta tanpa ribet.</p></article>
        </section>
        <section className="how" id="cara-kerja">
          <div className="section-title">
            <span>CUKUP 3 LANGKAH</span>
            <h2>Tiga gerakan, puluhan hasil</h2>
            <p>Nggak perlu Photoshop. Nggak perlu daftar.</p>
          </div>
          <div className="how-grid">
            <article><b>01</b><h3>Upload template</h3><p>Ambil desain PNG, JPG, atau WebP-mu.</p></article>
            <article><b>02</b><h3>Tentukan area foto</h3><p>Atur di mana foto peserta muncul, lalu tambahkan semuanya sekaligus.</p></article>
            <article><b>03</b><h3>Unduh & bagikan</h3><p>Periksa sekilas, unduh ZIP, langsung kirim ke peserta.</p></article>
          </div>
        </section>
        <section className="landing-cta">
          <span>GRATIS, TANPA DAFTAR</span>
          <h2>Satu template. Banyak cerita.</h2>
          <button className="button light" onClick={() => navigate("/editor?step=template")}>Bikin Twibbon Pertamamu <ArrowRight /></button>
        </section>
      </main>
      <Footer />
    </>
  )
}
