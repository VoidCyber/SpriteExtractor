export interface RgbaColor {
  r: number
  g: number
  b: number
  a: number
}

export interface PixelBounds {
  x: number
  y: number
  width: number
  height: number
}

export function removeBackgroundFromPixels(
  pixels: Uint8ClampedArray,
  background: RgbaColor,
  tolerance: number,
): Uint8ClampedArray {
  const nextPixels = new Uint8ClampedArray(pixels)
  const safeTolerance = Math.max(0, tolerance)

  for (let index = 0; index < nextPixels.length; index += 4) {
    const distance = colorDistance(
      nextPixels[index],
      nextPixels[index + 1],
      nextPixels[index + 2],
      background.r,
      background.g,
      background.b,
    )

    if (distance <= safeTolerance) {
      nextPixels[index + 3] = 0
    }
  }

  return nextPixels
}

export function readFirstPixel(pixels: Uint8ClampedArray): RgbaColor {
  return {
    r: pixels[0] ?? 0,
    g: pixels[1] ?? 0,
    b: pixels[2] ?? 0,
    a: pixels[3] ?? 255,
  }
}

export function findOpaqueBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaThreshold = 0,
): PixelBounds | undefined {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * 4 + 3]

      if (alpha > alphaThreshold) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return undefined
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const red = r1 - r2
  const green = g1 - g2
  const blue = b1 - b2

  return Math.sqrt(red * red + green * green + blue * blue)
}
