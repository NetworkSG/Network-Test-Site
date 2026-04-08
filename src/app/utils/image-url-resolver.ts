// Resolves URLs to direct image URLs.
// Instagram -> oEmbed API to get thumbnail
// Pinterest/other page URLs -> extracts og:image via CORS proxy
// Direct image URLs -> returned as-is or proxied if hotlink-blocked

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.bmp']

function isDirectImageUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    return IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext))
  } catch {
    return false
  }
}

function isKnownSafeCdn(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    return hostname.includes('images.unsplash.com') || hostname.includes('img.freepik.com')
  } catch {
    return false
  }
}

function needsProxy(url: string): boolean {
  const blockedHosts = ['scontent', 'cdninstagram.com', 'fbcdn.net', 'pinimg.com', 'pbs.twimg.com']
  try {
    const hostname = new URL(url).hostname
    return blockedHosts.some(h => hostname.includes(h))
  } catch {
    return false
  }
}

function proxyImageUrl(url: string): string {
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=800&q=80`
}

function isInstagramUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    return hostname.includes('instagram.com')
  } catch {
    return false
  }
}

function isPinterestUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    return hostname.includes('pinterest.com') || hostname.includes('pin.it')
  } catch {
    return false
  }
}

// Use allorigins proxy to fetch page HTML and extract og:image
async function extractOgImage(pageUrl: string): Promise<string | null> {
  try {
    const corsProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(pageUrl)}`
    const res = await fetch(corsProxy, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null

    const html = await res.text()

    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
    if (ogMatch?.[1]) return ogMatch[1]

    const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)
    if (twMatch?.[1]) return twMatch[1]

    // Try finding any large image src in the HTML
    const imgMatch = html.match(/<img[^>]*src=["'](https:\/\/[^"']*(?:scontent|pinimg|twimg)[^"']+)["']/i)
    if (imgMatch?.[1]) return imgMatch[1]

    return null
  } catch {
    return null
  }
}

export async function resolveImageUrl(url: string): Promise<{ imageUrl: string; error?: string }> {
  const trimmed = url.trim()
  if (!trimmed) return { imageUrl: '', error: 'URL is empty' }

  // Direct image URL on a safe CDN — use as-is
  if ((isDirectImageUrl(trimmed) || isKnownSafeCdn(trimmed)) && !needsProxy(trimmed)) {
    return { imageUrl: trimmed }
  }

  // Direct image URL on a blocked CDN — proxy it
  if (isDirectImageUrl(trimmed) && needsProxy(trimmed)) {
    return { imageUrl: proxyImageUrl(trimmed) }
  }

  // Instagram — not supported
  if (isInstagramUrl(trimmed)) {
    return { imageUrl: '', error: 'Instagram links are not supported. Save the image to your device first, then upload it using "Upload from device".' }
  }

  // Pinterest page URL — extract og:image
  if (isPinterestUrl(trimmed)) {
    const ogImage = await extractOgImage(trimmed)
    if (ogImage) {
      return { imageUrl: needsProxy(ogImage) ? proxyImageUrl(ogImage) : ogImage }
    }
    return { imageUrl: '', error: 'Could not load this Pinterest image. Try right-clicking the image and copying the image address directly.' }
  }

  // Generic page URL — try og:image extraction
  const ogImage = await extractOgImage(trimmed)
  if (ogImage) {
    return { imageUrl: needsProxy(ogImage) ? proxyImageUrl(ogImage) : ogImage }
  }

  // URL that looks like it could be a blocked image
  if (needsProxy(trimmed)) {
    return { imageUrl: proxyImageUrl(trimmed) }
  }

  // Last resort — try the URL directly
  return { imageUrl: trimmed, error: 'Could not verify this image. It may not display correctly.' }
}
