/**
 * Resolve figma:asset references to actual file paths at runtime.
 *
 * At build time, Vite resolves `import x from "figma:asset/..."` via the custom plugin.
 * But when figma:asset strings come from the database (KV store) at runtime,
 * the browser can't resolve the `figma:asset` URL scheme.
 *
 * This module uses Vite's glob import to build a map of all asset filenames → resolved URLs,
 * so we can resolve figma:asset references at runtime in both dev and production.
 */

// Eagerly import all PNG assets — Vite resolves these to hashed URLs in production
const assetModules: Record<string, string> = import.meta.glob(
  "/src/assets/*.png",
  { eager: true, import: "default", query: "?url" }
) as any;

// Build a lookup: "hash.png" → resolved URL
const assetMap: Record<string, string> = {};
for (const [path, url] of Object.entries(assetModules)) {
  const filename = path.split("/").pop();
  if (filename) assetMap[filename] = url;
}

/**
 * Resolve a potential figma:asset reference or pass through normal URLs.
 * @param ref - A string like "figma:asset/abc123.png" or "https://..."
 * @returns The resolved asset URL
 */
export function resolveAsset(ref: string | undefined | null): string {
  if (!ref) return "";
  if (!ref.startsWith("figma:asset/")) return ref; // Already a normal URL
  const filename = ref.slice("figma:asset/".length);
  return assetMap[filename] || ref;
}
