export type SplitMode = 'row' | 'column'

export type DragAxis = 'x' | 'y'

export interface AxisBand {
  start: number
  end: number
}

export interface SpriteSheet {
  id: string
  name: string
  width: number
  height: number
  objectUrl: string
  image: HTMLImageElement
}

export interface GridConfig {
  mode: SplitMode
  width: number
  height: number
  rows: number
  columns: number
  rowBands: AxisBand[]
  columnBands: AxisBand[]
  columnBandsByRow: AxisBand[][]
  rowBandsByColumn: AxisBand[][]
  minFrameSize: number
}

export interface FrameRect {
  id: string
  row: number
  column: number
  index: number
  x: number
  y: number
  width: number
  height: number
}

export interface FrameItem extends FrameRect {
  name: string
  selected: boolean
  previewUrl?: string
}

export interface DragTarget {
  axis: DragAxis
  bandIndex: number
  edge: 'start' | 'end'
  row?: number
  column?: number
  scope: 'global' | 'row' | 'column'
}

export interface ExportFrame {
  name: string
  rect: FrameRect
}

export interface BackgroundRemovalOptions {
  enabled: boolean
  tolerance: number
  trimTransparent: boolean
}

export interface CropFrameOptions {
  backgroundRemoval?: BackgroundRemovalOptions
}
