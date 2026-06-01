<script setup lang="ts">
import { saveBlob } from '../../adapters/webDownload'
import { useSpriteProjectStore } from '../../stores/spriteProject'

const store = useSpriteProjectStore()

async function exportZip(): Promise<void> {
  const blob = await store.exportSelectedFrames()

  if (blob) {
    const suffix = store.removeBackground
      ? store.trimTransparent
        ? 'transparent-trimmed-frames'
        : 'transparent-frames'
      : 'frames'
    await saveBlob(blob, `${store.sheet?.name ?? 'sprite'}-${suffix}.zip`)
  }
}
</script>

<template>
  <section class="panel export-panel">
    <div>
      <p class="eyebrow">Step 5</p>
      <h2>导出</h2>
    </div>

    <div class="export-summary" aria-label="导出概览">
      <span>
        <strong>{{ store.selectedFrames.length }}</strong>
        <small>选中帧</small>
      </span>
      <span>
        <strong>{{ store.frames.length }}</strong>
        <small>总帧数</small>
      </span>
      <span>
        <strong>PNG</strong>
        <small>ZIP 打包</small>
      </span>
    </div>

    <label class="option-card">
      <input
        type="checkbox"
        :checked="store.removeBackground"
        @change="store.setRemoveBackground(($event.target as HTMLInputElement).checked)"
      />
      <span>
        <strong>去除图片背景</strong>
        <small>使用每一帧左上角颜色作为背景色，预览和导出 PNG 都会变为透明。</small>
      </span>
    </label>

    <label class="option-card" :class="{ disabled: !store.removeBackground }">
      <input
        type="checkbox"
        :disabled="!store.removeBackground"
        :checked="store.trimTransparent"
        @change="store.setTrimTransparent(($event.target as HTMLInputElement).checked)"
      />
      <span>
        <strong>自动移除多余透明区域</strong>
        <small>仅在去除背景后可用，会按非透明像素的外接矩形裁掉四周空白。</small>
      </span>
    </label>

    <button
      class="primary"
      type="button"
      :disabled="!store.canExport || store.isExporting"
      @click="exportZip"
    >
      {{ store.isExporting ? '正在打包...' : '导出 PNG 压缩包' }}
    </button>
  </section>
</template>
