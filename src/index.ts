import { Hono } from "hono";
import { getMaskFromChars, normalize, wordMask } from "./utils";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Cari Kata");
});

app.get('/search', async (c) => {
  // validate first
  let {
    prefix,
    len,
    required,
    excluded,
    fixed,
  } = c.req.query()

  prefix = prefix?.toLowerCase() || '';
  const params: any[] = []

  let sql = "SELECT word FROM words WHERE 1=1";
  
  if (len) {
    sql += ` AND len = ?`;
    params.push(Number(len));
  }
  
  if (prefix) {
    sql += ` AND word LIKE ?`;
    params.push(`${prefix}%`);
  }


  if (required) {
    sql += " AND (mask & ?) = ?";
    const mask = getMaskFromChars(required);
    params.push(mask, mask);
  }

  if (excluded) {
    sql += " AND (mask & ?) = 0";
    const mask = getMaskFromChars(excluded);
    params.push(mask);
  }

  if (fixed) {
    for (const rule of fixed.split(',')) {
      const [pos, char] = rule.split(":");
      sql += " AND SUBSTR(word, ?, 1) = ?";
      params.push(Number(pos), char);
    }
  }
  // return the results as array of strings 
  return c.json(
    (await c.env.DB.prepare(sql).bind(...params).all()).results.map((res: any) => res.word)
  )
})

app.post('/populate', async (c) => {
  const words: string[] = await c.req.json()

  const statements = []

  for (const w of words) {
    const norm = normalize(w)
    const len = w.length
    const mask = wordMask(norm)

    statements.push(
      c.env.DB
        .prepare(
          "INSERT OR IGNORE INTO words (word, norm, len, mask) VALUES (?, ?, ?, ?)"
        )
        .bind(w, norm, len, mask)
    )
  }

  // D1 limit: max 100 statements per batch
  for (let i = 0; i < statements.length; i += 100) {
    await c.env.DB.batch(statements.slice(i, i + 100))
  }

  return c.json({
    inserted: words.length,
  })
})


export default app;
