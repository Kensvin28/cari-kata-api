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

export function getMaskFromChars(chars: string): number {
    let mask = 0;
    for (const char of chars) {
      mask |= 1 << (char.charCodeAt(0) - 97)
    }
    return mask
}