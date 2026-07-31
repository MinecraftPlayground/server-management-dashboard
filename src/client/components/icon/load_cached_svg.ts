import { loadSvg } from './load_svg.ts';


/**
 * Module-level cache of in-flight and completed SVG fetches, keyed by
 * `src`. Shared across every `<icon->` instance on the page so the same
 * icon file is only ever requested once, no matter how many times it's
 * used. This is deliberately kept outside of `Task`, since `Task` only
 * de-duplicates/cancels work per component instance, not across instances.
 */
const svgCache = new Map<string, Promise<string>>();

/**
 * Loads (or reuses a cached load of) the SVG at `src`. On failure, the
 * cache entry is evicted so a later attempt (e.g. after a network fix)
 * can retry instead of the failure being cached forever.
 *
 * @param src The icon path to load.
 * @returns The sanitised SVG markup, or `null` if `src` is empty.
 */
export async function loadCachedSvg(src : string) : Promise<string | null> {
  if (!src) return null;

  let request = svgCache.get(src);
  if (!request) {
    request = loadSvg(src);
    svgCache.set(src, request);
  }

  try {
    return await request;
  } catch (error) {
    svgCache.delete(src);
    throw error;
  }
}
