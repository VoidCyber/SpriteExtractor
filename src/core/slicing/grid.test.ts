import { describe, expect, it } from 'vitest'
import { computeFrameRects, createInitialGrid, moveBandEdge } from './grid'

describe('slicing grid', () => {
  it('creates evenly distributed frame rects', () => {
    const grid = createInitialGrid({ width: 400, height: 200 }, 2, 4, 'row')

    expect(computeFrameRects(grid).slice(0, 4)).toMatchObject([
      { id: 'r1-c1', x: 0, y: 0, width: 100, height: 100 },
      { id: 'r1-c2', x: 100, y: 0, width: 100, height: 100 },
      { id: 'r1-c3', x: 200, y: 0, width: 100, height: 100 },
      { id: 'r1-c4', x: 300, y: 0, width: 100, height: 100 },
    ])
  })

  it('supports row-specific column width changes in row mode', () => {
    const grid = createInitialGrid({ width: 400, height: 200 }, 2, 2, 'row')
    const moved = moveBandEdge(grid, {
      axis: 'x',
      row: 1,
      scope: 'row',
      bandIndex: 0,
      edge: 'end',
      value: 120,
    })

    const frames = computeFrameRects(moved)

    expect(frames.find((frame) => frame.id === 'r1-c1')?.width).toBe(200)
    expect(frames.find((frame) => frame.id === 'r2-c1')?.width).toBe(120)
    expect(frames.find((frame) => frame.id === 'r2-c2')?.x).toBe(120)
  })

  it('supports column-specific row height changes in column mode', () => {
    const grid = createInitialGrid({ width: 400, height: 200 }, 2, 2, 'column')
    const moved = moveBandEdge(grid, {
      axis: 'y',
      column: 1,
      scope: 'column',
      bandIndex: 0,
      edge: 'end',
      value: 80,
    })

    const frames = computeFrameRects(moved)

    expect(frames.find((frame) => frame.id === 'r1-c1')?.height).toBe(100)
    expect(frames.find((frame) => frame.id === 'r1-c2')?.height).toBe(80)
    expect(frames.find((frame) => frame.id === 'r2-c2')?.y).toBe(80)
  })

  it('keeps dragged edges inside neighboring frame constraints', () => {
    const grid = createInitialGrid({ width: 100, height: 100 }, 1, 2, 'row', 10)
    const moved = moveBandEdge(grid, {
      axis: 'x',
      row: 0,
      scope: 'row',
      bandIndex: 0,
      edge: 'end',
      value: 95,
    })

    const frames = computeFrameRects(moved)

    expect(frames.find((frame) => frame.id === 'r1-c1')?.width).toBe(90)
    expect(frames.find((frame) => frame.id === 'r1-c2')?.x).toBe(90)
    expect(frames.find((frame) => frame.id === 'r1-c2')?.width).toBe(10)
  })

  it('keeps internal row boundaries linked as a single divider', () => {
    const grid = createInitialGrid({ width: 100, height: 100 }, 2, 1, 'row', 10)
    const moved = moveBandEdge(grid, {
      axis: 'y',
      scope: 'global',
      bandIndex: 0,
      edge: 'end',
      value: 70,
    })

    const frames = computeFrameRects(moved)

    expect(frames.find((frame) => frame.id === 'r1-c1')?.height).toBe(70)
    expect(frames.find((frame) => frame.id === 'r2-c1')?.y).toBe(70)
    expect(frames.find((frame) => frame.id === 'r2-c1')?.height).toBe(30)
  })

  it('allows dragging a start edge to move the previous end edge too', () => {
    const grid = createInitialGrid({ width: 100, height: 100 }, 1, 2, 'row', 10)
    const moved = moveBandEdge(grid, {
      axis: 'x',
      row: 0,
      scope: 'row',
      bandIndex: 1,
      edge: 'start',
      value: 30,
    })

    const frames = computeFrameRects(moved)

    expect(frames.find((frame) => frame.id === 'r1-c1')?.width).toBe(30)
    expect(frames.find((frame) => frame.id === 'r1-c2')?.x).toBe(30)
    expect(frames.find((frame) => frame.id === 'r1-c2')?.width).toBe(70)
  })

  it('allows the final edge to move back to the sheet boundary after shrinking', () => {
    const grid = createInitialGrid({ width: 100, height: 100 }, 1, 1, 'row', 10)
    const shrunk = moveBandEdge(grid, {
      axis: 'x',
      row: 0,
      scope: 'row',
      bandIndex: 0,
      edge: 'end',
      value: 60,
    })
    const expanded = moveBandEdge(shrunk, {
      axis: 'x',
      row: 0,
      scope: 'row',
      bandIndex: 0,
      edge: 'end',
      value: 100,
    })

    expect(computeFrameRects(expanded)[0].width).toBe(100)
  })
})
