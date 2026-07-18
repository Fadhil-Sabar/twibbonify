import { Check } from "lucide-react"
import { canOpenStep } from "../../lib/image"
import { STEP_META } from "../../constants/steps"
import type { EditorStep, TwibbonProject } from "../../types/project"

interface StepsProps {
  active: EditorStep
  project: TwibbonProject
  go: (step: EditorStep) => void
}

export function Steps({ active, project, go }: StepsProps) {
  const activeIndex = STEP_META.findIndex((item) => item.id === active)
  return (
    <ol className="steps" aria-label="Langkah pembuatan">
      {STEP_META.map((item, index) => (
        <li key={item.id} className={index === activeIndex ? "active" : index < activeIndex ? "done" : ""}>
          <button disabled={!canOpenStep(item.id, project)} onClick={() => go(item.id)}>
            <span>{index < activeIndex ? <Check /> : index + 1}</span>
            <b>{item.label}</b>
          </button>
        </li>
      ))}
    </ol>
  )
}
