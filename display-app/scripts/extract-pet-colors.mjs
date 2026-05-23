import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 路径配置
const PETS_DIR = path.resolve(__dirname, '../../backend/public/assets/pets/400');
const OUTPUT_FILE = path.resolve(__dirname, '../web/public/display/scripts/pet-colors.js');

// RGB 转 HSL
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

async function extractColors() {
  const files = fs.readdirSync(PETS_DIR).filter(f => f.endsWith('.png'));
  const colorMap = {};

  console.log(`Found ${files.length} pet images. Extracting colors...`);

  for (const file of files) {
    // 解析出宠物 ID，例如 "051_星尘鸮_1.png" -> "051"
    const match = file.match(/^(\d{3})_/);
    if (!match) continue;
    const petId = match[1];
    
    // 如果一个宠物有多个 stage，优先取 _1.png 的颜色，如果有更高级别的可以不覆盖，或者取平均。
    // 这里我们只取每个宠物的基色一次即可。
    if (colorMap[petId]) continue;

    const imgPath = path.join(PETS_DIR, file);
    try {
      // 缩小图片到 50x50 进行分析以加快速度
      const { data, info } = await sharp(imgPath)
        .resize(50, 50, { fit: 'inside' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      let rSum = 0, gSum = 0, bSum = 0, count = 0;

      // 遍历像素，忽略透明度过低的像素
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a > 50) { // 只统计不透明部分
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // 忽略接近纯黑或纯白的像素（描边或高光）
          if ((r > 240 && g > 240 && b > 240) || (r < 20 && g < 20 && b < 20)) {
            continue;
          }

          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
      }

      if (count > 0) {
        const rAvg = Math.round(rSum / count);
        const gAvg = Math.round(gSum / count);
        const bAvg = Math.round(bSum / count);
        const hsl = rgbToHsl(rAvg, gAvg, bAvg);
        colorMap[petId] = hsl;
        console.log(`[${petId}] Extracted: RGB(${rAvg}, ${gAvg}, ${bAvg}) -> HSL(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
      } else {
        console.warn(`[${petId}] No opaque pixels found in ${file}.`);
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }

  // 生成 JS 文件
  const jsContent = `/**
 * 该文件由 scripts/extract-pet-colors.mjs 自动生成。
 * 包含了所有萌宠图片提取出的主色调（HSL 格式）。
 * 用于渲染动画时的专属粒子色彩。
 */
window.PET_THEME_COLORS = ${JSON.stringify(colorMap, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf-8');
  console.log(`\nSuccessfully wrote ${Object.keys(colorMap).length} colors to ${OUTPUT_FILE}`);
}

extractColors();
