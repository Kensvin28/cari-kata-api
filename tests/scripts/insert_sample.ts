import fs from "node:fs";
import path from "node:path";
import { getWordsFromFile } from "../../src/utils";
import { sampleWords } from "./sample_words";

const wordFile = path.resolve("./src/assets/word_list.txt");
const SAMPLE_SIZE = 112651; // Use all words for seeding
const SEED = 42;

const allWords = getWordsFromFile(fs.readFileSync(wordFile, "utf-8"));
const words = sampleWords(allWords, SAMPLE_SIZE, SEED);
const tmpFile = path.resolve("./migrations/insert_sample_words.sql");
let sql = "";
for (const w of words) {
  const { word, norm, len, mask, simple } = w;
  sql += `INSERT OR IGNORE INTO words (word, norm, len, mask, is_simple) VALUES ('${word.replaceAll("'", "''")}', '${norm.replaceAll("'", "''")}', ${len}, ${mask}, ${simple ? 1 : 0});\n`;
}
fs.writeFileSync(tmpFile, sql);
console.log("Seed complete!");
