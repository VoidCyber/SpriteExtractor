import type { AxisBand, FrameRect, GridConfig, SplitMode } from '../../types/sprite'

interface SheetSize {
  width: number
  height: number
}

interface MoveBandEdgeOptions {
  axis: 'x' | 'y'
  bandIndex: number
  edge: 'start' | 'end'
  value: number
  row?: number
  column?: number
  scope?: 'global' | 'row' | 'column'
}

const DEFAULT_MIN_FRAME_SIZE = 1

export function createInitialGrid(
  size: SheetSize,
  rows: number,
  columns: number,
  mode: SplitMode,
  minFrameSize = DEFAULT_MIN_FRAME_SIZE,
): GridConfig {
  const safeRows = sanitizeCount(rows)
  const safeColumns = sanitizeCount(columns)
  const rowBands = createEvenBands(size.height, safeRows)
  const columnBands = createEvenBands(size.width, safeColumns)

  return {
    mode,
    width: size.width,
    height: size.height,
    rows: safeRows,
    columns: safeColumns,
    rowBands,
    columnBands,
    columnBandsByRow: Array.from({ length: safeRows }, () => cloneBands(columnBands)),
    rowBandsByColumn: Array.from({ length: safeColumns }, () => cloneBands(rowBands)),
    minFrameSize,
  }
}

export function resizeGrid(
  current: GridConfig | undefined,
  size: SheetSize,
  rows: number,
  columns: number,
  mode: SplitMode,
): GridConfig {
  if (!current || current.rows !== rows || current.columns !== columns) {
    return createInitialGrid(size, rows, columns, mode, current?.minFrameSize)
  }

  return {
    ...current,
    mode,
  }
}

export function computeFrameRects(grid: GridConfig): FrameRect[] {
  const frames: FrameRect[] = []

  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      const yBand = grid.mode === 'row' ? grid.rowBands[row] : grid.rowBandsByColumn[column][row]
      const xBand =
        grid.mode === 'row' ? grid.columnBandsByRow[row][column] : grid.columnBands[column]
      const index = row * grid.columns + column

      frames.push({
        id: `r${row + 1}-c${column + 1}`,
        row,
        column,
        index,
        x: Math.round(xBand.start),
        y: Math.round(yBand.start),
        width: Math.max(1, Math.round(xBand.end - xBand.start)),
        height: Math.max(1, Math.round(yBand.end - yBand.start)),
      })
    }
  }

  return frames
}

export function moveBandEdge(grid: GridConfig, options: MoveBandEdgeOptions): GridConfig {
  if (options.axis === 'y' && options.scope !== 'column') {
    return {
      ...grid,
      rowBands: updateBands(
        grid.rowBands,
        options.bandIndex,
        options.edge,
        options.value,
        grid.minFrameSize,
        grid.height,
      ),
      rowBandsByColumn: grid.rowBandsByColumn.map((bands) =>
        updateBands(
          bands,
          options.bandIndex,
          options.edge,
          options.value,
          grid.minFrameSize,
          grid.height,
        ),
      ),
    }
  }

  if (options.axis === 'y' && typeof options.column === 'number') {
    return {
      ...grid,
      rowBandsByColumn: updateBandMatrix(
        grid.rowBandsByColumn,
        options.column,
        options.bandIndex,
        options.edge,
        options.value,
        grid.minFrameSize,
        grid.height,
      ),
    }
  }

  if (options.axis === 'x' && options.scope !== 'row') {
    return {
      ...grid,
      columnBands: updateBands(
        grid.columnBands,
        options.bandIndex,
        options.edge,
        options.value,
        grid.minFrameSize,
        grid.width,
      ),
      columnBandsByRow: grid.columnBandsByRow.map((bands) =>
        updateBands(
          bands,
          options.bandIndex,
          options.edge,
          options.value,
          grid.minFrameSize,
          grid.width,
        ),
      ),
    }
  }

  if (options.axis === 'x' && typeof options.row === 'number') {
    return {
      ...grid,
      columnBandsByRow: updateBandMatrix(
        grid.columnBandsByRow,
        options.row,
        options.bandIndex,
        options.edge,
        options.value,
        grid.minFrameSize,
        grid.width,
      ),
    }
  }

  return grid
}

export function resetGrid(
  size: SheetSize,
  rows: number,
  columns: number,
  mode: SplitMode,
): GridConfig {
  return createInitialGrid(size, rows, columns, mode)
}

export function createEvenBands(total: number, count: number): AxisBand[] {
  const safeCount = sanitizeCount(count)
  const step = total / safeCount

  return Array.from({ length: safeCount }, (_, index) => ({
    start: index * step,
    end: index === safeCount - 1 ? total : (index + 1) * step,
  }))
}

function sanitizeCount(value: number): number {
  return Math.max(1, Math.floor(Number.isFinite(value) ? value : 1))
}

function cloneBands(bands: AxisBand[]): AxisBand[] {
  return bands.map((band) => ({ ...band }))
}

function updateBandMatrix(
  matrix: AxisBand[][],
  matrixIndex: number,
  bandIndex: number,
  edge: 'start' | 'end',
  value: number,
  minFrameSize: number,
  maxValue: number,
): AxisBand[][] {
  return matrix.map((bands, index) =>
    index === matrixIndex
      ? updateBands(bands, bandIndex, edge, value, minFrameSize, maxValue)
      : cloneBands(bands),
  )
}

function updateBands(
  bands: AxisBand[],
  bandIndex: number,
  edge: 'start' | 'end',
  value: number,
  minFrameSize: number,
  maxValue: number,
): AxisBand[] {
  const nextBands = cloneBands(bands)
  const band = nextBands[bandIndex]

  if (!band) {
    return nextBands
  }

  const lower =
    edge === 'start'
      ? previousStart(nextBands, bandIndex) + minFrameSizeForPreviousBand(bandIndex, minFrameSize)
      : band.start + minFrameSize
  const upper =
    edge === 'start'
      ? band.end - minFrameSize
      : nextEnd(nextBands, bandIndex, maxValue) -
        minFrameSizeForNextBand(nextBands, bandIndex, minFrameSize)
  const nextValue = clamp(value, lower, upper)

  if (edge === 'start') {
    if (bandIndex > 0) {
      nextBands[bandIndex - 1] = {
        ...nextBands[bandIndex - 1],
        end: nextValue,
      }
    }

    nextBands[bandIndex] = {
      ...band,
      start: nextValue,
    }
  } else {
    nextBands[bandIndex] = {
      ...band,
      end: nextValue,
    }

    if (bandIndex < nextBands.length - 1) {
      nextBands[bandIndex + 1] = {
        ...nextBands[bandIndex + 1],
        start: nextValue,
      }
    }
  }

  return nextBands
}

function previousStart(bands: AxisBand[], bandIndex: number): number {
  return bandIndex === 0 ? 0 : bands[bandIndex - 1].start
}

function nextEnd(bands: AxisBand[], bandIndex: number, maxValue: number): number {
  return bandIndex === bands.length - 1 ? maxValue : bands[bandIndex + 1].end
}

function minFrameSizeForPreviousBand(bandIndex: number, minFrameSize: number): number {
  return bandIndex === 0 ? 0 : minFrameSize
}

function minFrameSizeForNextBand(
  bands: AxisBand[],
  bandIndex: number,
  minFrameSize: number,
): number {
  return bandIndex === bands.length - 1 ? 0 : minFrameSize
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.min(Math.max(value, lower), upper)
}
