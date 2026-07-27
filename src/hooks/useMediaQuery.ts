import { useState, useEffect } from "react";

/**
 * useMediaQuery - React hook to evaluate a CSS media query.
 * Returns true if the query matches, false otherwise.
 *
 * Example:
 * const isMobile = useMediaQuery('(max-width: 768px)');
 */
export default function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      // Server side rendering fallback
      return;
    }
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    // Set initial value
    setMatches(media.matches);
    media.addEventListener?.("change", listener);
    return () => media.removeEventListener?.("change", listener);
  }, [query]);

  return matches;
}
