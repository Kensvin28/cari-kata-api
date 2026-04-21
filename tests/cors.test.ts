import { describe, it, expect } from "vitest";
import { resolveOrigin } from "../src/cors";
import app from "../src";

describe("CORS origin resolver", () => {
  it("returns * when origin is undefined", () => {
    expect(resolveOrigin(undefined)).toBe("*");
  });

  it("returns * when origin is empty string", () => {
    expect(resolveOrigin("")).toBe("*");
  });

  it("allows localhost:5173", () => {
    expect(resolveOrigin("http://localhost:5173")).toBe(
      "http://localhost:5173",
    );
  });

  it("allows subpaths on localhost:5173", () => {
    expect(resolveOrigin("http://localhost:5173/app")).toBe(
      "http://localhost:5173/app",
    );
  });

  it("allows kensvin28.workers.dev origins", () => {
    expect(resolveOrigin("https://kensvin28.workers.dev")).toBe(
      "https://kensvin28.workers.dev",
    );
  });

  it("allows subdomain.workers.dev origins", () => {
    expect(resolveOrigin("https://cari-kata.kensvin28.workers.dev")).toBe(
      "https://cari-kata.kensvin28.workers.dev",
    );
  });

  it("blocks unknown origins", () => {
    expect(resolveOrigin("https://evil.com")).toBeNull();
  });

  it("blocks origins that merely contain kensvin28.workers.dev", () => {
    expect(
      resolveOrigin("https://attacker.com/kensvin28.workers.dev"),
    ).toBeNull();
  });
});

describe("CORS headers in responses", () => {
  it("sets CORS header for workers.dev origin", async () => {
    const res = await app.request("/", {
      headers: { Origin: "https://kensvin28.workers.dev" },
    });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://kensvin28.workers.dev",
    );
  });

  it("omits CORS header for blocked origin", async () => {
    const res = await app.request("/", {
      headers: { Origin: "https://evil.com" },
    });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
