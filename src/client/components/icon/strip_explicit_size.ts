/**
 * Removes hard-coded `width`/`height` attributes from an SVG's root
 * `<svg ...>` tag so sizing is controlled entirely via CSS (the icon
 * host's `width`/`height`) rather than whatever the source file happens
 * to specify.
 *
 * @param markup Raw SVG file contents.
 * @returns The same markup with `width`/`height` stripped from the root tag.
 */
export function stripExplicitSize(markup : string) : string {
  return markup.replace(/<svg\b[^>]*>/i, (openTag) =>
    openTag.replace(/\s(?:width|height)="[^"]*"/gi, ''),
  );
}
