import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import app from "../src";
import { env } from "cloudflare:workers";
import type { AppType } from "../src";

describe("Search Endpoint", () => {
  const client = testClient<AppType>(app, {
    MAX_WORD_LENGTH: 120,
    DB: env.DB,
  });

  // single inputs
  it("should return search results for prefix input", async () => {
    const res = await client.search.$get({
      query: { prefix: "atol", simple: 1 },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(["atol"]);
  });

  it("should return search results for length input", async () => {
    const res = await client.search.$get({
      query: { len: "23", simple: "1" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(["mentransmigrasilokalkan"]);
  });

  it("should return search results for required input", async () => {
    const res = await client.search.$get({
      query: { required: "mptjwbk", simple: "1" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(["mempertanggungjawabkan"]);
  });

  it("should return search results for excluded input", async () => {
    const res = await client.search.$get({
      query: { excluded: "abcdfghijklmnopqrstuvwxyz", simple: "1" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(["e"]);
  });

  it("should return search results for from input", async () => {
    const res = await client.search.$get({
      query: { bag: "material", len: "8", simple: "1" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.arrayContaining(["melatari", "material"]),
    );
  });

  it("should return search results for fixed input", async () => {
    const res = await client.search.$get({
      query: { fixed: "k_ra", simple: "1" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.arrayContaining(["kara", "kera", "kira", "kura"]),
    );
  });

  // input formats
  it("should return search results for spaced entry", async () => {
    const res = await client.search.$get({
      query: { prefix: "arus listrik" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(["arus listrik"]);
  });

  it("should return empty array for non-existing prefix", async () => {
    const res = await client.search.$get({
      query: { prefix: "nonexistent" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("should return search results for fixed input with colon format", async () => {
    const res = await client.search.$get({
      query: { fixed: "1:a, 2:t, 4:r, 6:n", simple: 1 },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(["aturan"]);
  });

  it("should return search results with fixed input with underline format", async () => {
    const res = await client.search.$get({
      query: { fixed: "k_c_ng", simple: 1, excluded: "eo" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.arrayContaining(["kucing", "kucing", "kacung", "kacang"]),
    );
  });
});
