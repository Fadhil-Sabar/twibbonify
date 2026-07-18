import { navigate } from "../../constants/steps"

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="wordmark" onClick={() => navigate("/")}>Twibbonify</button>
        <nav aria-label="Navigasi utama">
          <a href="/#cara-kerja">Cara Kerja</a>
          <a href="/#tentang">Tentang</a>
        </nav>
        <button className="button compact" onClick={() => navigate("/editor?step=template")}>Mulai Buat</button>
      </div>
    </header>
  )
}
