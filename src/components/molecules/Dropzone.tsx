import { useRef, type DragEvent } from "react"

interface DropzoneProps {
  multiple?: boolean
  onFiles: (files: File[]) => void
  children: React.ReactNode
}

export function Dropzone({ multiple, onFiles, children }: DropzoneProps) {
  const input = useRef<HTMLInputElement>(null)
  const accept = (files: FileList | null) => files && onFiles(Array.from(files))
  return (
    <div
      className="dropzone"
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") input.current?.click() }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event: DragEvent) => { event.preventDefault(); accept(event.dataTransfer.files) }}
    >
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={multiple}
        onChange={(event) => { accept(event.target.files); event.target.value = "" }}
      />
      {children}
    </div>
  )
}
