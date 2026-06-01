<script setup lang="ts">
import { ref } from 'vue'
import { useSpriteProjectStore } from '../../stores/spriteProject'
import type { FrameItem } from '../../types/sprite'

const store = useSpriteProjectStore()
const enlargedFrame = ref<FrameItem>()

function openPreview(frame: FrameItem): void {
  if (frame.previewUrl) {
    enlargedFrame.value = frame
  }
}

function closePreview(): void {
  enlargedFrame.value = undefined
}
</script>

<template>
  <section class="panel preview-panel">
    <div class="preview-header">
      <div>
        <p class="eyebrow">Step 4</p>
        <h2>预览与命名</h2>
      </div>
      <div class="button-row">
        <button type="button" :disabled="store.frames.length === 0" @click="store.selectAll(true)">
          全选
        </button>
        <button
          type="button"
          :disabled="store.frames.length === 0"
          @click="store.invertSelection()"
        >
          反选
        </button>
      </div>
    </div>

    <div v-if="store.frames.length" class="frame-grid">
      <article
        v-for="frame in store.frames"
        :key="frame.id"
        class="frame-card"
        :class="{ disabled: !frame.selected }"
      >
        <label class="frame-toggle">
          <input
            type="checkbox"
            :checked="frame.selected"
            @change="store.toggleFrame(frame.id, ($event.target as HTMLInputElement).checked)"
          />
          <span>#{{ frame.index + 1 }}</span>
        </label>
        <button
          class="thumb"
          type="button"
          :disabled="!frame.previewUrl"
          :aria-label="`放大查看 ${frame.name}`"
          @click="openPreview(frame)"
        >
          <img v-if="frame.previewUrl" :src="frame.previewUrl" :alt="frame.name" />
        </button>
        <input
          class="name-input"
          :value="frame.name"
          aria-label="帧名称"
          @input="store.renameFrame(frame.id, ($event.target as HTMLInputElement).value)"
        />
        <small>{{ frame.width }} x {{ frame.height }}</small>
      </article>
    </div>

    <div v-else class="empty-state">暂无帧预览。</div>

    <Teleport to="body">
      <div
        v-if="enlargedFrame"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        :aria-label="`放大查看 ${enlargedFrame.name}`"
        @click.self="closePreview"
      >
        <div class="lightbox-card">
          <div class="lightbox-header">
            <div>
              <strong>{{ enlargedFrame.name }}</strong>
              <small>{{ enlargedFrame.width }} x {{ enlargedFrame.height }}</small>
            </div>
            <button type="button" @click="closePreview">关闭</button>
          </div>
          <div class="lightbox-stage">
            <img :src="enlargedFrame.previewUrl" :alt="enlargedFrame.name" />
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
