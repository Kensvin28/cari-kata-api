// Seeded RNG (mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed = Math.trunc(seed);
    seed = Math.trunc(seed + 0x6d2b79f5);
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleWords<T>(arr: T[], n: number, seed: number): T[] {
  const rng = mulberry32(seed);
  const result = [...arr];
  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.slice(0, n);
}
