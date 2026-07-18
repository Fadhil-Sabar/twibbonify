import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, RotateCcw, X } from "lucide-react"
import { useProjectStore } from "../../stores/project.store"
import { canOpenStep } from "../../lib/image"
import { STEP_META, stepFromUrl, navigate } from "../../constants/steps"
import { Header } from "../organisms/Header"
import { Footer } from "../organisms/Footer"
import { Steps } from "../atoms/Steps"
import { PrivacyNotice } from "../atoms/PrivacyNotice"
import { TemplateStep } from "../organisms/TemplateStep"
import { FrameStep, type FrameStepHandle } from "../organisms/FrameStep"
import { PhotosStep } from "../organisms/PhotosStep"
import { PreviewStep } from "../organisms/PreviewStep"
import { ExportStep } from "../organisms/ExportStep"
import type { EditorStep } from "../../types/project"

export function EditorPage() {
  const { project, restore, reset } = useProjectStore()
  const [step, setStep] = useState(stepFromUrl)
  const [restorePrompt, setRestorePrompt] = useState(false)
  const frameStepRef = useRef<FrameStepHandle>(null)

  useEffect(() => { restore().then(setRestorePrompt) }, [restore])
  useEffect(() => {
    const sync = () => setStep(stepFromUrl())
    addEventListener("popstate", sync)
    return () => removeEventListener("popstate", sync)
  }, [])

  const go = (target: EditorStep) => {
    if (!canOpenStep(target, project)) return
    navigate(`/editor?step=${target}`)
  }

  const index = STEP_META.findIndex((item) => item.id === step)

  const advance = useCallback(async () => {
    if (step === "frame" && frameStepRef.current) {
      await frameStepRef.current.handleAdvance()
    } else {
      go(STEP_META[index + 1].id)
    }
  }, [step, index, go])

  return (
    <>
      <Header />
      <main className="editor-main">
        <Steps active={step} project={project} go={go} />
        {step === "template" && <TemplateStep />}
        {step === "frame" && <FrameStep ref={frameStepRef} onNext={() => go("photos")} />}
        {step === "photos" && <PhotosStep />}
        {step === "preview" && <PreviewStep />}
        {step === "export" && <ExportStep />}
        <div className="editor-nav">
          <button className="button secondary" disabled={index === 0} onClick={() => go(STEP_META[index - 1].id)}>
            <ArrowLeft /> Kembali
          </button>
          {step !== "export" && (
            <button className="button" disabled={!canOpenStep(STEP_META[index + 1].id, project)} onClick={advance}>
              Lanjutkan <ArrowRight />
            </button>
          )}
        </div>
        <PrivacyNotice />
      </main>
      <Footer />
      {restorePrompt && (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="restore-title">
          <div className="dialog">
            <button className="icon-button close" aria-label="Tutup" onClick={() => setRestorePrompt(false)}><X /></button>
            <span className="icon-bubble"><RotateCcw /></span>
            <h2 id="restore-title">Lanjutkan project terakhir?</h2>
            <p>Draft tersimpan aman di perangkat ini.</p>
            <button className="button" onClick={() => setRestorePrompt(false)}>Lanjutkan project</button>
            <button className="button secondary" onClick={() => { reset(); setRestorePrompt(false) }}>Mulai project baru</button>
          </div>
        </div>
      )}
    </>
  )
}
