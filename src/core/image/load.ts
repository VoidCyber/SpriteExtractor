import type { SpriteSheet } from '../../types/sprite'

export async function loadSpriteSheet(file: File): Promise<SpriteSheet> {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImageElement(objectUrl)

    return {
      id: crypto.randomUUID(),
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
