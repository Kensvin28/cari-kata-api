// export async function readWordList(
//   path: string,
//   env?: { ASSETS?: any }
// ): Promise<string | null> {
//   // Cloudflare Workers
//   if (env?.ASSETS) {
//     const res = await env.ASSETS.fetch(
//       `${path}`
//     )
//     if (!res.ok) return null
//     return await res.text()
//   }

//   // Bun fallback for dev
//   if (typeof Bun !== 'undefined') {
//     const file = Bun.file(`${path}`)
//     if (await file.exists()) {
//       return await file.text()
//     }
//   }
//   return null
// }

// Create a bitmask from a string of characters, where each bit represents the presence of a letter
export function getMaskFromChars(chars: string): number {
    let mask = 0;
    for (const char of chars) {
      mask |= 1 << (char.charCodeAt(0) - 97)
    }
    return mask
}

// Normalize a word by converting to lowercase and removing diacritics
export function normalize(word: string) {
  return String.prototype.normalize.call(word.toLowerCase(), 'NFD').replace(/[\u0300-\u036f]/g, '')
}

// Create a bitmask for a word, where each bit represents the presence of a letter
export function wordMask(norm: string) {
  let mask = 0
  for (const c of new Set(norm)) {
    mask |= 1 << (c.charCodeAt(0) - 97)
  }
  return mask
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
function canMakeWord(word: string, availableLetters: Record<string, number>): boolean {
  const wordCounts = getLetterCounts(word);
  
  for (const [letter, count] of Object.entries(wordCounts)) {
    if (!availableLetters[letter] || availableLetters[letter] < count) {
      return false;
    }
  }
  
  return true;
}

export function filterWordsByBag(words: string[], bag: string): string[] {
  const availableLetters = getLetterCounts(bag);
  return words.filter(word => canMakeWord(word, availableLetters));
}