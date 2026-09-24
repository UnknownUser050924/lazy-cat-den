const MAX_BYTES = 2 * 1024 * 1024;
const MIN_EDGE = 48;
const MAX_EDGE = 4096;

export type RasterKind = "png" | "jpeg" | "webp";

function u32(bytes: Uint8Array, offset: number) {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function u16(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

export function detectRaster(bytes: Uint8Array): RasterKind | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

export function rasterSize(bytes: Uint8Array, kind: RasterKind): { width: number; height: number } | null {
  if (kind === "png") {
    if (bytes.length < 24) return null;
    return { width: u32(bytes, 16), height: u32(bytes, 20) };
  }
  if (kind === "webp") {
    if (bytes.length < 30) return null;
    const tag = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (tag === "VP8X" && bytes.length >= 30) {
      const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
      return { width, height };
    }
    if (tag === "VP8 " && bytes.length >= 30) {
      return { width: bytes[26] + ((bytes[27] & 0x3f) << 8), height: bytes[28] + ((bytes[29] & 0x3f) << 8) };
    }
    if (tag === "VP8L" && bytes.length >= 25) {
      const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    return null;
  }
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { height: u16(bytes, offset + 5), width: u16(bytes, offset + 7) };
    }
    const size = u16(bytes, offset + 2);
    if (size < 2) break;
    offset += 2 + size;
  }
  return null;
}

export function inspectAvatar(bytes: Uint8Array) {
  if (bytes.length < 24) throw new Error("这张图太小了");
  if (bytes.length > MAX_BYTES) throw new Error("照片请小于 2MB");
  if (bytes[0] === 0x3c || bytes[1] === 0x3c) throw new Error("请用 JPG、PNG 或 WebP");
  const kind = detectRaster(bytes);
  if (!kind) throw new Error("请用 JPG、PNG 或 WebP，不要上传 SVG 或其他文件");
  const size = rasterSize(bytes, kind);
  if (!size || size.width < MIN_EDGE || size.height < MIN_EDGE) throw new Error("照片太小了");
  if (size.width > MAX_EDGE || size.height > MAX_EDGE) throw new Error("照片边长请小于 4096");
  return { kind, ...size };
}
