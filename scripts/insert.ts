import fs from 'node:fs'
import path from 'node:path'

const file = path.resolve('./src/assets/word_list.txt')

const words = fs
    .readFileSync(file, 'utf-8')
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0)

fetch("http://127.0.0.1:8787/populate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(words),
})