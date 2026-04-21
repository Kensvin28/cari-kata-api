import { InvalidValueError } from "./errors";

// Create a bitmask from a string of characters, where each bit represents the presence of a letter
export function getMaskFromChars(chars: string): number {
  let mask = 0;
  for (const char of chars) {
    const code = char.codePointAt(0) || 0;
    if (code < 97 || code > 122)
      throw new InvalidValueError("Invalid character");
    mask |= 1 << (code - 97);
  }
  return mask;
}

export function processWord(word: string) {
  const norm = normalize(word);
  return {
    word,
    norm,
    len: word.length,
    mask: wordMask(norm),
    simple: isSimple(norm),
  };
}

// Normalize a word by converting to lowercase and removing diacritics
export function normalize(word: string) {
  return String.prototype.normalize
    .call(word.toLowerCase(), "NFD")
    .replaceAll(/[\u0300-\u036f]/g, "");
}

// Create a bitmask for a word, where each bit represents the presence of a letter
export function wordMask(norm: string) {
  let mask = 0;
  for (const char of new Set(norm)) {
    const code = char.codePointAt(0) || 0;
    if (code < 97 || code > 122)
      throw new InvalidValueError("Invalid character"); // Skip non-lowercase letters
    mask |= 1 << (code - 97);
  }
  return mask;
}

export function isSimple(word: string): boolean {
  return !/[.\- ()%,]/.test(word);
}

export function getWordsFromFile(file: string): any[] {
  return file
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0)
    .map(processWord);
}

export function filterWordsByBag(words: string[], bag: string): string[] {
  const availableLetters = getLetterCounts(bag);
  return words.filter((word) => canMakeWord(word, availableLetters));
}

// Helper function to count letter frequencies in a string
function getLetterCounts(str: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const char of str.toLowerCase()) {
    counts[char] = (counts[char] || 0) + 1;
  }
  return counts;
}

// Helper function to check if word can be made from available letters
function canMakeWord(
  word: string,
  availableLetters: Record<string, number>,
): boolean {
  const wordCounts = getLetterCounts(word);

  for (const [letter, count] of Object.entries(wordCounts)) {
    if (!availableLetters[letter] || availableLetters[letter] < count) {
      return false;
    }
  }

  return true;
}
