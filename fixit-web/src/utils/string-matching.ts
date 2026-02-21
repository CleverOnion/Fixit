// utils/string-matching.ts
// Multi-tier subject matching utility for AI auto-detection

/**
 * Finds the best matching subject from a list of existing subjects
 * Uses a three-tier strategy: exact → partial → fuzzy matching
 *
 * @param detectedSubject - The subject detected by AI
 * @param existingSubjects - List of existing subjects to match against
 * @returns The matched subject name, or null if no match found
 */
export function findMatchingSubject(
  detectedSubject: string | null | undefined,
  existingSubjects: ReadonlyArray<string>,
): string | null {
  // Return null if no detected subject
  if (!detectedSubject?.trim()) {
    return null;
  }

  const trimmed = detectedSubject.trim();

  // Empty check after trim
  if (!trimmed) {
    return null;
  }

  // Tier 1: Exact match (case-insensitive)
  const exactMatch = matchesExact(trimmed, existingSubjects);
  if (exactMatch) {
    return exactMatch;
  }

  // Tier 2: Partial match (substring, case-insensitive)
  const partialMatch = matchesPartial(trimmed, existingSubjects);
  if (partialMatch) {
    return partialMatch;
  }

  // Tier 3: Fuzzy match (similarity-based)
  const fuzzyMatch = matchesFuzzy(trimmed, existingSubjects);
  if (fuzzyMatch) {
    return fuzzyMatch;
  }

  return null;
}

/**
 * Tier 1: Exact match (case-insensitive)
 * Returns the original subject name from the list if matched
 */
function matchesExact(
  detected: string,
  existingSubjects: ReadonlyArray<string>,
): string | null {
  const lowerDetected = detected.toLowerCase();

  for (const subject of existingSubjects) {
    if (subject.toLowerCase() === lowerDetected) {
      return subject; // Return original casing from existing subjects
    }
  }

  return null;
}

/**
 * Tier 2: Partial match (substring, case-insensitive)
 * Checks if detected subject is a substring of existing subject or vice versa
 * Only returns match if similarity is above threshold (0.6)
 */
function matchesPartial(
  detected: string,
  existingSubjects: ReadonlyArray<string>,
): string | null {
  const lowerDetected = detected.toLowerCase();

  for (const subject of existingSubjects) {
    const lowerSubject = subject.toLowerCase();

    // Check if detected is substring of existing
    if (lowerSubject.includes(lowerDetected) && lowerDetected.length >= 2) {
      const similarity = lowerDetected.length / lowerSubject.length;
      if (similarity >= 0.4) {
        return subject;
      }
    }

    // Check if existing is substring of detected
    if (lowerDetected.includes(lowerSubject) && lowerSubject.length >= 2) {
      const similarity = lowerSubject.length / lowerDetected.length;
      if (similarity >= 0.4) {
        return subject;
      }
    }
  }

  return null;
}

/**
 * Tier 3: Fuzzy match using Jaccard-like similarity
 * Returns match if similarity is above threshold (0.5)
 */
function matchesFuzzy(
  detected: string,
  existingSubjects: ReadonlyArray<string>,
): string | null {
  let bestMatch: string | null = null;
  let bestSimilarity = 0;

  for (const subject of existingSubjects) {
    const similarity = calculateSimilarity(detected, subject);
    if (similarity > bestSimilarity && similarity >= 0.5) {
      bestSimilarity = similarity;
      bestMatch = subject;
    }
  }

  return bestMatch;
}

/**
 * Calculates Jaccard-like similarity between two strings
 * Based on character bigram overlap
 */
function calculateSimilarity(str1: string, str2: string): number {
  const set1 = createBigrams(str1.toLowerCase());
  const set2 = createBigrams(str2.toLowerCase());

  if (set1.size === 0 || set2.size === 0) {
    return 0;
  }

  // Calculate intersection
  const intersection = new Set<string>();
  for (const item of set1) {
    if (set2.has(item)) {
      intersection.add(item);
    }
  }

  // Calculate union
  const union = new Set([...set1, ...set2]);

  // Jaccard similarity = |intersection| / |union|
  return intersection.size / union.size;
}

/**
 * Creates a set of character bigrams from a string
 * A bigram is a pair of adjacent characters
 * Example: "math" → ["ma", "at", "th"]
 */
function createBigrams(str: string): Set<string> {
  const bigrams = new Set<string>();

  for (let i = 0; i < str.length - 1; i++) {
    const bigram = str.slice(i, i + 2);
    // Filter out whitespace-only bigrams
    if (bigram.trim().length > 0) {
      bigrams.add(bigram);
    }
  }

  return bigrams;
}

/**
 * Normalizes common subject variations
 * Helps with handling synonyms and abbreviations
 */
export function normalizeSubjectName(subject: string): string {
  const normalized = subject.trim().toLowerCase();

  // Common mappings
  const mappings: Record<string, string> = {
    '数学': '数学',
    '高等数学': '数学',
    '高数': '数学',
    '物理': '物理',
    '物理学': '物理',
    '化学': '化学',
    '生物学': '生物',
    '历史学': '历史',
    '地理学': '地理',
    '政治': '政治',
    '语文': '语文',
    '英语': '英语',
    '英文': '英语',
  };

  return mappings[normalized] || subject.trim();
}
