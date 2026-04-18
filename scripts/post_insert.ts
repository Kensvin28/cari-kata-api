// Temporary endpoint to populate the database 
// Can only handle up to 100000 records for one request
import { normalize, wordMask, isSimple } from '../src/utils'

app.post('/populate', async (c) => {
  const words: string[] = await c.req.json()

  const statements = []

  for (const w of words) {
    const norm = normalize(w)
    const len = w.length
    const mask = wordMask(norm)
    const simple = isSimple(norm) 

    statements.push(
      c.env.DB
        .prepare(
          "INSERT OR IGNORE INTO words (word, norm, len, mask, simple) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(w, norm, len, mask, simple)
    )
  }

  for (let i = 0; i < statements.length; i += 100) {
    await c.env.DB.batch(statements.slice(i, i + 100))
  }

  return c.json({
    inserted: words.length,
  })
})