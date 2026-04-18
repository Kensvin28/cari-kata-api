import { Hono } from "hono";
import { getMaskFromChars, filterWordsByBag } from "./utils";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "*"
      if (origin.includes("http://localhost:5173")) return origin
      if (origin.endsWith("kensvin28.workers.dev")) return origin
      return null
    },
  })
);

app.get("/", (c) => {
  return c.text("Cari Kata");
});

// --- Helpers ---
function parseFixedRules(fixed: string): Array<[number, string]> {
  if (fixed.includes(':')) {
    return fixed.split(',').map(rule => {
      const [pos, char] = rule.split(':');
      return [Number(pos), char];
    });
  }

  // Underscore pattern: "a__b" → positional chars
  return fixed
    .split('')
    .map((char, i) => [i + 1, char] as [number, string])
    .filter(([, char]) => char !== '_');
}

function applyFixed(
  sql: string,
  params: (string | number)[],
  fixed: string | undefined
): { sql: string; inferredLen?: number } {
  if (!fixed) return { sql };

  const rules = parseFixedRules(fixed);
  for (const [pos, char] of rules) {
    sql += ' AND SUBSTR(word, ?, 1) = ?';
    params.push(pos, char);
  }

  const inferredLen = !fixed.includes(':') && fixed.includes('_')
    ? fixed.length
    : undefined;

  return { sql, inferredLen };
}

function applyLen(
  sql: string,
  params: (string | number)[],
  len: string | undefined,
  maxLen: number
): string {
  if (!len) return sql;
  if (Number.isNaN(Number(len)) || Number(len) < 1 || Number(len) > maxLen) {
    throw new Error('Invalid length');
  }
  params.push(Number(len));
  return sql + ' AND len = ?';
}

function applyMask(
  sql: string,
  params: (string | number)[],
  required: string | undefined,
  excluded: string | undefined,
  bag: string | undefined
): string {
  if (required) {
    const mask = getMaskFromChars(required);
    sql += ' AND (mask & ?) = ?';
    params.push(mask, mask);
  }
  if (excluded) {
    sql += ' AND (mask & ?) = 0';
    params.push(getMaskFromChars(excluded));
  }
  if (bag) {
    sql += ' AND (mask & ?) = mask AND len <= ?';
    params.push(getMaskFromChars(bag), bag.length);
  }
  return sql;
}

// --- Route handler ---

app.get('/search', async (c) => {
  let { prefix, len, required, excluded, fixed, bag, simple } = c.req.query();

  prefix = prefix?.toLowerCase() || '';

  if (prefix && !/^[a-zA-Z]+([ a-zA-Z]+)*$/.test(prefix)) {
    return c.json({ error: 'Invalid prefix' }, 400);
  }

  const params: (string | number)[] = [];
  let sql = 'SELECT word FROM words WHERE 1=1';

  const { sql: sqlAfterFixed, inferredLen } = applyFixed(sql, params, fixed);
  sql = sqlAfterFixed;
  if (inferredLen !== undefined) len = String(inferredLen);

  try {
    sql = applyLen(sql, params, len, c.env.MAX_WORD_LENGTH);
  } catch {
    return c.json({ error: 'Invalid length' }, 400);
  }

  if (prefix) {
    sql += ' AND word LIKE ?';
    params.push(`${prefix}%`);
  }

  sql = applyMask(sql, params, required, excluded, bag);

  if (simple && simple !== '0' && simple !== 'false') {
    sql += ' AND is_simple = 1';
  }

  let results = (await c.env.DB.prepare(sql).bind(...params).all())
    .results.map((res: any) => res.word);

  if (bag) results = filterWordsByBag(results, bag);

  return c.json(results);
});

export default app;
