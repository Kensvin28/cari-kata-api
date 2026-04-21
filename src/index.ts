import { Hono } from "hono";
import { getMaskFromChars, filterWordsByBag } from "./utils";
import { cors } from "hono/cors";
import { InvalidValueError, LengthError, ParamError } from "./errors";
import { resolveOrigin } from "./cors";

function parseFixedRules(fixed: string): Array<[number, string]> {
  // Colon pattern: "1:a, 2:b"
  if (fixed.includes(":")) {
    return fixed.split(",").map((rule) => {
      const [pos, char] = rule.split(":");
      return [Number(pos), char];
    });
  }

  // Underscore pattern: "a__b" → positional chars
  return fixed
    .split("")
    .map((char, i) => [i + 1, char] as [number, string])
    .filter(([, char]) => char !== "_");
}

function applyFixed(
  sql: string,
  params: (string | number)[],
  fixed: string | undefined,
): { sql: string; inferredLen?: number } {
  if (!fixed) return { sql };

  const rules = parseFixedRules(fixed);
  for (const [pos, char] of rules) {
    sql += " AND SUBSTR(word, ?, 1) = ?";
    params.push(pos, char);
  }

  const inferredLen =
    !fixed.includes(":") && fixed.includes("_") ? fixed.length : undefined;

  return { sql, inferredLen };
}

function applyPrefix(
  sql: string,
  params: (string | number)[],
  prefix: string | undefined,
): string {
  if (prefix) {
    sql += " AND word LIKE ?";
    params.push(`${prefix}%`);
  }

  return sql;
}

function applyLen(
  sql: string,
  params: (string | number)[],
  len: string | undefined,
  maxLen: number,
): string {
  if (!len) return sql;
  if (Number.isNaN(Number(len)) || Number(len) < 1 || Number(len) > maxLen) {
    throw new LengthError("Invalid length");
  }
  params.push(Number(len));
  return sql + " AND len = ?";
}

function applyRequired(
  sql: string,
  params: (string | number)[],
  required: string | undefined,
): string {
  if (required) {
    const mask = getMaskFromChars(required);
    sql += " AND (mask & ?) = ?";
    params.push(mask, mask);
  }
  return sql;
}

function applyExcluded(
  sql: string,
  params: (string | number)[],
  excluded: string | undefined,
): string {
  if (excluded) {
    const mask = getMaskFromChars(excluded);
    sql += " AND (mask & ?) = 0";
    params.push(mask);
  }
  return sql;
}

function applyBag(
  sql: string,
  params: (string | number)[],
  bag: string | undefined,
): string {
  if (bag) {
    const mask = getMaskFromChars(bag);
    sql += " AND (mask & ?) = mask AND len <= ?";
    params.push(mask, bag.length);
  }
  return sql;
}

function applySimple(sql: string, simple: string | undefined): string {
  if (simple) {
    if (simple === "1" || simple === "true") {
      sql += " AND is_simple = 1";
    } else if (simple !== "0" && simple !== "false") {
      throw new InvalidValueError("Invalid simple value");
    }
  }
  return sql;
}

function validateQueryParam(query: Record<string, string>): void {
  const VALID_KEYS = new Set([
    "prefix",
    "len",
    "required",
    "excluded",
    "fixed",
    "bag",
    "simple",
  ]);
  const invalidKeys = Object.keys(query).filter((key) => !VALID_KEYS.has(key));
  if (invalidKeys.length > 0) {
    throw new ParamError(
      `Unknown query parameter(s): ${invalidKeys.join(", ")}`,
    );
  }
}

const app = new Hono()
  .use(
    "*",
    cors({
      origin: (origin) => resolveOrigin(origin),
    }),
  )
  .get("/", (c) => {
    return c.text("Cari Kata");
  })
  .get("/search", async (c) => {
    const query = c.req.query();
    try {
      validateQueryParam(query);
    } catch (e) {
      if (e instanceof ParamError) {
        return c.json({ error: e.message }, 400);
      }
    }

    let { prefix, len, required, excluded, fixed, bag, simple } = query;

    prefix = prefix?.toLowerCase() || "";

    if (prefix && !/^[a-zA-Z]+([ a-zA-Z]+)*$/.test(prefix)) {
      return c.json({ error: "Invalid prefix" }, 400);
    }

    const params: (string | number)[] = [];
    let sql = "SELECT word FROM words WHERE 1=1";

    const { sql: sqlAfterFixed, inferredLen } = applyFixed(sql, params, fixed);
    sql = sqlAfterFixed;
    if (inferredLen !== undefined) len = String(inferredLen);

    try {
      sql = applyLen(sql, params, len, c.env.MAX_WORD_LENGTH);
      sql = applyPrefix(sql, params, prefix);
      sql = applyRequired(sql, params, required);
      sql = applyExcluded(sql, params, excluded);
      sql = applyBag(sql, params, bag);
      sql = applySimple(sql, simple);
    } catch (e) {
      if (e instanceof LengthError) {
        return c.json({ error: "Invalid length" }, 400);
      }
      if (
        e instanceof InvalidValueError &&
        e.message === "Invalid simple value"
      ) {
        return c.json({ error: "Invalid simple value" }, 400);
      }
      if (e instanceof InvalidValueError && e.message === "Invalid character") {
        return c.json({ error: "Invalid character" }, 400);
      }
    }

    let results = (
      await c.env.DB.prepare(sql)
        .bind(...params)
        .all()
    ).results.map((res: any) => res.word);

    if (bag) results = filterWordsByBag(results, bag);

    return c.json(results);
  });

export default app;
export type AppType = typeof app;
