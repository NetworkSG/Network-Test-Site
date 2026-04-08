import { useState, useCallback, useRef } from 'react'
import { extractDominantColors } from '@/app/utils/color-extractor'

export function useColorExtractor() {
  const [loading, setLoading] = useState(false)
  const cache = useRef(new Map<string, string[]>())

  const extract = useCallback(async (imageUrl: string): Promise<string[]> => {
    if (cache.current.has(imageUrl)) {
      return cache.current.get(imageUrl)!
    }

    setLoading(true)
    try {
      const colors = await extractDominantColors(imageUrl)
      cache.current.set(imageUrl, colors)
      return colors
    } catch {
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return { extract, loading }
}
