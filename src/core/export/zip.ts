import JSZip from 'jszip'
import { cropFrameToBlob } from '../image/crop'
import type { CropFrameOptions, ExportFrame, SpriteSheet } from '../../types/sprite'

export async function buildFramesZip(
  sheet: SpriteSheet,
  frames: ExportFrame[],
  options: CropFrameOptions = {},
): Promise<Blob> {
  const zip = new JSZip()

  for (const frame of frames) {
    const blob = await cropFrameToBlob(sheet, frame.rect, options)
    zip.file(`${sanitizeFileName(frame.name)}.png`, blob)
  }

  return zip.generateAsync({ type: 'blob' })
}

export function sanitizeFileName(name: string): string {
  const safeName = name.trim().replace(/[\\/:*?"<>|]+/g, '-')
  return safeName || 'frame'
}
