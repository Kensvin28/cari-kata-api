import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { processWord } from "../src/utils";

const schemaFile = path.resolve("./scripts/create.sql");
const wordFile = path.resolve("./src/assets/word_list.txt");

function runSql(file: string, label: string) {
  const result = spawnSync(
    "wrangler",
    ["d1", "execute", "cari-kata", "--local", `--file=${file}`],
    { stdio: "inherit", shell: false }
  );
  if (result.status !== 0) {
    throw new Error(`wrangler failed at: ${label} (exit ${result.status})`);
  }
}

// 1. Apply schema
console.log("Applying schema...");
runSql(schemaFile, "schema");

// 2. Process words
console.log("Processing words...");
const words = fs
  .readFileSync(wordFile, "utf-8")
  .split("\n")
  .map((w) => w.trim().toLowerCase())
  .filter((w) => w.length > 0)
  .map(processWord);

// 3. Insert in batches via SQL files (avoids shell escaping issues)
console.log("Inserting words...");
const BATCH_SIZE = 100;
const tmpFile = path.resolve("./scripts/tmp-seed.sql");

for (let i = 0; i < words.length; i += BATCH_SIZE) {
  const batch = words.slice(i, i + BATCH_SIZE);

  const sql = batch
    .map(
      ({ word, norm, len, mask, simple }) =>
        `INSERT OR IGNORE INTO words (word, norm, len, mask, is_simple) VALUES ('${word.replaceAll("'", "''")}', '${norm.replaceAll("'", "''")}', ${len}, ${mask}, ${simple ? 1 : 0});`,
    )
    .join("\n");

  try {
    fs.writeFileSync(tmpFile, sql, { encoding: "utf-8", flag: "w" });
  } catch (e) {
    console.error(`writeFileSync failed at batch ${i}–${i + BATCH_SIZE}:`);
    console.error("  First word in batch:", batch[0]?.word);
    console.error("  SQL snippet:", sql.slice(0, 200));
    throw e;
  }

  runSql(tmpFile, `batch ${i}–${i + BATCH_SIZE}`);
  console.log(
    `Inserted ${Math.min(i + BATCH_SIZE, words.length)}/${words.length} words`,
  );
}

if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
console.log("Seed complete!");
