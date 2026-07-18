import { navigate } from "../../constants/steps"

export function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <strong>Twibbonify</strong>
        <span>© 2026 Twibbonify. Diproses 100% di perangkatmu.</span>
        <div>
          <button className="text-button" onClick={() => navigate("/privacy")}>Privasi</button>
          <a href="https://github.com/Fadhil-Sabar/twibbonify" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </footer>
  )
}
