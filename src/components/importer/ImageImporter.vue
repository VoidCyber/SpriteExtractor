<script setup lang="ts">
import { useSpriteProjectStore } from '../../stores/spriteProject'

const store = useSpriteProjectStore()

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    await store.importImage(file)
  }

  input.value = ''
}
</script>

<template>
  <section class="panel importer">
    <div>
      <p class="eyebrow">Step 1</p>
      <h2>导入精灵图</h2>
      <p class="muted">支持 PNG、JPG、WebP 等浏览器可读取的图片。</p>
    </div>

    <label class="file-drop">
      <input type="file" accept="image/*" @change="handleFileChange" />
      <span>{{ store.isLoading ? '正在读取图片...' : '选择图片' }}</span>
    </label>

    <p v-if="store.errorMessage" class="error">{{ store.errorMessage }}</p>

    <dl v-if="store.sheet" class="sheet-meta">
      <div>
        <dt>文件</dt>
        <dd>{{ store.sheet.name }}</dd>
      </div>
      <div>
        <dt>尺寸</dt>
        <dd>{{ store.sheet.width }} x {{ store.sheet.height }}</dd>
      </div>
      <div>
        <dt>帧数</dt>
        <dd>{{ store.frames.length }}</dd>
      </div>
    </dl>
  </section>
</template>
