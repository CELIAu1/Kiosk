import { deflateSync } from "node:zlib";

/**
 * A tiny PNG encoder, so the seed can generate catalogue imagery without
 * pulling in an image library or shipping binaries into the repository.
 */
function crc32(buffer: Uint8Array): number {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBytes, data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

export type RGB = [number, number, number];

/** Encodes an RGB pixel getter into a PNG buffer. */
export function encodePng(
  width: number,
  height: number,
  pixel: (x: number, y: number) => RGB,
): Buffer {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      const offset = rowStart + 1 + x * 3;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/**
 * A calm studio-style placeholder: a paper background, a soft floor shadow and
 * a single large object silhouette. Enough to read as "a product photo" in a
 * grid without pretending to be one.
 */
export function productPlaceholder(
  seed: number,
  base: RGB,
  width = 600,
  height = 800,
): Buffer {
  const paper: RGB = [244, 242, 236];
  const deep = mix(base, [20, 18, 16], 0.35);
  const light = mix(base, [255, 255, 255], 0.3);

  const cx = width / 2;
  const cy = height * 0.52;
  const rx = width * (0.26 + ((seed % 5) * 0.02));
  const ry = height * (0.24 + ((seed % 3) * 0.03));

  return encodePng(width, height, (x, y) => {
    // Background: a barely-there vertical wash.
    const wash = mix(paper, mix(paper, base, 0.12), y / height);

    // Elliptical object, with a soft light falling from the upper left.
    const nx = (x - cx) / rx;
    const ny = (y - cy) / ry;
    const distance = nx * nx + ny * ny;

    if (distance <= 1) {
      const shade = Math.min(1, Math.max(0, (nx + ny) * 0.5 + 0.5));
      const body = mix(light, deep, shade);
      const edge = Math.min(1, (1 - distance) * 12); // antialias the rim
      return mix(wash, body, edge);
    }

    // Contact shadow under the object.
    const sx = (x - cx) / (rx * 1.15);
    const sy = (y - (cy + ry * 0.94)) / (ry * 0.09);
    const shadow = sx * sx + sy * sy;
    if (shadow < 1) {
      return mix(wash, mix(paper, [30, 28, 24], 0.35), (1 - shadow) * 0.5);
    }

    return wash;
  });
}
