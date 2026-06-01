import { findOpaqueBounds, readFirstPixel, removeBackgroundFromPixels } from './background'
import type { CropFrameOptions, FrameRect, SpriteSheet } from '../../types/sprite'

export async function cropFrameToBlob(
  sheet: SpriteSheet,
  rect: FrameRect,
  options: CropFrameOptions = {},
): Promise<Blob> {
  let outputCanvas = createCanvas(rect.width, rect.height)
  const context = outputCanvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas 2D context is unavailable.')
  }

  context.imageSmoothingEnabled = false
  context.drawImage(
    sheet.image,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height,
  )

  if (options.backgroundRemoval?.enabled) {
    const imageData = createBackgroundRemovedImageData(
      context,
      rect.width,
      rect.height,
      options.backgroundRemoval.tolerance,
    )

    if (options.backgroundRemoval.trimTransparent) {
      outputCanvas = trimImageDataToOpaqueBounds(imageData)
    } else {
      context.putImageData(imageData, 0, 0)
    }
  }

  return canvasToBlob(outputCanvas)
}

export async function cropFrameToObjectUrl(
  sheet: SpriteSheet,
  rect: FrameRect,
  options: CropFrameOptions = {},
): Promise<string> {
  const blob = await cropFrameToBlob(sheet, rect, options)
  return URL.createObjectURL(blob)
}

function createBackgroundRemovedImageData(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  tolerance: number,
): ImageData {
  const imageData = context.getImageData(0, 0, width, height)
  const background = readFirstPixel(imageData.data)
  const pixels = removeBackgroundFromPixels(imageData.data, background, tolerance)

  imageData.data.set(pixels)
  return imageData
}

function trimImageDataToOpaqueBounds(imageData: ImageData): HTMLCanvasElement {
  const bounds = findOpaqueBounds(imageData.data, imageData.width, imageData.height)

  if (!bounds) {
    return createCanvas(1, 1)
  }

  const canvas = createCanvas(bounds.width, bounds.height)
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas 2D context is unavailable.')
  }

  const trimmedImageData = context.createImageData(bounds.width, bounds.height)

  for (let y = 0; y < bounds.height; y += 1) {
    const sourceStart = ((bounds.y + y) * imageData.width + bounds.x) * 4
    const sourceEnd = sourceStart + bounds.width * 4
    const targetStart = y * bounds.width * 4

    trimmedImageData.data.set(imageData.data.subarray(sourceStart, sourceEnd), targetStart)
  }

  context.putImageData(trimmedImageData, 0, 0)
  return canvas
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to create PNG blob.'))
      }
    }, 'image/png')
  })
}
