<template>
  <main class="app-shell">
    <header class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Sprite Extractor</p>
        <h1>切割精灵图素材</h1>
        <p>
          为像素动画和 2D 素材整理设计的轻量工作台。导入图片、调整切线、检查帧名，最后一次性导出 PNG 压缩包。
        </p>
      </div>

      <div class="hero-card" aria-label="工作流程">
        <span>Import</span>
        <span>Slice</span>
        <span>Preview</span>
        <span>Export</span>
      </div>
    </header>

    <div class="workspace">
      <aside class="sidebar">
        <ImageImporter />
        <SplitControls />
        <ExportPanel />
      </aside>

      <div class="main-area">
        <SpriteCanvasEditor />
        <FramePreviewPanel />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import ImageImporter from './components/importer/ImageImporter.vue'
import SplitControls from './components/controls/SplitControls.vue'
import SpriteCanvasEditor from './components/editor/SpriteCanvasEditor.vue'
import FramePreviewPanel from './components/preview/FramePreviewPanel.vue'
import ExportPanel from './components/exporter/ExportPanel.vue'
</script>
