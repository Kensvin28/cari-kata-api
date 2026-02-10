import { Hono } from "hono";
import { getMaskFromChars, normalize, wordMask } from "./utils";
import { cors } from "hono/cors"

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "*"
      if (origin.includes("localhost")) return origin
      if (origin.endsWith(".pages.dev")) return origin
      return null
    },
  })
);

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
    if (fixed.includes(',')) {
      for (const rule of fixed.split(',')) {
        const [pos, char] = rule.split(":");
        sql += " AND SUBSTR(word, ?, 1) = ?";
        params.push(Number(pos), char);
      }
    } else if (fixed.includes('_')) {
      for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i];
        if (char !== '_') {
          sql += " AND SUBSTR(word, ?, 1) = ?";
          params.push(i + 1, char);
        }
      }
    }
  }
  // return the results as array of strings 
  return c.json(
    (await c.env.DB.prepare(sql).bind(...params).all()).results.map((res: any) => res.word)
  )
})

export default app;
