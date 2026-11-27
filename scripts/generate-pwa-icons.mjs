import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function inRoundedRect(x, y, left, top, right, bottom, radius) {
  if (x >= left + radius && x <= right - radius && y >= top && y <= bottom) return true;
  if (y >= top + radius && y <= bottom - radius && x >= left && x <= right) return true;
  const corners = [
    [left + radius, top + radius],
    [right - radius, top + radius],
    [left + radius, bottom - radius],
    [right - radius, bottom - radius],
  ];
  return corners.some(([cx, cy]) => {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= radius * radius;
  });
}

function paint(x, y, size) {
  const bg = [5, 5, 7, 255];
  const surface = [28, 28, 30, 255];
  const hairline = [70, 70, 74, 255];
  const accent = [76, 141, 255, 255];
  const muted = [142, 142, 147, 255];

  const inset = size * 0.14;
  const radius = size * 0.22;
  const left = inset;
  const top = inset;
  const right = size - inset;
  const bottom = size - inset;
  const border = Math.max(1, size * 0.012);

  if (
    inRoundedRect(x, y, left, top, right, bottom, radius) &&
    !inRoundedRect(
      x,
      y,
      left + border,
      top + border,
      right - border,
      bottom - border,
      Math.max(0, radius - border)
    )
  ) {
    return hairline;
  }

  if (inRoundedRect(x, y, left, top, right, bottom, radius)) {
    const cx = size / 2;
    const dotsY = size * 0.4;
    const spacing = size * 0.12;
    const dotR = size * 0.032;
    const centers = [cx - spacing, cx, cx + spacing];
    for (const dx of centers) {
      const dist = Math.hypot(x - dx, y - dotsY);
      if (dist <= dotR) return accent;
    }

    const plateCx = cx;
    const plateCy = size * 0.62;
    const plateRx = size * 0.2;
    const plateRy = size * 0.072;
    const nx = (x - plateCx) / plateRx;
    const ny = (y - plateCy) / plateRy;
    const r2 = nx * nx + ny * ny;
    if (r2 <= 1 && r2 >= 0.58) return muted;

    return surface;
  }

  return bg;
}

function makePng(size) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const p = paint(x, y, size);
      const i = y * stride + 1 + x * 4;
      raw[i] = p[0];
      raw[i + 1] = p[1];
      raw[i + 2] = p[2];
      raw[i + 3] = p[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 32;
  entry[1] = 32;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

const png512 = makePng(512);
const png192 = makePng(192);
const png32 = makePng(32);

writeFileSync(join(root, "public/icon-512.png"), png512);
writeFileSync(join(root, "public/icon-192.png"), png192);
writeFileSync(join(root, "public/favicon.ico"), makeIco(png32));

console.log("Wrote public/icon-512.png, public/icon-192.png, public/favicon.ico");
