import { isTauri } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'

export async function saveBlob(blob: Blob, fileName: string): Promise<void> {
  if (isTauri()) {
    await saveBlobToDesktop(blob, fileName)
    return
  }

  downloadBlob(blob, fileName)
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()

  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function saveBlobToDesktop(blob: Blob, fileName: string): Promise<void> {
  const filePath = await save({
    title: '保存精灵帧压缩包',
    defaultPath: fileName,
    filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
    canCreateDirectories: true,
  })

  if (!filePath) {
    return
  }

  await writeFile(filePath, new Uint8Array(await blob.arrayBuffer()))
}
