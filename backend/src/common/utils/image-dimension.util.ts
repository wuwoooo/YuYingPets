const REQUIRED_HONOR_IMAGE_SIZE = 300;

type ImageDimensions = {
  width: number;
  height: number;
};

function readUInt16BE(buffer: Buffer, offset: number) {
  return buffer.readUInt16BE(offset);
}

function readUInt32BE(buffer: Buffer, offset: number) {
  return buffer.readUInt32BE(offset);
}

function readPngDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') {
    return null;
  }
  return {
    width: readUInt32BE(buffer, 16),
    height: readUInt32BE(buffer, 20),
  };
}

function readGifDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 10 || buffer.toString('ascii', 0, 3) !== 'GIF') {
    return null;
  }
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  };
}

function readWebpDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    return null;
  }
  const chunkType = buffer.toString('ascii', 12, 16);
  if (chunkType === 'VP8X' && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (chunkType === 'VP8 ' && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  return null;
}

function readJpegDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      break;
    }
    const segmentLength = readUInt16BE(buffer, offset + 2);
    if (segmentLength < 2) {
      break;
    }
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        height: readUInt16BE(buffer, offset + 5),
        width: readUInt16BE(buffer, offset + 7),
      };
    }
    offset += 2 + segmentLength;
  }
  return null;
}

function parseSvgNumber(value: string | undefined) {
  if (!value) return null;
  const matched = value.trim().match(/^([\d.]+)(px)?$/i);
  if (!matched) return null;
  const numeric = Number(matched[1]);
  return Number.isFinite(numeric) ? Math.round(numeric) : null;
}

function readSvgDimensions(buffer: Buffer): ImageDimensions | null {
  const text = buffer.toString('utf8');
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

export function readImageDimensions(buffer: Buffer, mimeType: string): ImageDimensions | null {
  const normalizedMime = (mimeType || '').toLowerCase();
  if (normalizedMime.includes('svg')) {
    return readSvgDimensions(buffer);
  }
  if (normalizedMime.includes('png')) {
    return readPngDimensions(buffer);
  }
  if (normalizedMime.includes('gif')) {
    return readGifDimensions(buffer);
  }
  if (normalizedMime.includes('webp')) {
    return readWebpDimensions(buffer);
  }
  if (normalizedMime.includes('jpeg') || normalizedMime.includes('jpg')) {
    return readJpegDimensions(buffer);
  }

  return (
    readPngDimensions(buffer) ||
    readJpegDimensions(buffer) ||
    readWebpDimensions(buffer) ||
    readGifDimensions(buffer) ||
    readSvgDimensions(buffer)
  );
}

export function assertHonorImageDimensions(buffer: Buffer, mimeType: string) {
  const dimensions = readImageDimensions(buffer, mimeType);
  if (!dimensions) {
    throw new Error('无法识别图片尺寸，请上传 PNG、JPG、WebP 或 SVG');
  }
  if (
    dimensions.width !== REQUIRED_HONOR_IMAGE_SIZE ||
    dimensions.height !== REQUIRED_HONOR_IMAGE_SIZE
  ) {
    throw new Error(
      `勋章图片尺寸必须为 ${REQUIRED_HONOR_IMAGE_SIZE}×${REQUIRED_HONOR_IMAGE_SIZE} 像素（当前 ${dimensions.width}×${dimensions.height}）`,
    );
  }
}
