import fs from 'fs'
import path from 'path'

const file = path.resolve('./src/assets/word_list.txt')

const words = fs
    .readFileSync(file, 'utf-8')
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0)

fetch("http://127.0.0.1:8787/populate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(words),
})

// Add temporary endpoint to index.ts to populate the database 
// Can only handle up to 100000 records for one request
// app.post('/populate', async (c) => {
//   const words: string[] = await c.req.json()

//   const statements = []

//   for (const w of words) {
//     const norm = normalize(w)
//     const len = w.length
//     const mask = wordMask(norm)

//     statements.push(
//       c.env.DB
//         .prepare(
//           "INSERT OR IGNORE INTO words (word, norm, len, mask) VALUES (?, ?, ?, ?)"
//         )
//         .bind(w, norm, len, mask)
//     )
//   }

//   for (let i = 0; i < statements.length; i += 100) {
//     await c.env.DB.batch(statements.slice(i, i + 100))
//   }

//   return c.json({
//     inserted: words.length,
//   })
// })