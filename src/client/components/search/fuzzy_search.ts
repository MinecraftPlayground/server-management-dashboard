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
 * in `query` must appear in `target`, in the same relative order, with
 * any number of other characters allowed in between. This is the same
 * style of "fuzzy" matching used by tools like fzf or VS Code's command
 * palette - e.g. `"anima"` matches `"animals"`, and `"this be"` matches
 * `"...this could be..."` even though `"could "` sits in between.
 *
 * @param query - The (non-empty) search query.
 * @param target - The string to search within.
 * @returns The matched character indices in `target`, one per query
 *          character in order - or `null` if no full match exists.
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
 * Runs a fuzzy (order-preserving subsequence) search across a list of
 * entries. An entry matches if the query subsequence-matches its `text`,
 * *or* any one of its `tags` - so a short tag like `"animals"` can make
 * an entry findable even by a query that never literally appears in its
 * `text`.
 *
 * @param data - The searchable entries.
 * @param query - The raw, as-typed search query. An empty/whitespace-only
 *        query matches nothing - this represents "no search active"
 *        rather than "match everything". Callers that want to show all
 *        entries when the query is empty should special-case that
 *        themselves before calling this function.
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
