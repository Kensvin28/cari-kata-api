import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import app from "../src";
import { env } from "cloudflare:workers";
import type { AppType } from "../src";

describe("Edge Cases", () => {
  const client = testClient<AppType>(app, {
    MAX_WORD_LENGTH: 120,
    DB: env.DB,
  });
  it("should return error for invalid query parameter", async () => {
    const res = await client.search.$get({
      query: { key: "invalid" },
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Unknown query parameter(s): key",
    });
  });
  it("should return error for invalid prefix", async () => {
    const res = await client.search.$get({
      query: { prefix: "invalid-prefix!" },
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid prefix" });
  });

  it("should return error for invalid length", async () => {
    const res = await client.search.$get({
      query: { len: "-5" },
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid length" });
  });

  it("should return error for invalid simple", async () => {
    const res = await client.search.$get({
      query: { simple: "invalid" },
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid simple value" });
  });

  // TODO
  // it("should return error for invalid bag", async () => {
  //   const res = await client.search.$get({
  //     query: { bag: "invalid" },
  //   });
  //   expect(res.status).toBe(400);
  //   expect(await res.json()).toEqual({ error: "Invalid bag" });
  // });

  it("should return error for length exceeding max", async () => {
    const res = await client.search.$get({
      query: { len: "200" },
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid length" });
  });

  // TODO
  // it("should return error for bag length exceeding max", async () => {
  //   const res = await client.search.$get({
  //     query: { bag: "a".repeat(200) },
  //   });
  //   expect(res.status).toBe(400);
  //   expect(await res.json()).toEqual({ error: "Invalid bag" });
  // });

  it("should return error for non-numeric length", async () => {
    const res = await client.search.$get({
      query: { len: "not-a-number" },
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid length" });
  });

  it("should return error for non-numeric simple", async () => {
    const res = await client.search.$get({
      query: { simple: "not-a-number" },
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid simple value" });
  });

  // it("should return error for invalid fixed", async () => {
  //   // TODO
  // });

  it("should return search results for required input", async () => {
    const res = await client.search.$get({
      query: { required: "123", simple: "1" },
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid character" });
  });
});
