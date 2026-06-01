<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSpriteProjectStore } from '../../stores/spriteProject'
import type { DragAxis, DragTarget } from '../../types/sprite'

interface OverlayLine {
  id: string
  axis: DragAxis
  x1: number
  y1: number
  x2: number
  y2: number
  target: DragTarget
  label: string
}

const store = useSpriteProjectStore()
const canvasScrollRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const svgRef = ref<SVGSVGElement>()
const fitZoom = ref(1)
const relativeZoom = ref(1)
const activeTarget = ref<DragTarget>()
let resizeObserver: ResizeObserver | undefined

const CANVAS_STAGE_MARGIN = 48
const MIN_RELATIVE_ZOOM = 0.1
const MAX_RELATIVE_ZOOM = 4

const actualZoom = computed(() => fitZoom.value * relativeZoom.value)

const canvasSize = computed(() => {
  if (!store.sheet) {
    return { width: 0, height: 0 }
  }

  return {
    width: store.sheet.width * actualZoom.value,
    height: store.sheet.height * actualZoom.value,
  }
})

const overlayLines = computed<OverlayLine[]>(() => {
  const grid = store.grid

  if (!grid) {
    return []
  }

  const lines: OverlayLine[] = []

  if (grid.mode === 'row') {
    grid.rowBands.forEach((band, row) => {
      if (row === 0) {
        lines.push(
          createLine(`row-${row}-start`, 'y', 0, band.start, store.sheet?.width ?? 0, band.start, {
            axis: 'y',
            bandIndex: row,
            edge: 'start',
            scope: 'global',
          }),
        )
      }

      lines.push(
        createLine(`row-${row}-end`, 'y', 0, band.end, store.sheet?.width ?? 0, band.end, {
          axis: 'y',
          bandIndex: row,
          edge: 'end',
          scope: 'global',
        }),
      )

      grid.columnBandsByRow[row].forEach((columnBand, column) => {
        if (column === 0) {
          lines.push(
            createLine(
              `row-${row}-col-${column}-start`,
              'x',
              columnBand.start,
              band.start,
              columnBand.start,
              band.end,
              { axis: 'x', bandIndex: column, edge: 'start', row, scope: 'row' },
            ),
          )
        }

        lines.push(
          createLine(
            `row-${row}-col-${column}-end`,
            'x',
            columnBand.end,
            band.start,
            columnBand.end,
            band.end,
            { axis: 'x', bandIndex: column, edge: 'end', row, scope: 'row' },
          ),
        )
      })
    })
  } else {
    grid.columnBands.forEach((band, column) => {
      if (column === 0) {
        lines.push(
          createLine(
            `column-${column}-start`,
            'x',
            band.start,
            0,
            band.start,
            store.sheet?.height ?? 0,
            {
              axis: 'x',
              bandIndex: column,
              edge: 'start',
              scope: 'global',
            },
          ),
        )
      }

      lines.push(
        createLine(`column-${column}-end`, 'x', band.end, 0, band.end, store.sheet?.height ?? 0, {
          axis: 'x',
          bandIndex: column,
          edge: 'end',
          scope: 'global',
        }),
      )

      grid.rowBandsByColumn[column].forEach((rowBand, row) => {
        if (row === 0) {
          lines.push(
            createLine(
              `column-${column}-row-${row}-start`,
              'y',
              band.start,
              rowBand.start,
              band.end,
              rowBand.start,
              { axis: 'y', bandIndex: row, edge: 'start', column, scope: 'column' },
            ),
          )
        }

        lines.push(
          createLine(
            `column-${column}-row-${row}-end`,
            'y',
            band.start,
            rowBand.end,
            band.end,
            rowBand.end,
            { axis: 'y', bandIndex: row, edge: 'end', column, scope: 'column' },
          ),
        )
      })
    })
  }

  return lines
})

watch([() => store.sheet, actualZoom], () => void drawCanvas(), { immediate: true })
watch(
  () => store.sheet,
  async () => {
    relativeZoom.value = 1
    await nextTick()
    ensureResizeObserver()
    fitImageToWidth()
  },
)

