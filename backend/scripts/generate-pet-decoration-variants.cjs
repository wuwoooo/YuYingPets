#!/usr/bin/env node
/**
 * 从 pet-decorations/1024 生成 400 缩略图，供列表卡片等场景使用。
 * 使用 pngjs 缩放并保留 RGBA 透明通道（避免部分工具改写 PNG 元数据）。
 */
const { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { PNG } = require('pngjs');

const TARGET = 400;
const root = resolve(__dirname, '../public/assets/pet-decorations');
const srcDir = join(root, '1024');
const outDir = join(root, '400');

if (!existsSync(srcDir)) {
  console.error(`源目录不存在: ${srcDir}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

/** 最近邻缩放，完整保留每像素 alpha */
function resizePngNearest(png, size) {
  const out = new PNG({ width: size, height: size });
  const scaleX = png.width / size;
  const scaleY = png.height / size;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sx = Math.min(png.width - 1, Math.floor(x * scaleX));
      const sy = Math.min(png.height - 1, Math.floor(y * scaleY));
      const si = (sy * png.width + sx) << 2;
      const oi = (y * size + x) << 2;
      out.data[oi] = png.data[si];
      out.data[oi + 1] = png.data[si + 1];
      out.data[oi + 2] = png.data[si + 2];
      out.data[oi + 3] = png.data[si + 3];
    }
  }
  return out;
}

const files = readdirSync(srcDir).filter((name) => name.toLowerCase().endsWith('.png'));
if (files.length === 0) {
  console.error('1024 目录下没有 PNG 文件');
  process.exit(1);
}

for (const file of files) {
  const input = join(srcDir, file);
  const output = join(outDir, file);
  const png = PNG.sync.read(readFileSync(input));
  const resized = resizePngNearest(png, TARGET);
  writeFileSync(output, PNG.sync.write(resized));
  console.log(`${input} -> ${output}`);
}

console.log(`已生成 ${files.length} 张 ${TARGET}px 缩略图 -> ${outDir}`);
