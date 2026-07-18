interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
}

export function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        min={0}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
      />
    </label>
  )
}
