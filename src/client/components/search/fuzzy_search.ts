/**
 * A single searchable entry: free-form text plus an optional list of
 * short tags/keywords that should also be matchable even if they don't
 * literally appear in `text`.
 */
export interface SearchData {
  text: string;
  tags: string[];
}

/**
 * A single match produced by {@link fuzzySearch}.
 */
export interface SearchResult {
  /** Index of the matching entry within the original `data` array. */
  index: number;
  /**
   * Character indices within `data[index].text` that matched the query,
   * in order - useful for highlighting. Empty if the entry matched via
   * a tag rather than via its `text`.
   */
  positions: number[];
}

/**
 * Case-insensitive, order-preserving subsequence match: every character
 * in `query` must appear in `target`, in the same relative order, gaps
 * allowed - the same style used by fzf or VS Code's command palette.
 * E.g. `"anima"` matches `"animals"`, and `"this be"` matches
 * `"...this could be..."` even with `"could "` in between.
 *
 * @param query - The (non-empty) search query.
 * @param target - The string to search within.
 * @returns Matched character indices in `target`, in order - or `null` if no full match exists.
 */
function subsequenceMatch(query: string, target: string): number[] | null {
  const lowerQuery = query.toLowerCase();
  const lowerTarget = target.toLowerCase();
  const positions: number[] = [];

  let searchFrom = 0;
  for (const char of lowerQuery) {
    const foundAt = lowerTarget.indexOf(char, searchFrom);
    if (foundAt === -1) return null;
    positions.push(foundAt);
    searchFrom = foundAt + 1;
  }

  return positions;
}

/**
 * Runs a fuzzy (subsequence) search across a list of entries. An entry
 * matches if the query matches its `text`, or any one of its `tags` -
 * so a tag like `"animals"` can make an entry findable even if the
 * query never appears in its `text`.
 *
 * @param data - The searchable entries.
 * @param query - The raw, as-typed search query. Empty/whitespace-only
 *        matches nothing - "no search active", not "match everything".
 *        Callers wanting to show all entries on empty query should
 *        special-case that themselves.
 * @returns One {@link SearchResult} per matching entry, in `data` order.
 */
export function fuzzySearch(data: SearchData[], query: string): SearchResult[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const results: SearchResult[] = [];

  data.forEach((entry, index) => {
    const textMatch = subsequenceMatch(trimmedQuery, entry.text);
    if (textMatch) {
      results.push({ index, positions: textMatch });
      return;
    }

    const matchesATag = entry.tags.some((tag) => subsequenceMatch(trimmedQuery, tag) !== null);
    if (matchesATag) {
      results.push({ index, positions: [] });
    }
  });

  return results;
}
