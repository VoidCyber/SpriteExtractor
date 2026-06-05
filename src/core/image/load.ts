import type { SpriteSheet } from '../../types/sprite'

export async function loadSpriteSheet(file: File): Promise<SpriteSheet> {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImageElement(objectUrl)

    return {
      id: createSpriteSheetId(),
      name: file.name.replace(/\.[^.]+$/, ''),
      width: image.naturalWidth,
      height: image.naturalHeight,
      objectUrl,
      image,
    }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image.'))
    image.src = src
  })
}

function createSpriteSheetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))

    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join(''),
    ].join('-')
  }

  return `sprite-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
