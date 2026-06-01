const HONOR_IMAGE_SIZE = 300;

function parseSvgNumber(value: string | undefined) {
  if (!value) return null;
  const matched = value.trim().match(/^([\d.]+)(px)?$/i);
  if (!matched) return null;
  const numeric = Number(matched[1]);
  return Number.isFinite(numeric) ? Math.round(numeric) : null;
}

function readSvgDimensions(text: string) {
  const width = parseSvgNumber(text.match(/\bwidth=["']([^"']+)["']/i)?.[1]);
  const height = parseSvgNumber(text.match(/\bheight=["']([^"']+)["']/i)?.[1]);
  if (width && height) {
    return { width, height };
  }
  const viewBox = text.match(/\bviewBox=["']([^"']+)["']/i)?.[1];
  if (!viewBox) return null;
  const parts = viewBox
    .trim()
    .split(/[\s,]+/)
    .map((item) => Number(item));
  if (parts.length !== 4 || parts.some((item) => !Number.isFinite(item))) {
    return null;
  }
  return {
    width: Math.round(parts[2]),
    height: Math.round(parts[3]),
  };
}

export async function validateHonorImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('仅支持上传图片文件');
  }

  if (file.type === 'image/svg+xml') {
    const text = await file.text();
    const dimensions = readSvgDimensions(text);
    if (!dimensions) {
      throw new Error('无法读取 SVG 图片尺寸');
    }
    if (dimensions.width !== HONOR_IMAGE_SIZE || dimensions.height !== HONOR_IMAGE_SIZE) {
      throw new Error(
        `勋章图片尺寸必须为 ${HONOR_IMAGE_SIZE}×${HONOR_IMAGE_SIZE} 像素（当前 ${dimensions.width}×${dimensions.height}）`,
      );
    }
    return dimensions;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      };
      image.onerror = () => reject(new Error('图片读取失败，请换一张重试'));
      image.src = objectUrl;
    });
    if (dimensions.width !== HONOR_IMAGE_SIZE || dimensions.height !== HONOR_IMAGE_SIZE) {
      throw new Error(
        `勋章图片尺寸必须为 ${HONOR_IMAGE_SIZE}×${HONOR_IMAGE_SIZE} 像素（当前 ${dimensions.width}×${dimensions.height}）`,
      );
    }
    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
