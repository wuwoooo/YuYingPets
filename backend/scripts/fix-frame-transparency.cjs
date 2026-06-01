#!/usr/bin/env node
/**
 * 修复边框 PNG 白底不透明问题：将近白色像素转为透明，避免遮挡萌宠。
 */
const { existsSync, readFileSync, writeFileSync, readdirSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { PNG } = require('pngjs');
const { execSync } = require('node:child_process');

const THRESHOLD = 249;
const root = resolve(__dirname, '../public/assets/pet-decorations');
const srcDir = join(root, '1024');
const outDir = join(root, '400');

/** 仅当透明像素占比过低（疑似白底 PNG）时才自动抠图，不再强制指定文件名 */
const FORCE_FIX = new Set();

function needsFix(png) {
  let transparent = 0;
  for (let i = 3; i < png.data.length; i += 4) {
    if (png.data[i] < 16) transparent++;
  }
  return transparent / (png.width * png.height) < 0.05;
}

function keyWhiteToTransparent(png, threshold = THRESHOLD) {
  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      png.data[i + 3] = 0;
    }
  }
  return png;
}

const files = readdirSync(srcDir).filter((name) => name.toLowerCase().endsWith('.png') && name.startsWith('frame_'));
let fixed = 0;

for (const file of files) {
  const inputPath = join(srcDir, file);
  const png = PNG.sync.read(readFileSync(inputPath));
  if (!FORCE_FIX.has(file) && !needsFix(png)) continue;

  keyWhiteToTransparent(png);
  writeFileSync(inputPath, PNG.sync.write(png));
  fixed++;
  console.log(`已修复透明通道: ${file}`);
}

if (fixed > 0 && existsSync(outDir)) {
  for (const file of files) {
    const input = join(srcDir, file);
    const png = PNG.sync.read(readFileSync(input));
    if (!FORCE_FIX.has(file) && !needsFix(png)) continue;
    const output = join(outDir, file);
    execSync(`sips -z 400 400 "${input}" --out "${output}"`, { stdio: 'inherit' });
  }
  console.log(`已重新生成受修复影响的 400px 缩略图`);
}

console.log(fixed ? `完成，共修复 ${fixed} 个边框资源` : '无需修复');
