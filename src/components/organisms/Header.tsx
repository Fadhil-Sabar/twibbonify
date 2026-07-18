import { Moon, Sun } from "lucide-react"
import { navigate } from "../../constants/steps"
import { useTheme } from "../../hooks/useTheme"

export function Header() {
  const { resolved, toggle } = useTheme()
  return (
    <>
      <a href="#main-content" className="skip-link">Lewati ke konten</a>
      <header className="site-header">
        <div className="header-inner">
          <div className="header-left">
            <button className="wordmark" onClick={() => navigate("/")}>Twibbonify</button>
            <nav aria-label="Navigasi utama">
              <a href="/#cara-kerja">Cara Kerja</a>
              <a href="/#tentang">Tentang</a>
            </nav>
          </div>
          <div className="header-right">
            <button className="icon-button theme-toggle" aria-label={resolved === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap"} onClick={toggle}>
              {resolved === "dark" ? <Sun /> : <Moon />}
            </button>
            <button className="button compact" onClick={() => navigate("/editor?step=template")}>Mulai Buat</button>
          </div>
        </div>
      </header>
    </>
  )
}
