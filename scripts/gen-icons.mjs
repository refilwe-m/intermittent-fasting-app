/**
 * Generates placeholder PWA PNG icons with no external dependencies.
 *
 * Produces a solid brand-blue (#2563eb) square with a lighter droplet-ish
 * centre. These are valid PNGs that satisfy the manifest; replace with a
 * designed icon later.
 *
 * Usage: node scripts/gen-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '..', 'public')
const iconsDir = resolve(publicDir, 'icons')
mkdirSync(iconsDir, { recursive: true })

// ── Minimal PNG encoder (RGBA, no filtering) ─────────────────────────────────
function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePng(size, pixelFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // 10,11,12 = 0 (compression, filter, interlace)

  // Raw image data: each row prefixed with filter byte 0
  const rowBytes = size * 4
  const raw = Buffer.alloc((rowBytes + 1) * size)
  for (let y = 0; y < size; y++) {
    const rowStart = y * (rowBytes + 1)
    raw[rowStart] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y, size)
      const px = rowStart + 1 + x * 4
      raw[px] = r
      raw[px + 1] = g
      raw[px + 2] = b
      raw[px + 3] = a
    }
  }

  const idat = deflateSync(raw)
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Brand palette
const BLUE = [37, 99, 235] // #2563eb
const LIGHT = [147, 197, 253] // sky-300-ish

function pixel(x, y, size) {
  const cx = size / 2
  const cy = size / 2
  const dx = x - cx
  const dy = y - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  // Light droplet circle in the centre
  if (dist < size * 0.22) return [...LIGHT, 255]
  return [...BLUE, 255]
}

const targets = [
  { file: resolve(iconsDir, 'icon-192.png'), size: 192 },
  { file: resolve(iconsDir, 'icon-512.png'), size: 512 },
  { file: resolve(publicDir, 'apple-touch-icon.png'), size: 180 },
]

for (const { file, size } of targets) {
  writeFileSync(file, encodePng(size, pixel))
  console.log(`wrote ${file} (${size}x${size})`)
}
