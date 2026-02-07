import { env } from 'bun'
import fs from 'fs'
import path from 'path'
import Database from 'bun:sqlite'

const db = new Database(env.DB)

const file = path.resolve('./src/assets/word_list.txt')

function normalize(word: string) {
  return String.prototype.normalize.call(word.toLowerCase(), 'NFD').replace(/[\u0300-\u036f]/g, '')
}

function wordMask(norm: string) {
  let mask = 0
  for (const c of new Set(norm)) {
    mask |= 1 << (c.charCodeAt(0) - 97)
  }
  return mask
}

const words = fs
    .readFileSync(file, 'utf-8')
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0)

const CHUNK = 10
const stmt = db.prepare('INSERT INTO words (word, norm, len, mask) VALUES (?, ?, ?, ?)')
const insertMany = db.transaction(() => {
  for (let i = 0; i < words.length; i += CHUNK) {
    const chunk = words.slice(i, i + CHUNK)
    for (const w of chunk) {
      const norm = normalize(w)
      const len = w.length
      const mask = wordMask(norm)
      stmt.run(w, norm, len, mask)
    }
  }
})

insertMany()
console.log(`Inserted ${words.length} words into the database`)

// sql += words.map(w =>
//   `('${w}', '${normalize(w)}', ${w.length}, ${wordMask(w)})`
// ).join(',\n')

// sql += ';'

// fs.writeFileSync('import.sql', sql)
// console.log(`Generated ${words.length} rows`)
