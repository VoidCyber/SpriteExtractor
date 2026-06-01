import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { cropFrameToObjectUrl } from '../core/image/crop'
import { loadSpriteSheet } from '../core/image/load'
import { buildFramesZip } from '../core/export/zip'
import {
  computeFrameRects,
  createInitialGrid,
  moveBandEdge,
  resetGrid as resetGridConfig,
  resizeGrid,
} from '../core/slicing/grid'
import type {
  DragTarget,
  ExportFrame,
  FrameItem,
  GridConfig,
  SplitMode,
  SpriteSheet,
} from '../types/sprite'

export const useSpriteProjectStore = defineStore('spriteProject', () => {
  const sheet = ref<SpriteSheet>()
  const grid = ref<GridConfig>()
  const frames = ref<FrameItem[]>([])
  const rows = ref(3)
  const columns = ref(4)
  const mode = ref<SplitMode>('row')
  const removeBackground = ref(false)
  const trimTransparent = ref(false)
  const backgroundTolerance = ref(24)
  const isLoading = ref(false)
  const isExporting = ref(false)
  const errorMessage = ref('')

  const selectedFrames = computed(() => frames.value.filter((frame) => frame.selected))
  const canExport = computed(() => Boolean(sheet.value && selectedFrames.value.length > 0))

  async function importImage(file: File): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''
    cleanupObjectUrls()

    try {
      sheet.value = await loadSpriteSheet(file)
      grid.value = createInitialGrid(sheet.value, rows.value, columns.value, mode.value)
      syncFrames()
      await refreshPreviews()
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '导入图片失败。'
    } finally {
      isLoading.value = false
    }
  }

  async function updateGridOptions(next: {
    rows?: number
    columns?: number
    mode?: SplitMode
  }): Promise<void> {
    rows.value = next.rows ?? rows.value
    columns.value = next.columns ?? columns.value
    mode.value = next.mode ?? mode.value

    if (!sheet.value) {
      return
    }

    grid.value = resizeGrid(grid.value, sheet.value, rows.value, columns.value, mode.value)
    syncFrames()
    await refreshPreviews()
  }

  function moveEdge(target: DragTarget, value: number): void {
    if (!grid.value) {
      return
    }

    grid.value = moveBandEdge(grid.value, { ...target, value })
    syncFrames()
  }

  async function resetGrid(): Promise<void> {
    if (!sheet.value) {
      return
    }

    grid.value = resetGridConfig(sheet.value, rows.value, columns.value, mode.value)
    syncFrames()
    await refreshPreviews()
  }

  async function refreshPreviews(): Promise<void> {
    if (!sheet.value) {
      return
    }

    revokePreviewUrls()

    frames.value = await Promise.all(
      frames.value.map(async (frame) => ({
        ...frame,
        previewUrl: await cropFrameToObjectUrl(sheet.value as SpriteSheet, frame, getCropOptions()),
      })),
    )
  }

  async function setRemoveBackground(enabled: boolean): Promise<void> {
    removeBackground.value = enabled

    if (!enabled) {
      trimTransparent.value = false
    }

    await refreshPreviews()
  }

  async function setTrimTransparent(enabled: boolean): Promise<void> {
    trimTransparent.value = removeBackground.value && enabled
    await refreshPreviews()
  }

  function renameFrame(frameId: string, name: string): void {
    frames.value = frames.value.map((frame) => (frame.id === frameId ? { ...frame, name } : frame))
  }

  function toggleFrame(frameId: string, selected: boolean): void {
    frames.value = frames.value.map((frame) =>
      frame.id === frameId ? { ...frame, selected } : frame,
    )
  }

  function selectAll(selected: boolean): void {
    frames.value = frames.value.map((frame) => ({ ...frame, selected }))
  }

  function invertSelection(): void {
    frames.value = frames.value.map((frame) => ({ ...frame, selected: !frame.selected }))
  }

  async function exportSelectedFrames(): Promise<Blob | undefined> {
    if (!sheet.value || selectedFrames.value.length === 0) {
      return undefined
    }

    isExporting.value = true

    try {
      const exportFrames: ExportFrame[] = selectedFrames.value.map((frame) => ({
        name: frame.name,
        rect: frame,
      }))
      return await buildFramesZip(sheet.value, exportFrames, getCropOptions())
    } finally {
      isExporting.value = false
    }
  }

  function syncFrames(): void {
    if (!grid.value) {
      frames.value = []
      return
    }

    const previousById = new Map(frames.value.map((frame) => [frame.id, frame]))

    frames.value = computeFrameRects(grid.value).map((rect) => {
      const previous = previousById.get(rect.id)

      return {
        ...rect,
        selected: previous?.selected ?? true,
        name: previous?.name ?? `frame_${String(rect.index + 1).padStart(3, '0')}`,
        previewUrl: previous?.previewUrl,
      }
    })
  }

  function cleanupObjectUrls(): void {
    if (sheet.value) {
      URL.revokeObjectURL(sheet.value.objectUrl)
    }

    revokePreviewUrls()
  }

  function revokePreviewUrls(): void {
    for (const frame of frames.value) {
      if (frame.previewUrl) {
        URL.revokeObjectURL(frame.previewUrl)
      }
    }
  }

  function getCropOptions() {
    return {
      backgroundRemoval: {
        enabled: removeBackground.value,
        tolerance: backgroundTolerance.value,
        trimTransparent: removeBackground.value && trimTransparent.value,
      },
    }
  }

  return {
    sheet,
    grid,
    frames,
    rows,
    columns,
    mode,
    removeBackground,
    trimTransparent,
    backgroundTolerance,
    isLoading,
    isExporting,
    errorMessage,
    selectedFrames,
    canExport,
    importImage,
    updateGridOptions,
    moveEdge,
    resetGrid,
    refreshPreviews,
    setRemoveBackground,
    setTrimTransparent,
    renameFrame,
    toggleFrame,
    selectAll,
    invertSelection,
    exportSelectedFrames,
  }
})
