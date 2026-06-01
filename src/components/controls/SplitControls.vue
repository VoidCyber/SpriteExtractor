<script setup lang="ts">
import { useSpriteProjectStore } from '../../stores/spriteProject'
import type { SplitMode } from '../../types/sprite'

const store = useSpriteProjectStore()

async function updateRows(event: Event): Promise<void> {
  await store.updateGridOptions({ rows: Number((event.target as HTMLInputElement).value) })
}

async function updateColumns(event: Event): Promise<void> {
  await store.updateGridOptions({ columns: Number((event.target as HTMLInputElement).value) })
}

async function updateMode(nextMode: SplitMode): Promise<void> {
  await store.updateGridOptions({ mode: nextMode })
}
</script>

<template>
  <section class="panel controls">
    <div>
      <p class="eyebrow">Step 2</p>
      <h2>分割方式</h2>
    </div>

    <div class="mode-toggle" role="radiogroup" aria-label="分割方式">
      <button :class="{ active: store.mode === 'row' }" type="button" @click="updateMode('row')">
        按行分割
      </button>
      <button
        :class="{ active: store.mode === 'column' }"
        type="button"
        @click="updateMode('column')"
      >
        按列分割
      </button>
    </div>

    <div class="field-grid">
      <label>
        行数
        <input min="1" max="64" type="number" :value="store.rows" @change="updateRows" />
      </label>
      <label>
        列数
        <input min="1" max="64" type="number" :value="store.columns" @change="updateColumns" />
      </label>
    </div>

    <div class="button-row">
      <button type="button" :disabled="!store.sheet" @click="store.resetGrid()">重置均分</button>
      <button type="button" :disabled="!store.sheet" @click="store.refreshPreviews()">
        刷新预览
      </button>
    </div>

    <p class="hint">
      {{
        store.mode === 'row'
          ? '先拖动水平边界调整每行，再拖动每行内的竖向边界。'
          : '先拖动竖向边界调整每列，再拖动每列内的水平边界。'
      }}
    </p>
  </section>
</template>
