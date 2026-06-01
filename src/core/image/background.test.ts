import { describe, expect, it } from 'vitest'
import { findOpaqueBounds, readFirstPixel, removeBackgroundFromPixels } from './background'

describe('background removal', () => {
  it('uses the first pixel as the background sample', () => {
    const pixels = new Uint8ClampedArray([240, 241, 242, 255, 10, 20, 30, 255])

    expect(readFirstPixel(pixels)).toEqual({ r: 240, g: 241, b: 242, a: 255 })
  })

  it('makes pixels matching the sampled background transparent', () => {
    const pixels = new Uint8ClampedArray([255, 255, 255, 255, 250, 250, 250, 255, 10, 20, 30, 255])

    const result = removeBackgroundFromPixels(pixels, { r: 255, g: 255, b: 255, a: 255 }, 10)

    expect(Array.from(result)).toEqual([255, 255, 255, 0, 250, 250, 250, 0, 10, 20, 30, 255])
  })

  it('does not mutate the original pixel buffer', () => {
    const pixels = new Uint8ClampedArray([255, 255, 255, 255])

    removeBackgroundFromPixels(pixels, { r: 255, g: 255, b: 255, a: 255 }, 0)

    expect(Array.from(pixels)).toEqual([255, 255, 255, 255])
  })

  it('finds the bounding box of non-transparent pixels', () => {
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 0, 0, 0,
      0, 255, 255, 0, 0, 0, 0,
    ])

    expect(findOpaqueBounds(pixels, 3, 3)).toEqual({ x: 1, y: 1, width: 2, height: 2 })
  })

  it('returns undefined when every pixel is transparent', () => {
    const pixels = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 0])

    expect(findOpaqueBounds(pixels, 2, 1)).toBeUndefined()
  })
})
