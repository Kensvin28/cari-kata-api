import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { processWord } from "../src/utils";

const schemaFile = path.resolve("./scripts/create.sql");
const wordFile = path.resolve("./src/assets/word_list.txt");

// 1. Apply schema
console.log("Applying schema...");
execSync(`wrangler d1 execute cari-kata --local --file=${schemaFile}`, {
  stdio: "inherit",
});

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
        `INSERT OR IGNORE INTO words (word, norm, len, mask, is_simple) VALUES ('${word.replace(/'/g, "''")}', '${norm.replace(/'/g, "''")}', ${len}, ${mask}, ${simple ? 1 : 0});`,
    )
    .join("\n");

  fs.writeFileSync(tmpFile, sql);
  execSync(`wrangler d1 execute cari-kata --local --file=${tmpFile}`, {
    stdio: "inherit",
  });

  console.log(
    `Inserted ${Math.min(i + BATCH_SIZE, words.length)}/${words.length} words`,
  );
}

fs.unlinkSync(tmpFile);
console.log("Seed complete!");
