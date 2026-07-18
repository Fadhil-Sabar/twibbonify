import type { MagicSelectionSettings } from "./magic-selection.types"

export const MAGIC_SELECTION_MAX_DIMENSION = 2048
export const DEFAULT_SELECTION_INSET = 2
export const defaultMagicSelectionSettings: MagicSelectionSettings = {
  tolerance: 24,
  contiguous: true,
  expansion: 1,
  feather: 0,
}
