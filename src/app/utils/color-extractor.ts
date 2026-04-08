interface RGB {
  r: number
  g: number
  b: number
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

function medianCut(pixels: RGB[], depth: number): RGB[] {
  if (depth === 0 || pixels.length === 0) {
    if (pixels.length === 0) return []
    const avg: RGB = {
      r: Math.round(pixels.reduce((s, p) => s + p.r, 0) / pixels.length),
      g: Math.round(pixels.reduce((s, p) => s + p.g, 0) / pixels.length),
      b: Math.round(pixels.reduce((s, p) => s + p.b, 0) / pixels.length),
    }
    return [avg]
  }

  const ranges = {
    r: Math.max(...pixels.map(p => p.r)) - Math.min(...pixels.map(p => p.r)),
    g: Math.max(...pixels.map(p => p.g)) - Math.min(...pixels.map(p => p.g)),
    b: Math.max(...pixels.map(p => p.b)) - Math.min(...pixels.map(p => p.b)),
  }

  const channel = ranges.r >= ranges.g && ranges.r >= ranges.b ? 'r' : ranges.g >= ranges.b ? 'g' : 'b'
  pixels.sort((a, b) => a[channel] - b[channel])

  const mid = Math.floor(pixels.length / 2)
  return [
    ...medianCut(pixels.slice(0, mid), depth - 1),
    ...medianCut(pixels.slice(mid), depth - 1),
  ]
}

export async function extractDominantColors(imageUrl: string, count: number = 5): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 50
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve([])
        return
      }

      ctx.drawImage(img, 0, 0, size, size)

      try {
        const imageData = ctx.getImageData(0, 0, size, size)
        const pixels: RGB[] = []

        for (let i = 0; i < imageData.data.length; i += 4) {
          pixels.push({
            r: imageData.data[i],
            g: imageData.data[i + 1],
            b: imageData.data[i + 2],
          })
        }

        // depth of 3 gives 8 buckets, we take the top `count`
        const palette = medianCut(pixels, 3)

        // Deduplicate similar colors
        const unique: RGB[] = []
        for (const color of palette) {
          if (!unique.some(u => colorDistance(u, color) < 30)) {
            unique.push(color)
          }
        }

        resolve(unique.slice(0, count).map(c => rgbToHex(c.r, c.g, c.b)))
      } catch {
        // CORS or other canvas error
        resolve([])
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}
