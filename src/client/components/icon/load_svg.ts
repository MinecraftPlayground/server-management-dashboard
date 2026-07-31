import { stripExplicitSize } from './strip_explicit_size.ts';


/**
 * Fetches the raw contents of an SVG file and sanitises it for inline use.
 *
 * @param src URL or path to the `.svg` file.
 * @returns The sanitised SVG markup as a string.
 * @throws {Error} If the request fails or the response is not OK.
 */
export async function loadSvg(src : string): Promise<string> {
  const response = await fetch(src);

  if (!response.ok) {
    throw new Error(`icon-: failed to load "${src}" (${response.status})`);
  }

  return stripExplicitSize(await response.text());
}
