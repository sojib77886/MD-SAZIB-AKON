import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPngBuffer(width: number, height: number, r: number, g: number, b: number): Buffer {
  // Uncompressed raw image data: filter byte (0) + width*4 bytes per scanline
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      // Create a nice rounded rect with green-teal gradient and gold center circle
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isInnerCircle = dist < width * 0.32;
      const isBorder = dist >= width * 0.32 && dist < width * 0.35;
      
      if (isInnerCircle) {
        rawData[offset++] = 245; // gold R
        rawData[offset++] = 158; // gold G
        rawData[offset++] = 11;  // gold B
        rawData[offset++] = 255; // Alpha
      } else if (isBorder) {
        rawData[offset++] = 16;  // emerald R
        rawData[offset++] = 185; // emerald G
        rawData[offset++] = 129; // emerald B
        rawData[offset++] = 255;
      } else {
        // Dark slate background
        rawData[offset++] = r;
        rawData[offset++] = g;
        rawData[offset++] = b;
        rawData[offset++] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  function makeChunk(type: string, data: Buffer): Buffer {
    const len = data.length;
    const chunk = Buffer.alloc(4 + 4 + len + 4);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4);
    data.copy(chunk, 8);
    // CRC calculation
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    chunk.writeInt32BE(crc, 8 + len);
    return chunk;
  }

  // Quick CRC32 table
  const crcTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return crc ^ 0xffffffff;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate files
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPngBuffer(180, 180, 15, 23, 42));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPngBuffer(192, 192, 15, 23, 42));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPngBuffer(512, 512, 15, 23, 42));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPngBuffer(512, 512, 15, 23, 42));
console.log('PWA PNG icons generated successfully!');
