import sharp from "sharp";
import { readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// [source, output, targetWidth, quality]
const JOBS = [
  // Hero collage — display ≤540px, ship 1200px for retina
  ["src/assets/607f6408c4c8fd9005fe7498e2284a7b2995acda.png", "src/assets/607f6408c4c8fd9005fe7498e2284a7b2995acda.webp", 1200, 78],
  ["src/assets/561c829472a0cac14a59bfb33e444dc4e0ed8350.png", "src/assets/561c829472a0cac14a59bfb33e444dc4e0ed8350.webp", 1200, 78],
  ["src/assets/bc9ffe9973654a94a381c863292fc3780b81397b.png", "src/assets/bc9ffe9973654a94a381c863292fc3780b81397b.webp", 1200, 78],
  ["src/assets/51afa0ea316295d8d1d824fcab3b3afbe1092843.png", "src/assets/51afa0ea316295d8d1d824fcab3b3afbe1092843.webp", 1200, 78],

  // Blurred-background images — display ≤1080px, 60px blur destroys detail anyway
  ["public/DSC09723.webp", "public/DSC09723.webp", 1000, 75],
  ["public/r6.webp", "public/r6.webp", 1000, 75],
  ["public/inter2.webp", "public/inter2.webp", 1000, 75],
  ["public/new interor 2.webp", "public/new interor 2.webp", 1000, 75],
  ["public/r1.webp", "public/r1.webp", 1000, 75],
  ["public/r2.webp", "public/r2.webp", 1000, 75],
  ["public/r3.webp", "public/r3.webp", 1000, 75],
  ["public/r4.webp", "public/r4.webp", 1000, 75],
  ["public/r5.webp", "public/r5.webp", 1000, 75],

  // Profile avatars — display 24×24, ship 48×48
  ["public/Profile/unnamed.png", "public/Profile/avatar-1.webp", 48, 85],
  ["public/Profile/unnamed (1).png", "public/Profile/avatar-2.webp", 48, 85],
  ["public/Profile/unnamed (2).png", "public/Profile/avatar-3.webp", 48, 85],
];

let savedBytes = 0;
for (const [src, dst, width, quality] of JOBS) {
  const srcPath = join(root, src);
  const dstPath = join(root, dst);
  if (!existsSync(srcPath)) {
    console.log(`  · skip ${src} (missing)`);
    continue;
  }
  const before = (await stat(srcPath)).size;
  const input = await readFile(srcPath);
  const output = await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
  await writeFile(dstPath, output);
  const after = (await stat(dstPath)).size;
  savedBytes += Math.max(before - after, 0);
  const fmt = (n) => `${(n / 1024).toFixed(0)} KB`.padStart(8);
  console.log(`  ✓ ${src.padEnd(50)} ${fmt(before)} → ${fmt(after)}  (${dst === src ? "overwrote" : "new"})`);
}

console.log(`\n✓ Total saved: ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
