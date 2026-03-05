import levenshtein from 'fast-levenshtein';

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // strip special characters
    .replace(/\s+/g, ' ')        // collapse whitespace
    .trim();
}

export function similarityScore(a: string, b: string): number {
  const normA = normalizeTitle(a);
  const normB = normalizeTitle(b);
  if (!normA || !normB) return 0;
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein.get(normA, normB);
  return 1 - dist / maxLen;
}

export function findBestMatch(
  ytTitle: string,
  fbTitles: string[],
  threshold = 0.80
): { index: number; score: number } | null {
  let bestIndex = -1;
  let bestScore = -1;

  for (let i = 0; i < fbTitles.length; i++) {
    const score = similarityScore(ytTitle, fbTitles[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (bestScore >= threshold) {
    return { index: bestIndex, score: bestScore };
  }
  return null;
}
