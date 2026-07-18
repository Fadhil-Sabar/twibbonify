import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react"
import { navigate } from "../../constants/steps"
import { Header } from "../organisms/Header"
import { Footer } from "../organisms/Footer"

export function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="privacy-page">
        <section className="privacy-hero">
          <span className="icon-bubble"><ShieldCheck /></span>
          <h1>Kebijakan Privasi</h1>
          <p>Twibbonify memproses semua gambar langsung di browser. Foto tidak pernah meninggalkan perangkatmu.</p>
        </section>

        <section className="privacy-content">
          <article>
            <h2><LockKeyhole /> Data yang Kami Proses</h2>
            <p>Seluruh pemrosesan gambar — termasuk upload template, penentuan area foto, manipulasi foto peserta, dan export hasil — dilakukan sepenuhnya di browser pengguna menggunakan JavaScript dan Canvas API.</p>
            <ul>
              <li>Template twibbon tidak diunggah ke server.</li>
              <li>Foto peserta tidak dikirim ke layanan manapun.</li>
              <li>Preview dan hasil export dibuat secara lokal.</li>
              <li>Tidak ada data gambar yang disimpan di server kami.</li>
            </ul>
          </article>

          <article>
            <h2>Penyimpanan Lokal</h2>
            <p>Twibbonify menggunakan IndexedDB di browser kamu untuk menyimpan draft project secara lokal. Data ini hanya tersimpan di perangkat yang kamu gunakan dan dapat dihapus kapan saja melalui pengaturan browser.</p>
          </article>

          <article>
            <h2>Analytics dan Pelacakan</h2>
            <p>Twibbonify MVP tidak menggunakan analytics, pelacakan pengguna, atau layanan pihak ketiga yang mengumpulkan data pribadi. Tidak ada cookie pelacakan yang dipasang.</p>
          </article>

          <article>
            <h2>Kontak</h2>
            <p>Jika kamu memiliki pertanyaan tentang privasi, silakan hubungi kami melalui <a href="https://github.com/Fadhil-Sabar/twibbonify/issues" target="_blank" rel="noreferrer">GitHub Issues</a>.</p>
          </article>
        </section>

        <button className="button secondary" onClick={() => navigate("/")}>
          <ArrowLeft /> Kembali ke Beranda
        </button>
      </main>
      <Footer />
    </>
  )
}