onMounted(() => {
  ensureResizeObserver()
  fitImageToWidth()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

async function drawCanvas(): Promise<void> {
  await nextTick()

  const canvas = canvasRef.value

  if (!canvas || !store.sheet) {
    return
  }

  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  canvas.width = canvasSize.value.width
  canvas.height = canvasSize.value.height
  context.imageSmoothingEnabled = false
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.drawImage(store.sheet.image, 0, 0, canvas.width, canvas.height)
}

function createLine(
  id: string,
  axis: DragAxis,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  target: DragTarget,
): OverlayLine {
  return {
    id,
    axis,
    x1,
    y1,
    x2,
    y2,
    target,
    label: target.edge === 'start' ? '起始边界' : '结束边界',
  }
}

function fitImageToWidth(): void {
  if (!store.sheet || !canvasScrollRef.value) {
    return
  }

  const availableWidth = Math.max(1, canvasScrollRef.value.clientWidth - CANVAS_STAGE_MARGIN)
  fitZoom.value = Math.max(0.0001, availableWidth / store.sheet.width)
}

function ensureResizeObserver(): void {
  if (resizeObserver || !canvasScrollRef.value) {
    return
  }

  resizeObserver = new ResizeObserver(() => fitImageToWidth())
  resizeObserver.observe(canvasScrollRef.value)
}

function startDrag(target: DragTarget, event: PointerEvent): void {
  event.preventDefault()
  activeTarget.value = target
}

function drag(event: PointerEvent): void {
  if (!activeTarget.value || !svgRef.value || !store.sheet) {
    return
  }

  const rect = svgRef.value.getBoundingClientRect()
  const imageX = ((event.clientX - rect.left) / rect.width) * store.sheet.width
  const imageY = ((event.clientY - rect.top) / rect.height) * store.sheet.height

  store.moveEdge(activeTarget.value, activeTarget.value.axis === 'x' ? imageX : imageY)
}

async function stopDrag(): Promise<void> {
  if (!activeTarget.value) {
    return
  }

  activeTarget.value = undefined
  await store.refreshPreviews()
}

function clampRelativeZoom(value: number): number {
  return Math.min(Math.max(value, MIN_RELATIVE_ZOOM), MAX_RELATIVE_ZOOM)
}
</script>

<template>
  <section class="panel editor-panel">
    <div class="editor-toolbar">
      <div>
        <p class="eyebrow">Step 3</p>
        <h2>调整切割线</h2>
      </div>
      <label>
        缩放
        <input
          v-model.number="relativeZoom"
          :min="MIN_RELATIVE_ZOOM"
          :max="MAX_RELATIVE_ZOOM"
          step="0.05"
          type="range"
          @change="relativeZoom = clampRelativeZoom(relativeZoom)"
        />
        <span>{{ Math.round(relativeZoom * 100) }}%</span>
      </label>
    </div>

    <div v-if="store.sheet" ref="canvasScrollRef" class="canvas-scroll">
      <div
        class="canvas-stage"
        :style="{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }"
      >
        <canvas ref="canvasRef" />
        <svg
          ref="svgRef"
          class="overlay"
          :viewBox="`0 0 ${store.sheet.width} ${store.sheet.height}`"
          @pointermove="drag"
          @pointerleave="stopDrag"
          @pointerup="stopDrag"
        >
          <rect
            v-for="frame in store.frames"
            :key="frame.id"
            class="frame-rect"
            :x="frame.x"
            :y="frame.y"
            :width="frame.width"
            :height="frame.height"
          />
          <line
            v-for="line in overlayLines"
            :key="line.id"
            class="guide-hit"
            :class="line.axis"
            :x1="line.x1"
            :y1="line.y1"
            :x2="line.x2"
            :y2="line.y2"
            @pointerdown="startDrag(line.target, $event)"
          >
            <title>{{ line.label }}</title>
          </line>
          <line
            v-for="line in overlayLines"
            :key="`${line.id}-visible`"
            class="guide-line"
            :class="line.axis"
            :x1="line.x1"
            :y1="line.y1"
            :x2="line.x2"
            :y2="line.y2"
          />
        </svg>
      </div>
    </div>

    <div v-else class="empty-state">导入图片后即可在这里拖动调整行间距、列间距和帧尺寸。</div>
  </section>
</template>
