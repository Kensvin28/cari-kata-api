import { describe, expect, it } from "vitest";
import {
  getWordsFromFile,
  isSimple,
  normalize,
  processWord,
  wordMask,
} from "../src/utils";

describe("Utils Functions", () => {
  it("normalize transforms words with diacritics and lowercases words", () => {
    expect(normalize("à")).toBe("a");
  });
  it("masks words", () => {
    expect(wordMask("a")).toBe(1);
    expect(() => wordMask("123")).toThrow("Invalid character");
  });
  it("check if word does not contain punctuations and spaces", () => {
    expect(isSimple("abdi negara")).toBe(false);
    expect(isSimple("a")).toBe(true);
  });
  it("extract word features", () => {
    expect(processWord("à")).toStrictEqual({
      word: "à",
      norm: "a",
      len: 1,
      mask: 1,
      simple: true,
    });
  });
  it("retrieves words from word list", () => {
    expect(getWordsFromFile("a\nà\nB\n")).toStrictEqual([
      { word: "a", norm: "a", len: 1, mask: 1, simple: true },
      { word: "à", norm: "a", len: 1, mask: 1, simple: true },
      { word: "b", norm: "b", len: 1, mask: 2, simple: true },
    ]);
  });
});
