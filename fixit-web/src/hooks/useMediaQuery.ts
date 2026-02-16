import { useState, useEffect } from 'react'
import { breakpoints } from '../utils/breakpoints'

/**
 * React hook that listens for window resize and returns whether the viewport
 * matches the given breakpoint (min-width query).
 *
 * @param breakpointKey - The breakpoint key to check against
 * @returns true if viewport width >= breakpoint width
 *
 * @example
 * const isDesktop = useMediaQuery('lg') // true on screens >= 1024px
 * const isMobile = !useMediaQuery('md') // true on screens < 768px
 */
export function useMediaQuery(breakpointKey: keyof typeof breakpoints): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const query = `(min-width: ${breakpoints[breakpointKey]})`
    const mediaQuery = window.matchMedia(query)

    // Set initial state
    setMatches(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [breakpointKey])

  return matches
}

/**
 * Convenience hook that returns true on mobile devices (< 768px)
 * @returns true if viewport width < 768px
 */
export function useIsMobile(): boolean {
  return !useMediaQuery('md')
}
