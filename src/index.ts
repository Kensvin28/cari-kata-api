import { Hono } from "hono";
import { getMaskFromChars } from "./utils";

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

export default app;
