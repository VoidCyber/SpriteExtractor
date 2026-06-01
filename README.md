# Sprite Extractor

一个精灵图切割工具，支持 Web 版和 Tauri 桌面版，面向多行、多列且行间距、列间距不固定的帧精灵图。

## 功能

- 导入本地图片并在浏览器中完成切割，不需要后端服务。
- 支持按行分割和按列分割两种编辑模式。
- 按行分割时，可先调整每行上下边界，再调整每行内各列左右边界。
- 按列分割时，可先调整每列左右边界，再调整每列内各行上下边界。
- 支持缩放查看、重置均分、帧预览、勾选、重命名。
- 可勾选去除图片背景，预览和导出的 PNG 都会使用透明背景。
- 去除背景后可继续勾选自动移除多余透明区域，按非透明像素边界裁掉空白。
- 将选中的帧导出为 PNG 压缩包。
- 桌面版支持通过系统保存对话框将 ZIP 直接保存到本地路径。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Pinia
- Tauri 2
- Canvas / SVG Pointer Events
- JSZip
- Vitest

## 环境要求

- Node.js 20 或更高版本
- npm
- Rust / Cargo，仅桌面版开发和打包需要

安装前端依赖：

```bash
npm install
```

如果需要运行或打包桌面版，请先安装 Rust 工具链：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
. "$HOME/.cargo/env"
```

## 运行

启动 Web 开发服务：

```bash
npm run dev
```

启动 Tauri 桌面开发版：

```bash
npm run desktop:dev
```

## 构建

构建 Web 版静态资源：

```bash
npm run build
```

构建桌面版安装包：

```bash
npm run desktop:build
```

macOS 构建完成后，产物通常位于：

```text
src-tauri/target/release/bundle/macos/Sprite Extractor.app
src-tauri/target/release/bundle/dmg/Sprite Extractor_0.1.0_aarch64.dmg
```

## 使用说明

1. 点击“选择图片”导入精灵图，支持 PNG、JPG、WebP 等常见图片格式。
2. 选择按行分割或按列分割，并设置初始行列数量。
3. 在编辑区拖动切割线，调整每一帧的边界。
4. 在预览区检查切割结果，可勾选、取消勾选或重命名帧。
5. 可按需要开启“去除图片背景”和“自动移除多余透明区域”。
6. 点击“导出 PNG 压缩包”导出选中的帧。

Web 版会触发浏览器下载；桌面版会弹出系统保存对话框，并将 ZIP 写入选择的位置。

## 常用命令

```bash
npm run dev
npm run desktop:dev
npm run type-check
npm run lint
npm run test
npm run build
npm run desktop:build
```

## 项目结构

```text
src/
  adapters/          Web / Tauri 文件保存适配层
  components/        导入、编辑器、预览、导出等 UI 模块
  core/              与 Vue 解耦的切割、图片处理、导出逻辑
  stores/            Pinia 工程状态
  types/             核心类型
src-tauri/
  capabilities/      Tauri 权限配置
  src/               Tauri Rust 入口
  tauri.conf.json    桌面应用配置
```

## 路线图

- 保存和恢复 `.sprite-extractor.json` 工程配置。
- 导出 JSON 元数据、CSS sprites、TexturePacker 兼容格式。
- 自动识别透明区域并生成初始切割线。
- 增加撤销/重做、快捷键、多图批处理。
- 增强桌面版菜单、快捷键、最近文件和自动更新。
